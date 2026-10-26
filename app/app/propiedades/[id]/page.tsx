import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { contractTerm, propertyAlerts } from "@/lib/alerts";
import { addMonths, firstOfMonth, formatMonth, formatShort, today } from "@/lib/dates";
import { mailtoLink, whatsappLink } from "@/lib/reminders";
import { rentForPeriod } from "@/lib/rent";
import type { Payment, Property, RentChange } from "@/lib/types";
import { AlertList } from "../../AlertList";
import { markPaid, unmarkPaid } from "../../actions";

const eur = (n: number) => Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aplicada?: string }>;
}) {
  const { id } = await params;
  const { aplicada } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data }, { data: payData }, { data: changeData }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).single(),
    supabase.from("payments").select("*").eq("property_id", id),
    supabase.from("rent_changes").select("*").eq("property_id", id).order("effective_date", { ascending: false }),
  ]);
  if (!data) notFound();
  const p = data as Property;
  const payments = (payData ?? []) as Payment[];
  const changes = (changeData ?? []) as RentChange[];
  const now = today();
  const alerts = propertyAlerts(p, payments, now, changes);
  const term = contractTerm(p, now);

  // Últimos 12 meses (sin ir antes del inicio del contrato).
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const m = addMonths(firstOfMonth(now), -i);
    if (m < firstOfMonth(p.start_date)) break;
    months.push(m);
  }

  return (
    <>
      <div className="row between">
        <div>
          <Link href="/app" className="small">← Panel</Link>
          <h1 style={{ marginTop: 8 }}>{p.name}</h1>
          <p className="muted" style={{ margin: 0 }}>{p.address}</p>
        </div>
        <div className="row">
          <Link href={`/app/propiedades/${p.id}/actualizacion`} className="btn">Carta de actualización</Link>
          <Link href={`/app/propiedades/${p.id}/editar`} className="btn secondary">Editar</Link>
        </div>
      </div>

      {aplicada && <p className="ok">Nueva renta guardada. Los cobros desde la fecha de actualización usarán el importe nuevo.</p>}

      <div className="grid">
        <div className="card">
          <p className="muted small" style={{ marginBottom: 4 }}>Renta actual</p>
          <p className="price" style={{ margin: 0 }}>{eur(p.rent)}</p>
          <p className="small muted" style={{ margin: 0 }}>Se paga el día {p.payment_day}</p>
        </div>
        <div className="card small">
          <p style={{ marginBottom: 4 }}><strong>Inquilino/a:</strong> {p.tenant_name ?? "—"}</p>
          <p style={{ marginBottom: 4 }}><strong>Firma:</strong> {formatShort(p.signed_date)} · <strong>Inicio:</strong> {formatShort(p.start_date)}</p>
          <p style={{ marginBottom: 4 }}><strong>Actualización:</strong> {p.update_clause ? p.update_index : "no prevista"}</p>
          <p style={{ margin: 0 }}>
            <strong>{term.inTacitExtension ? "Prórroga tácita hasta" : "Prórroga obligatoria hasta"}:</strong> {formatShort(term.currentEnd)}
          </p>
        </div>
      </div>

      <section>
        <h2>Alertas</h2>
        <AlertList alerts={alerts} />
      </section>

      <section id="cobros">
        <h2>Cobros</h2>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Mes</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const paid = payments.find((x) => x.period === m);
                const wa = whatsappLink(p, m);
                const mail = mailtoLink(p, m);
                return (
                  <tr key={m}>
                    <td style={{ textTransform: "capitalize" }}>{formatMonth(m)}</td>
                    <td>
                      {paid
                        ? <span className="badge info">Cobrado {eur(paid.amount)} · {formatShort(paid.paid_at)}</span>
                        : <span className="badge pronto">Pendiente</span>}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        {paid ? (
                          <form action={unmarkPaid.bind(null, p.id, m)}>
                            <button className="btn secondary small">Deshacer</button>
                          </form>
                        ) : (
                          <>
                            <form action={markPaid.bind(null, p.id, m, rentForPeriod(p, changes, m))}>
                              <button className="btn small">Marcar cobrado</button>
                            </form>
                            {wa && <a className="btn secondary small" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
                            {mail && <a className="btn secondary small" href={mail}>Email</a>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!p.tenant_phone && !p.tenant_email && (
            <p className="muted small" style={{ marginTop: 12 }}>
              Añade el móvil o el email del inquilino en la ficha para enviarle recordatorios con un clic.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2>Historial de rentas</h2>
        {changes.length === 0 ? (
          <p className="muted">Aún no has aplicado ninguna actualización. Cuando envíes una carta, pulsa «Aplicar nueva renta» y quedará aquí.</p>
        ) : (
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Desde</th><th>Antes</th><th>Después</th><th>Variación</th></tr></thead>
              <tbody>
                {changes.map((c) => (
                  <tr key={c.id}>
                    <td>{formatShort(c.effective_date)}</td>
                    <td>{eur(c.old_rent)}</td>
                    <td>{eur(c.new_rent)}</td>
                    <td>{Number(c.pct).toFixed(2).replace(".", ",")} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
