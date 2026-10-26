"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, requireUser } from "@/lib/supabase/server";
import { FREE_PROPERTY_LIMIT, PRO_PROPERTY_LIMIT } from "@/lib/types";
import { firstOfMonth, today } from "@/lib/dates";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type FormState = { error?: string } | null;

const INDEXES = ["IPC", "IRAV", "OTRO", "NINGUNO"];

function readProperty(formData: FormData) {
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const rent = Number(String(formData.get("rent") ?? "").replace(",", "."));
  const index = str("update_index") ?? "IPC";
  const values = {
    name: str("name"),
    address: str("address"),
    tenant_name: str("tenant_name"),
    tenant_email: str("tenant_email"),
    tenant_phone: str("tenant_phone"),
    rent,
    signed_date: str("signed_date"),
    start_date: str("start_date") ?? str("signed_date"),
    duration_years: Number(str("duration_years") ?? 1),
    update_clause: formData.get("update_clause") === "on" && index !== "NINGUNO",
    update_index: index,
    update_clause_text: str("update_clause_text"),
    landlord_is_company: formData.get("landlord_is_company") === "on",
    payment_day: Number(str("payment_day") ?? 5),
    notes: str("notes"),
  };

  if (!values.name) return { error: "Ponle un nombre al piso (por ejemplo, «Piso Centro»)." };
  if (!Number.isFinite(rent) || rent <= 0) return { error: "La renta mensual no es válida." };
  if (!values.signed_date) return { error: "Falta la fecha de firma del contrato." };
  if (!INDEXES.includes(index)) return { error: "Índice de actualización no válido." };
  if (values.payment_day < 1 || values.payment_day > 28) return { error: "El día de pago debe estar entre 1 y 28." };
  return { values };
}

export async function createProperty(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user, profile } = await requireUser();
  const parsed = readProperty(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { count } = await supabase.from("properties").select("id", { count: "exact", head: true });
  const limit = profile.plan === "pro" ? PRO_PROPERTY_LIMIT : FREE_PROPERTY_LIMIT;
  if ((count ?? 0) >= limit) {
    return {
      error: profile.plan === "pro"
        ? `Tu plan incluye hasta ${PRO_PROPERTY_LIMIT} pisos. Escríbenos si necesitas más.`
        : "El plan gratuito incluye 1 piso. Pasa a Pro para añadir hasta 5.",
    };
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...parsed.values, owner_id: user.id })
    .select("id")
    .single();
  if (error) return { error: "No se ha podido guardar. Revisa los datos." };
  redirect(`/app/propiedades/${data.id}`);
}

export async function updateProperty(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = readProperty(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { error } = await supabase.from("properties").update(parsed.values).eq("id", id);
  if (error) return { error: "No se ha podido guardar. Revisa los datos." };
  redirect(`/app/propiedades/${id}`);
}

export async function deleteProperty(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("properties").delete().eq("id", id);
  redirect("/app");
}

export async function applyRentUpdate(propertyId: string, effectiveDate: string, newRent: number, pct: number) {
  const { supabase, user } = await requireUser();
  const { data: p } = await supabase.from("properties").select("rent").eq("id", propertyId).single();
  if (!p) return;
  const { data: existing } = await supabase
    .from("rent_changes")
    .select("id")
    .eq("property_id", propertyId)
    .eq("effective_date", effectiveDate)
    .maybeSingle();
  if (!existing) {
    await supabase.from("rent_changes").insert({
      owner_id: user.id,
      property_id: propertyId,
      effective_date: effectiveDate,
      old_rent: p.rent,
      new_rent: newRent,
      pct,
    });
    await supabase.from("properties").update({ rent: newRent }).eq("id", propertyId);
  }
  revalidatePath(`/app/propiedades/${propertyId}`);
  redirect(`/app/propiedades/${propertyId}?aplicada=1`);
}

export async function markPaid(propertyId: string, period: string, amount: number) {
  const { supabase, user } = await requireUser();
  await supabase.from("payments").upsert(
    { owner_id: user.id, property_id: propertyId, period: firstOfMonth(period), amount, paid_at: today() },
    { onConflict: "property_id,period" },
  );
  revalidatePath(`/app/propiedades/${propertyId}`);
  revalidatePath("/app");
}

export async function unmarkPaid(propertyId: string, period: string) {
  const { supabase } = await requireUser();
  await supabase.from("payments").delete().eq("property_id", propertyId).eq("period", period);
  revalidatePath(`/app/propiedades/${propertyId}`);
  revalidatePath("/app");
}
