import { requireUser } from "@/lib/supabase/server";
import { ConfirmSubmit } from "../ConfirmSubmit";
import { deleteAccount } from "./actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, profile } = await requireUser();
  const { error } = await searchParams;

  return (
    <>
      <h1>Mi cuenta</h1>
      <div className="card">
        <p style={{ margin: 0 }}><strong>Email:</strong> {user.email}</p>
        <p style={{ margin: 0 }}><strong>Plan:</strong> {profile.plan === "pro" ? "Pro" : "Gratis"}</p>
      </div>

      <div className="card stack">
        <h2>Descargar mis datos</h2>
        <p className="muted" style={{ margin: 0 }}>Un archivo JSON con tu perfil, tus pisos, cobros e historial de rentas.</p>
        <div><a className="btn secondary" href="/api/cuenta/exportar">Descargar</a></div>
      </div>

      <div className="card stack">
        <h2>Eliminar mi cuenta</h2>
        <p className="muted" style={{ margin: 0 }}>
          Borra tu cuenta y todos los datos de tus pisos e inquilinos. Si tienes Pro, la suscripción se cancela al momento.
          No se puede deshacer.
        </p>
        <form action={deleteAccount}>
          <ConfirmSubmit className="btn danger" message="¿Seguro que quieres eliminar tu cuenta y todos tus datos? No se puede deshacer.">
            Eliminar mi cuenta
          </ConfirmSubmit>
        </form>
        {error && <p className="error">No hemos podido eliminar la cuenta. Escríbenos y lo haremos a mano.</p>}
      </div>
    </>
  );
}
