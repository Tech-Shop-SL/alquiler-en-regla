import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();

  return (
    <>
      <header className="topbar">
        <div className="container">
          <Link href="/app" className="brand">Alquiler en Regla</Link>
          <nav className="nav">
            <Link href="/app">Panel</Link>
            <Link href="/app/propiedades/nueva">Añadir piso</Link>
            <Link href="/app/plan">{profile.plan === "pro" ? "Plan Pro" : "Pasar a Pro"}</Link>
            <Link href="/app/cuenta">Mi cuenta</Link>
            <form action={signOut}>
              <button className="btn secondary small">Salir</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container stack" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {children}
      </main>
      <footer className="container no-print">
        Alquiler en Regla ofrece información general y no es asesoramiento legal. ·{" "}
        <Link href="/legal/aviso-legal">Aviso legal</Link> · <Link href="/legal/privacidad">Privacidad</Link> ·{" "}
        <Link href="/legal/condiciones">Condiciones</Link>
      </footer>
    </>
  );
}
