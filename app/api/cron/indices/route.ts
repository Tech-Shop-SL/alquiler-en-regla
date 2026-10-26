// Cron diario (vercel.json): guarda los últimos datos de IPC e IRAV del INE en index_values.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchIneSeries } from "@/lib/ine";
import { isAuthorizedCron } from "@/lib/cron";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const result: Record<string, number | string> = {};
  for (const name of ["IPC", "IRAV"] as const) {
    try {
      const values = await fetchIneSeries(name);
      const { error } = await admin
        .from("index_values")
        .upsert(values.map((v) => ({ ...v, fetched_at: new Date().toISOString() })), { onConflict: "index_name,period" });
      if (error) throw error;
      result[name] = values.length;
    } catch (err) {
      console.error(err);
      result[name] = "error";
    }
  }
  return NextResponse.json(result);
}
