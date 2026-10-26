import { requireUser } from "@/lib/supabase/server";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { profile } = await requireUser();
  const { ok } = await searchParams;

  if (profile.plan === "pro") {
    return (
      <div className="card stack">
        <h1>Plan Pro</h1>
        {ok && <p className="ok">¡Gracias! Tu suscripción está activa.</p>}
        <p>Puedes gestionar hasta 5 pisos. Cambia la tarjeta, descarga facturas o cancela cuando quieras.</p>
        <form action="/api/stripe/portal" method="post">
          <button className="btn secondary">Gestionar suscripción</button>
        </form>
      </div>
    );
  }

  return (
    <>
      <h1>Pasa a Pro</h1>
      <p className="muted">Hasta 5 pisos con alertas, cobros, cartas de actualización y lectura de contratos con IA.</p>
      <div className="grid">
        <form className="card" action="/api/stripe/checkout" method="post">
          <input type="hidden" name="interval" value="month" />
          <h2>Mensual</h2>
          <p className="price">9,99 €<span className="muted small">/mes</span></p>
          <button className="btn">Suscribirme</button>
        </form>
        <form className="card" action="/api/stripe/checkout" method="post">
          <input type="hidden" name="interval" value="year" />
          <h2>Anual</h2>
          <p className="price">79 €<span className="muted small">/año</span></p>
          <p className="muted small">Dos meses y pico gratis.</p>
          <button className="btn">Suscribirme</button>
        </form>
      </div>
    </>
  );
}
