// Demo con datos de ejemplo: no necesita cuenta ni Supabase. Útil para enseñarla en las entrevistas.

import Link from "next/link";
import { propertyAlerts } from "@/lib/alerts";
import { addDays, addYears, firstOfMonth, formatShort, nextAnniversary, today } from "@/lib/dates";
import { computeUpdate } from "@/lib/rules";
import { buildLetter } from "@/lib/letter";
import type { Payment, Property } from "@/lib/types";
import { AlertList } from "../app/AlertList";

export const dynamic = "force-dynamic";

const EXAMPLE_IRAV = 2.54;

function sampleData(now: string) {
  const base = {
    owner_id: "demo", tenant_email: null, update_clause: true, update_clause_text: null,
    landlord_is_company: false, notes: null, duration_years: 1,
  };
  const centroStart = addYears(addDays(now, 40), -3);
  const props: Property[] = [
    {
      ...base, id: "centro", name: "Piso Centro", address: "Calle Mayor 12, 3.º B, Valencia",
      tenant_name: "Laura Gómez", tenant_phone: "34600111222", rent: 850,
      signed_date: addDays(centroStart, -10), start_date: centroStart, update_index: "IRAV", payment_day: 5,
      created_at: addDays(now, -90),
    },
    {
      ...base, id: "ruzafa", name: "Ático Ruzafa", address: "Calle Sueca 40, ático, Valencia",
      tenant_name: "Marcos Ruiz", tenant_phone: null, rent: 720,
      signed_date: "2021-03-01", start_date: "2021-03-01", update_index: "IPC", payment_day: 1,
      created_at: addDays(now, -20),
    },
  ];
  // El Piso Centro tiene todos los meses cobrados; el Ático, ninguno.
  const payments: Payment[] = [0, 1, 2, 3].map((i) => {
    const d = new Date(`${firstOfMonth(now)}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - i);
    const period = d.toISOString().slice(0, 10);
    return { id: `p${i}`, property_id: "centro", period, amount: 850, paid_at: period };
  });
  return { props, payments };
}

export default function Demo() {
  const now = today();
  const { props, payments } = sampleData(now);
  const alerts = props
    .flatMap((p) => propertyAlerts(p, payments.filter((x) => x.property_id === p.id), now))
    .filter((a) => a.daysLeft <= 120)
    .sort((a, b) => a.date.localeCompare(b.date));

  const centro = props[0];
  const anniversary = nextAnniversary(centro.start_date, now);
  const result = computeUpdate({
    signedDate: centro.signed_date,
    anniversary,
    rent: centro.rent,
    updateClause: true,
    index: "IRAV",
    indexPct: null,
    iravPct: EXAMPLE_IRAV,
    rentAboveReference: false,
  });
  const letter = buildLetter({
    landlordName: "Ana Martínez",
    city: "Valencia",
    date: now,
    tenantName: centro.tenant_name!,
    address: centro.address!,
    signedDate: centro.signed_date,
    anniversary,
    oldRent: centro.rent,
    result,
  });

  return (
    <>
      <header className="topbar">
        <div className="container">
          <Link href="/" className="brand">Alquiler en Regla</Link>
          <nav className="nav"><Link href="/#lista">Quiero acceso</Link></nav>
        </div>
      </header>
      <main className="container stack" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="notice">Demo con datos de ejemplo. Así se ve el panel de una propietaria con dos pisos.</div>

        <section>
          <h1>Próximos 4 meses</h1>
          <AlertList alerts={alerts} showProperty actions={false} />
        </section>

        <section>
          <h2>Tus pisos</h2>
          <div className="grid">
            {props.map((p) => (
              <div key={p.id} className="card">
                <h3>{p.name}</h3>
                <p className="muted small" style={{ marginBottom: 6 }}>{p.address}</p>
                <p style={{ margin: 0 }}>
                  <strong>{p.rent.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</strong>/mes ·
                  {" "}actualiza por {p.update_index} · desde {formatShort(p.start_date)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="stack">
          <h2>Carta de actualización generada</h2>
          <div className="card small">
            <ol style={{ margin: 0 }}>{result.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="muted" style={{ margin: "8px 0 0" }}>IRAV de ejemplo: {EXAMPLE_IRAV} %. En la app se rellena solo con el último dato del INE.</p>
          </div>
          <article className="letter">
            {letter.map((para, i) => <p key={i}>{para}</p>)}
          </article>
        </section>

        <div className="card row between">
          <p style={{ margin: 0 }}><strong>¿Te sería útil con tus pisos?</strong> Apúntate y te avisamos al abrir la beta.</p>
          <Link href="/#lista" className="btn">Unirme a la lista de espera</Link>
        </div>
      </main>
    </>
  );
}
