// Extrae los datos clave de un contrato de alquiler en PDF con Claude.
// El PDF solo se envía a la API de Anthropic para la extracción; no se guarda.

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { firstOfMonth, today } from "@/lib/dates";
import { EXTRACTION_LIMIT } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 10 * 1024 * 1024;

const nullable = (type: string, description: string) => ({ type: [type, "null"], description });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "address", "tenant_name", "rent", "signed_date", "start_date", "duration_years",
    "update_clause", "update_index", "update_clause_text", "landlord_is_company", "payment_day", "warnings",
  ],
  properties: {
    address: nullable("string", "Dirección completa de la vivienda arrendada"),
    tenant_name: nullable("string", "Nombre completo del arrendatario (o arrendatarios separados por ' y ')"),
    rent: nullable("number", "Renta mensual en euros, sin gastos ni fianza"),
    signed_date: nullable("string", "Fecha de firma del contrato, formato YYYY-MM-DD"),
    start_date: nullable("string", "Fecha de inicio del arrendamiento, formato YYYY-MM-DD"),
    duration_years: nullable("integer", "Duración inicial pactada en años (redondea hacia arriba si está en meses)"),
    update_clause: { type: "boolean", description: "true si el contrato prevé actualizar la renta anualmente" },
    update_index: {
      type: "string",
      enum: ["IPC", "IRAV", "OTRO", "NINGUNO"],
      description: "Índice con el que se actualiza la renta; NINGUNO si no hay cláusula de actualización",
    },
    update_clause_text: nullable("string", "Texto literal de la cláusula de actualización de la renta"),
    landlord_is_company: { type: "boolean", description: "true si el arrendador es una persona jurídica (empresa)" },
    payment_day: nullable("integer", "Día del mes en que vence el pago (1-28); si dice 'primeros cinco días', usa 5"),
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Dudas o datos ambiguos que el propietario debe revisar, en español y en frases cortas",
    },
  },
} as const;

const Extracted = z.object({
  address: z.string().nullable(),
  tenant_name: z.string().nullable(),
  rent: z.number().nullable(),
  signed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  duration_years: z.number().int().nullable(),
  update_clause: z.boolean(),
  update_index: z.enum(["IPC", "IRAV", "OTRO", "NINGUNO"]),
  update_clause_text: z.string().nullable(),
  landlord_is_company: z.boolean(),
  payment_day: z.number().int().nullable(),
  warnings: z.array(z.string()),
});

const PROMPT = `Eres un asistente que lee contratos de arrendamiento de vivienda habitual en España (LAU).
Extrae los datos del contrato adjunto siguiendo el esquema. Reglas:
- Si un dato no aparece o no estás seguro, devuelve null y explica la duda en "warnings".
- Fechas en formato YYYY-MM-DD.
- La renta es la mensual pactada, sin gastos de comunidad, suministros ni fianza.
- Para update_index: "IPC" si la cláusula usa el Índice de Precios de Consumo, "IRAV" si usa el Índice de Referencia para la Actualización de Arrendamientos de Vivienda, "OTRO" si usa otro índice o un porcentaje fijo, y "NINGUNO" si no hay actualización.
- Si el documento no es un contrato de alquiler de vivienda, deja los campos en null y dilo en "warnings".`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicia sesión para usar la extracción." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Adjunta el contrato en PDF." }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "El archivo debe ser un PDF." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "El PDF supera los 10 MB." }, { status: 400 });

  // Límite mensual: cada intento cuenta, para que no se pueda abusar reintentando.
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", auth.user.id).single();
  const limit = EXTRACTION_LIMIT[profile?.plan === "pro" ? "pro" : "free"];
  const { count } = await supabase
    .from("extractions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${firstOfMonth(today())}T00:00:00Z`);
  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Has usado tus ${limit} lecturas de contrato de este mes. Rellena la ficha a mano${profile?.plan === "pro" ? "" : " o pasa a Pro"}.` },
      { status: 429 },
    );
  }
  await supabase.from("extractions").insert({ owner_id: auth.user.id });

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Si el modelo rechaza la petición, la API la reintenta en un modelo alternativo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "No hemos podido procesar este documento." }, { status: 422 });
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("Respuesta sin texto");
    const parsed = Extracted.safeParse(JSON.parse(text.text));
    if (!parsed.success) throw new Error("Respuesta con formato inesperado");

    const { warnings, rent, ...fields } = parsed.data;
    return NextResponse.json({
      fields: {
        ...fields,
        rent: rent === null ? null : String(rent).replace(".", ","),
        update_clause: fields.update_clause && fields.update_index !== "NINGUNO",
      },
      warnings,
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Hay mucha demanda ahora mismo. Prueba en un minuto." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message);
      return NextResponse.json({ error: "El servicio de lectura no está disponible. Rellena la ficha a mano." }, { status: 502 });
    }
    console.error("Extract error", err);
    return NextResponse.json({ error: "No hemos podido leer el contrato. Rellena la ficha a mano." }, { status: 500 });
  }
}
