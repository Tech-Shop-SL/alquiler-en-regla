import Link from "next/link";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="container narrow stack" style={{ padding: "48px 16px" }}>
      <Link href="/">← Inicio</Link>
      <h1>{title}</h1>
      <p className="muted small">Última actualización: {updated}</p>
      {children}
      <p className="muted small">
        <Link href="/legal/aviso-legal">Aviso legal</Link> · <Link href="/legal/privacidad">Privacidad</Link> ·{" "}
        <Link href="/legal/condiciones">Condiciones</Link>
      </p>
    </main>
  );
}
