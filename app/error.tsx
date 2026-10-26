"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container narrow stack" style={{ padding: "64px 16px" }}>
      <h1>Algo ha fallado</h1>
      <p className="muted">
        Ha habido un error inesperado. Vuelve a intentarlo; si se repite, escríbenos e indica este código:{" "}
        <code>{error.digest ?? "sin código"}</code>.
      </p>
      <div className="row">
        <button className="btn" onClick={reset}>Reintentar</button>
        <Link href="/" className="btn secondary">Inicio</Link>
      </div>
    </main>
  );
}
