"use server";

import { createClient } from "@/lib/supabase/server";

export async function joinWaitlist(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Revisa el email." };
  if (formData.get("consent") !== "on") return { error: "Necesitamos tu consentimiento para escribirte." };

  const flats = Number(formData.get("flats") ?? 1);
  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({
    email,
    flats,
    how_they_update: String(formData.get("how") ?? "").slice(0, 1000) || null,
  });
  // 23505 = ya estaba apuntado: para el usuario es un éxito igualmente.
  if (error && error.code !== "23505") return { error: "No hemos podido apuntarte. Inténtalo de nuevo." };
  return { ok: true, flats };
}
