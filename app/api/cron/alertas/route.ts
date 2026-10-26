// Cron diario (vercel.json): envía al propietario un email con las alertas que vencen
// dentro de 30, 7 o 1 días, o hoy. Usa la API REST de Resend.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { propertyAlerts, type Alert } from "@/lib/alerts";
import { addMonths, firstOfMonth, formatShort, today } from "@/lib/dates";
import type { Payment, Profile, Property, RentChange } from "@/lib/types";

export const runtime = "nodejs";

const NOTIFY_ON_DAYS = new Set([30, 7, 1, 0]);

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function sendEmail(to: string, alerts: Alert[]) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const items = alerts
    .map((a) => `<li><strong>${escapeHtml(a.title)}</strong> · ${escapeHtml(a.propertyName)} · ${formatShort(a.date)}<br>${escapeHtml(a.detail)}</li>`)
    .join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ALERTS_FROM_EMAIL,
      to,
      subject: alerts.length === 1 ? `Alquiler en Regla: ${alerts[0].title}` : `Alquiler en Regla: ${alerts.length} avisos`,
      html: `<p>Hola:</p><ul>${items}</ul><p><a href="${site}/app">Abrir mi panel</a></p>
             <p style="color:#666;font-size:12px">Información general, no asesoramiento legal.</p>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: props }, { data: pays }, { data: profiles }, { data: changes }] = await Promise.all([
    admin.from("properties").select("*"),
    admin.from("payments").select("*").gte("period", addMonths(firstOfMonth(today()), -12)),
    admin.from("profiles").select("id,email"),
    admin.from("rent_changes").select("*"),
  ]);

  const now = today();
  const byOwner = new Map<string, Alert[]>();
  for (const p of (props ?? []) as Property[]) {
    const due = propertyAlerts(
      p,
      ((pays ?? []) as Payment[]).filter((x) => x.property_id === p.id),
      now,
      ((changes ?? []) as RentChange[]).filter((c) => c.property_id === p.id),
    )
      .filter((a) => NOTIFY_ON_DAYS.has(a.daysLeft) || (a.kind === "cobro" && a.daysLeft === -3));
    if (due.length) byOwner.set(p.owner_id, [...(byOwner.get(p.owner_id) ?? []), ...due]);
  }

  let sent = 0;
  const failed: string[] = [];
  for (const profile of (profiles ?? []) as Pick<Profile, "id" | "email">[]) {
    const alerts = byOwner.get(profile.id);
    if (!alerts || !profile.email) continue;
    try {
      await sendEmail(profile.email, alerts);
      sent++;
    } catch (err) {
      console.error(err);
      failed.push(profile.id);
    }
  }
  return NextResponse.json({ sent, failed: failed.length });
}
