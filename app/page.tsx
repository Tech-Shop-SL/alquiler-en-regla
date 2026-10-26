import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";

export default function Landing() {
  return (
    <>
      <header className="topbar">
        <div className="container">
          <span className="brand">Alquiler en Regla</span>
          <nav className="nav"><Link href="/login">Entrar</Link></nav>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Tu alquiler en piloto automático.<br />Y siempre en regla.</h1>
          <p className="lead">
            Cuánto puedes subir el alquiler depende de la fecha de firma, del IPC, del IRAV y de topes que cambian casi cada año.
            Nosotros seguimos la norma y llevamos la cuenta por ti.
          </p>
          <div className="row">
            <Link href="#lista" className="btn">Quiero acceso anticipado</Link>
            <Link href="/demo" className="btn secondary">Ver la demo</Link>
          </div>
        </section>

        <div className="grid" style={{ alignItems: "start" }}>
          <section className="card">
            <ul className="features">
              <li>Te avisamos antes del aniversario del contrato, con tiempo para comunicar la subida.</li>
              <li>Calculamos la actualización con el índice correcto y te damos la carta lista para enviar.</li>
              <li>Llevamos el control de cobros y recordamos al inquilino por WhatsApp o email si se retrasa.</li>
              <li>Sube el PDF de tu contrato y rellenamos la ficha por ti.</li>
            </ul>
            <p className="muted small" style={{ marginTop: 12 }}>
              Pensado para propietarios con 1 a 5 pisos que se gestionan solos.
            </p>
          </section>

          <section className="card" id="lista">
            <h2>Únete a la lista de espera</h2>
            <p className="muted small">Gratis con 1 piso. Los primeros 100 tendrán precio de fundador.</p>
            <WaitlistForm />
          </section>
        </div>

        <section style={{ padding: "48px 0 0" }}>
          <h2>Precio</h2>
          <div className="grid">
            <div className="card">
              <h3>Gratis</h3>
              <p className="price">0 €</p>
              <p className="muted">1 piso, con alertas, cobros y carta de actualización.</p>
            </div>
            <div className="card">
              <h3>Pro</h3>
              <p className="price">9,99 €<span className="muted small">/mes</span></p>
              <p className="muted">Hasta 5 pisos. O 79 € al año (ahorras un 34 %).</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="container">
        Alquiler en Regla ofrece información general y no es asesoramiento legal. ·<Link href="/legal/aviso-legal">Aviso legal</Link> ·{" "}
        <Link href="/legal/privacidad">Privacidad</Link> · <Link href="/legal/condiciones">Condiciones</Link>
      </footer>
    </>
  );
}
