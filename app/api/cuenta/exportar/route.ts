// Portabilidad (art. 20 RGPD): descarga de todos los datos del usuario en JSON.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { today } from "@/lib/dates";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const [profile, properties, payments, rentChanges] = await Promise.all([
    supabase.from("profiles").select("email,full_name,plan,created_at").eq("id", auth.user.id).single(),
    supabase.from("properties").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("rent_changes").select("*"),
  ]);

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      properties: properties.data ?? [],
      payments: payments.data ?? [],
      rent_changes: rentChanges.data ?? [],
    },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="alquiler-en-regla-${today()}.json"`,
    },
  });
}
