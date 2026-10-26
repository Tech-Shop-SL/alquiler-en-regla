import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container narrow stack" style={{ padding: "64px 16px" }}>
      <h1>No encontramos esta página</h1>
      <p className="muted">Puede que el enlace sea antiguo o que el piso se haya eliminado.</p>
      <div className="row">
        <Link href="/app" className="btn">Ir a mi panel</Link>
        <Link href="/" className="btn secondary">Inicio</Link>
      </div>
    </main>
  );
}
