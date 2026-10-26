"use client";

import { useActionState, useState } from "react";
import type { FormState } from "../actions";
import type { Property } from "@/lib/types";

type Values = Record<string, string | boolean>;

const EMPTY: Values = {
  name: "", address: "", tenant_name: "", tenant_email: "", tenant_phone: "",
  rent: "", signed_date: "", start_date: "", duration_years: "1",
  update_clause: true, update_index: "IPC", update_clause_text: "",
  landlord_is_company: false, payment_day: "5", notes: "",
};

function fromProperty(p: Property): Values {
  const v: Values = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) {
    const val = p[key as keyof Property];
    if (val !== null && val !== undefined) v[key] = typeof val === "boolean" ? val : String(val);
  }
  return v;
}

export function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  property?: Property;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [values, setValues] = useState<Values>(property ? fromProperty(property) : EMPTY);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState<{ ok: boolean; text: string; warnings?: string[] } | null>(null);

  const set = (k: string, v: string | boolean) => setValues((prev) => ({ ...prev, [k]: v }));
  const text = (k: string) => ({
    id: k,
    name: k,
    value: String(values[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value),
  });

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setExtractMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se ha podido leer el contrato.");
      const f = json.fields as Record<string, unknown>;
      setValues((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(f)) {
          if (v === null || v === undefined || !(k in EMPTY)) continue;
          next[k] = typeof v === "boolean" ? v : String(v);
        }
        if (!next.name && typeof f.address === "string") next.name = f.address.split(",")[0];
        return next;
      });
      setExtractMsg({ ok: true, text: "Hemos rellenado la ficha con los datos del contrato. Revísalos antes de guardar.", warnings: json.warnings });
    } catch (err) {
      setExtractMsg({ ok: false, text: err instanceof Error ? err.message : "Error al leer el contrato." });
    } finally {
      setExtracting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Rellenar desde el contrato (PDF)</h2>
        <p className="muted small">
          La IA lee el contrato y extrae renta, fechas y cláusula de actualización. No guardamos el PDF.
        </p>
        <input type="file" accept="application/pdf" onChange={onPdf} disabled={extracting} />
        {extracting && <p className="muted small">Leyendo el contrato… puede tardar hasta un minuto.</p>}
        {extractMsg && <p className={extractMsg.ok ? "ok" : "error"}>{extractMsg.text}</p>}
        {extractMsg?.warnings && extractMsg.warnings.length > 0 && (
          <ul className="small muted">{extractMsg.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        )}
      </div>

      <form action={formAction} className="card">
        <h2>Piso e inquilino</h2>
        <div className="field"><label htmlFor="name">Nombre del piso</label><input {...text("name")} placeholder="Piso Centro" required /></div>
        <div className="field"><label htmlFor="address">Dirección</label><input {...text("address")} /></div>
        <div className="grid">
          <div className="field"><label htmlFor="tenant_name">Inquilino/a</label><input {...text("tenant_name")} /></div>
          <div className="field"><label htmlFor="tenant_email">Email del inquilino</label><input type="email" {...text("tenant_email")} /></div>
          <div className="field">
            <label htmlFor="tenant_phone">Móvil (WhatsApp) <span className="hint">con prefijo, p. ej. 34600111222</span></label>
            <input {...text("tenant_phone")} inputMode="tel" />
          </div>
        </div>

        <h2 style={{ marginTop: 12 }}>Contrato</h2>
        <div className="grid">
          <div className="field"><label htmlFor="rent">Renta mensual (€)</label><input {...text("rent")} inputMode="decimal" required /></div>
          <div className="field"><label htmlFor="payment_day">Día de pago</label><input type="number" min={1} max={28} {...text("payment_day")} /></div>
          <div className="field"><label htmlFor="signed_date">Fecha de firma</label><input type="date" {...text("signed_date")} required /></div>
          <div className="field">
            <label htmlFor="start_date">Inicio del contrato <span className="hint">si es distinta de la firma</span></label>
            <input type="date" {...text("start_date")} />
          </div>
          <div className="field"><label htmlFor="duration_years">Duración pactada (años)</label><input type="number" min={1} max={30} {...text("duration_years")} /></div>
        </div>
        <div className="field">
          <label className="check">
            <input type="checkbox" name="landlord_is_company" checked={Boolean(values.landlord_is_company)} onChange={(e) => set("landlord_is_company", e.target.checked)} />
            El arrendador es una empresa (prórroga obligatoria de 7 años)
          </label>
        </div>

        <h2 style={{ marginTop: 12 }}>Actualización de renta</h2>
        <div className="field">
          <label className="check">
            <input type="checkbox" name="update_clause" checked={Boolean(values.update_clause)} onChange={(e) => set("update_clause", e.target.checked)} />
            El contrato prevé actualizar la renta cada año
          </label>
        </div>
        <div className="field">
          <label htmlFor="update_index">Índice pactado</label>
          <select {...text("update_index")}>
            <option value="IPC">IPC</option>
            <option value="IRAV">IRAV</option>
            <option value="OTRO">Otro índice</option>
            <option value="NINGUNO">Ninguno</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="update_clause_text">Texto de la cláusula <span className="hint">opcional</span></label>
          <textarea rows={3} {...text("update_clause_text")} />
        </div>
        <div className="field"><label htmlFor="notes">Notas</label><textarea rows={2} {...text("notes")} /></div>

        <button className="btn" disabled={pending}>{pending ? "Guardando…" : submitLabel}</button>
        {state?.error && <p className="error">{state.error}</p>}
      </form>
    </div>
  );
}
