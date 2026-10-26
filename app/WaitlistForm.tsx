"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { track } from "@/lib/analytics";
import { joinWaitlist } from "./actions";

export function WaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, null);

  useEffect(() => {
    if (state?.ok) track("Waitlist", { flats: state.flats ?? 1 });
  }, [state]);

  if (state?.ok) {
    return <p className="ok">¡Apuntado! Te escribiremos en cuanto abramos la beta.</p>;
  }

  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="flats">¿Cuántos pisos alquilas?</label>
        <select id="flats" name="flats" defaultValue="1">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5 o más</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="how">¿Cómo calculaste la última subida del alquiler?</label>
        <textarea id="how" name="how" rows={2} placeholder="Opcional, pero nos ayuda mucho" />
      </div>
      <div className="field">
        <label className="check small">
          <input type="checkbox" name="consent" required />
          <span>Acepto la <Link href="/legal/privacidad">política de privacidad</Link> y que me escribáis sobre el lanzamiento.</span>
        </label>
      </div>
      <button className="btn" disabled={pending}>{pending ? "Enviando…" : "Quiero acceso anticipado"}</button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
