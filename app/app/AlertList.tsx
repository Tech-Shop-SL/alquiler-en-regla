import Link from "next/link";
import type { Alert } from "@/lib/alerts";
import { formatShort } from "@/lib/dates";

function when(days: number) {
  if (days < 0) return `hace ${-days} días`;
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

export function AlertList({
  alerts,
  showProperty = false,
  actions = true,
}: {
  alerts: Alert[];
  showProperty?: boolean;
  actions?: boolean;
}) {
  if (alerts.length === 0) return <p className="muted">Nada pendiente. Te avisaremos por email cuando se acerque una fecha.</p>;

  return (
    <div className="stack">
      {alerts.map((a) => (
        <div key={`${a.propertyId}-${a.kind}`} className="card row between">
          <div style={{ flex: "1 1 320px" }}>
            <div className="row" style={{ gap: 8 }}>
              <span className={`badge ${a.level}`}>{when(a.daysLeft)}</span>
              <strong>{a.title}</strong>
              {showProperty && <span className="muted small">· {a.propertyName}</span>}
            </div>
            <p className="muted small" style={{ margin: "6px 0 0" }}>{formatShort(a.date)} — {a.detail}</p>
          </div>
          {actions && a.kind === "aviso_subida" && (
            <Link href={`/app/propiedades/${a.propertyId}/actualizacion`} className="btn small">Preparar carta</Link>
          )}
          {actions && a.kind === "cobro" && (
            <Link href={`/app/propiedades/${a.propertyId}#cobros`} className="btn small secondary">Ver cobros</Link>
          )}
        </div>
      ))}
    </div>
  );
}
