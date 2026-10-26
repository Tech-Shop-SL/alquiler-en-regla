import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { nextAnniversary, today } from "@/lib/dates";
import { computeUpdate, IRAV_FROM, LEY_VIVIENDA_CUTOFF } from "@/lib/rules";
import { buildLetter } from "@/lib/letter";
import { latestPublished } from "@/lib/indices";
import { formatLong, formatMonth } from "@/lib/dates";
import type { IndexValue, Property, RentChange } from "@/lib/types";
import { applyRentUpdate } from "../../../actions";
import { PrintButton } from "./PrintButton";

const INE_IPC = "https://www.ine.es/calcula/";
const INE_IRAV = "https://www.ine.es/jaxiT3/Tabla.htm?t=72975";

function num(v: string | undefined): number | null {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default async function UpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const { supabase, profile } = await requireUser();
  const [{ data }, { data: changeData }, { data: indexData }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).single(),
    supabase.from("rent_changes").select("*").eq("property_id", id),
    supabase.from("index_values").select("*").gte("period", "2022-01-01"),
  ]);
  if (!data) notFound();
  const p = data as Property;
  const indices = (indexData ?? []) as IndexValue[];

  const anniversary = q.anniversary || nextAnniversary(p.start_date, today());
  // Si la subida de este aniversario ya se aplicó, se calcula sobre la renta anterior para no encadenarla dos veces.
  const applied = ((changeData ?? []) as RentChange[]).find((c) => c.effective_date === anniversary);
  const baseRent = applied ? Number(applied.old_rent) : Number(p.rent);

  const needsIrav = p.update_index === "IRAV" || (p.signed_date > LEY_VIVIENDA_CUTOFF && anniversary >= IRAV_FROM);
  const ipcData = p.update_index === "IPC" ? latestPublished(indices, "IPC", anniversary) : null;
  const iravData = needsIrav ? latestPublished(indices, "IRAV", anniversary) : null;
  const indexDefault = q.indexPct ?? (ipcData ? String(ipcData.pct).replace(".", ",") : "");
  const iravDefault = q.iravPct ?? (iravData ? String(iravData.pct).replace(".", ",") : "");

  const submitted = q.calc === "1";
  const result = submitted
    ? computeUpdate({
        signedDate: p.signed_date,
        anniversary,
        rent: baseRent,
        updateClause: p.update_clause,
        index: p.update_index,
        indexPct: num(q.indexPct),
        iravPct: num(q.iravPct),
        rentAboveReference: q.aboveRef === "on",
      })
    : null;
  const landlordName = q.landlord || profile.full_name || "";
  const city = q.city || "";
  const letter =
    result?.allowed && result.missing.length === 0
      ? buildLetter({
          landlordName: landlordName || "[Tu nombre]",
          city: city || "[Ciudad]",
          date: today(),
          tenantName: p.tenant_name ?? "[Inquilino/a]",
          address: p.address ?? "[Dirección]",
          signedDate: p.signed_date,
          anniversary,
          oldRent: baseRent,
          result,
        })
      : null;

  return (
    <>
      <div className="no-print">
        <Link href={`/app/propiedades/${p.id}`} className="small">← {p.name}</Link>
        <h1 style={{ marginTop: 8 }}>Actualización de renta</h1>
        {!p.update_clause || p.update_index === "NINGUNO" ? (
          <div className="notice">
            Según la ficha, este contrato no prevé actualización anual. Sin esa cláusula no se puede subir la renta (art. 18 LAU).
            Si no es así, <Link href={`/app/propiedades/${p.id}/editar`}>corrige la ficha</Link>.
          </div>
        ) : (
          <form className="card" method="get">
            <input type="hidden" name="calc" value="1" />
            <div className="grid">
              <div className="field">
                <label htmlFor="anniversary">Fecha de actualización (aniversario)</label>
                <input type="date" id="anniversary" name="anniversary" defaultValue={anniversary} />
              </div>
              {p.update_index !== "IRAV" && (
                <div className="field">
                  <label htmlFor="indexPct">
                    Variación anual del {p.update_index === "IPC" ? "IPC" : "índice pactado"} (%)
                    {" "}<a className="hint" href={INE_IPC} target="_blank" rel="noreferrer">consultar en el INE</a>
                  </label>
                  <input id="indexPct" name="indexPct" inputMode="decimal" defaultValue={indexDefault} placeholder="p. ej. 2,9" />
                  <span className="hint">
                    {ipcData && !q.indexPct
                      ? `Rellenado con el IPC de ${formatMonth(ipcData.period)} (último publicado antes de esa fecha). Compruébalo con lo que diga tu contrato.`
                      : "Usa el último dato publicado antes de la fecha de actualización."}
                  </span>
                </div>
              )}
              {needsIrav && (
                <div className="field">
                  <label htmlFor="iravPct">
                    IRAV (%) <a className="hint" href={INE_IRAV} target="_blank" rel="noreferrer">consultar en el INE</a>
                  </label>
                  <input id="iravPct" name="iravPct" inputMode="decimal" defaultValue={iravDefault} placeholder="p. ej. 2,2" />
                  <span className="hint">
                    {iravData && !q.iravPct ? `Rellenado con el IRAV de ${formatMonth(iravData.period)}. ` : ""}
                    {p.update_index === "IRAV" ? "Índice pactado en el contrato." : "Contrato posterior al 25/05/2023: la subida nunca puede superar el IRAV."}
                  </span>
                </div>
              )}
            </div>
            <div className="field">
              <label className="check">
                <input type="checkbox" name="aboveRef" defaultChecked={q.aboveRef === "on"} />
                La renta supera el índice estatal de precios de referencia para esta vivienda
              </label>
            </div>
            <div className="grid">
              <div className="field"><label htmlFor="landlord">Tu nombre (firma de la carta)</label><input id="landlord" name="landlord" defaultValue={landlordName} /></div>
              <div className="field"><label htmlFor="city">Ciudad</label><input id="city" name="city" defaultValue={city} /></div>
            </div>
            <button className="btn">Calcular y generar carta</button>
          </form>
        )}

        {result && (
          <div className="card stack">
            <h2>Resultado</h2>
            {result.missing.length > 0 ? (
              <p className="error">Falta el valor del {result.missing.includes("iravPct") ? "IRAV" : "índice"} para calcular.</p>
            ) : (
              <>
                <p className="price" style={{ margin: 0 }}>
                  {result.pct.toFixed(2).replace(".", ",")} % → {result.newRent.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}/mes
                </p>
                <ol className="small">{result.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                {result.rulesApplied.map((r) => (
                  <p key={r.id} className="small" style={{ margin: 0 }}>
                    Norma aplicada: <a href={r.url} target="_blank" rel="noreferrer">{r.label}</a>
                  </p>
                ))}
              </>
            )}
            {result.caveats.map((c) => <div key={c} className="notice">{c}</div>)}
            <p className="muted small" style={{ margin: 0 }}>
              El tope legal limita la subida cuando no hay un nuevo acuerdo con el inquilino. Esto es información general, no
              asesoramiento legal: si tienes dudas, consulta con un abogado.
            </p>
          </div>
        )}
      </div>

      {letter && (
        <>
          <div className="card stack no-print">
            <div className="row"><PrintButton /><span className="muted small">Guárdala en PDF o imprímela y entrégala con acuse de recibo (burofax o email con confirmación de lectura).</span></div>
            {applied ? (
              <p className="ok" style={{ margin: 0 }}>
                Ya aplicaste esta actualización: {Number(applied.new_rent).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}/mes desde el {formatLong(applied.effective_date)}.
              </p>
            ) : (
              result && (
                <form action={applyRentUpdate.bind(null, p.id, anniversary, result.newRent, result.pct)} className="row">
                  <button className="btn secondary">Aplicar nueva renta en la ficha</button>
                  <span className="muted small">Hazlo cuando hayas enviado la carta. Los cobros desde el {formatLong(anniversary)} usarán la renta nueva.</span>
                </form>
              )
            )}
          </div>
          <article className="letter">
            {letter.map((para, i) => <p key={i}>{para}</p>)}
          </article>
        </>
      )}
    </>
  );
}
