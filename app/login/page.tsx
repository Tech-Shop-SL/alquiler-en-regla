"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendMagicLink, null);

  return (
    <main className="container narrow stack" style={{ paddingTop: 64 }}>
      <Link href="/" className="brand">Alquiler en Regla</Link>
      <div className="card">
        <h1>Entra en tu cuenta</h1>
        <p className="muted">Te enviamos un enlace de acceso por email. Sin contraseñas.</p>
        <form action={action}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <button className="btn" disabled={pending}>{pending ? "Enviando…" : "Enviar enlace"}</button>
          {state?.error && <p className="error">{state.error}</p>}
          {state?.ok && <p className="ok">Revisa tu correo y abre el enlace para entrar.</p>}
        </form>
      </div>
    </main>
  );
}
