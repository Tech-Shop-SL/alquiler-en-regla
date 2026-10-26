import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { propertyAlerts } from "@/lib/alerts";
import { formatShort, today } from "@/lib/dates";
import type { Payment, Property, RentChange } from "@/lib/types";
import { AlertList } from "./AlertList";

export default async function Dashboard() {
  const { supabase } = await requireUser();
  const [{ data: properties }, { data: payments }, { data: changes }] = await Promise.all([
    supabase.from("properties").select("*").order("created_at"),
    supabase.from("payments").select("*"),
    supabase.from("rent_changes").select("*"),
  ]);
  const props = (properties ?? []) as Property[];
  const pays = (payments ?? []) as Payment[];
  const rentChanges = (changes ?? []) as RentChange[];
  const now = today();
  const alerts = props
    .flatMap((p) =>
      propertyAlerts(
        p,
        pays.filter((x) => x.property_id === p.id),
        now,
        rentChanges.filter((c) => c.property_id === p.id),
      ),
    )
    .filter((a) => a.daysLeft <= 120)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (props.length === 0) {
    return (
      <div className="card stack">
        <h1>Empieza por tu primer piso</h1>
        <p className="muted">
          Sube el PDF del contrato y rellenamos la ficha por ti, o introduce los datos a mano. Con eso
          calculamos el aniversario, el plazo para comunicar la subida y el fin de contrato.
        </p>
        <Link href="/app/propiedades/nueva" className="btn">Añadir piso</Link>
      </div>
    );
  }

  return (
    <>
      <section>
        <h1>Próximos 4 meses</h1>
        <AlertList alerts={alerts} showProperty />
      </section>
      <section>
        <div className="row between">
          <h2>Tus pisos</h2>
          <Link href="/app/propiedades/nueva" className="btn secondary small">Añadir piso</Link>
        </div>
        <div className="grid">
          {props.map((p) => (
            <Link key={p.id} href={`/app/propiedades/${p.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <h3>{p.name}</h3>
              <p className="muted small" style={{ marginBottom: 6 }}>{p.address ?? "Sin dirección"}</p>
              <p style={{ marginBottom: 0 }}>
                <strong>{Number(p.rent).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</strong>/mes ·
                {" "}{p.update_clause ? `actualiza por ${p.update_index}` : "sin actualización"} · desde {formatShort(p.start_date)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
