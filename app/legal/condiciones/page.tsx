import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = { title: `Condiciones de uso y contratación — ${site.name}` };

// Borrador para revisar con un abogado (consumidores: TRLGDCU, RDL 1/2007).
export default function Terms() {
  return (
    <LegalPage title="Condiciones de uso y contratación" updated="26 de octubre de 2026">
      <h2>1. El servicio</h2>
      <p>
        {site.name} ({site.legalName}, NIF {site.legalId}) te permite registrar tus pisos alquilados, recibir alertas de
        fechas, llevar el control de cobros y generar cartas de actualización de renta. Los cálculos son orientativos y no
        constituyen asesoramiento legal.
      </p>

      <h2>2. Cuenta</h2>
      <p>
        Necesitas un email válido. Eres responsable de los datos que introduces, incluidos los de tus inquilinos, y de
        tener una base legítima para tratarlos.
      </p>

      <h2>3. Planes y precios</h2>
      <ul>
        <li><strong>Gratis:</strong> 1 piso y 3 lecturas de contrato con IA al mes.</li>
        <li><strong>Pro:</strong> hasta 5 pisos y 20 lecturas al mes, por 9,99 € al mes o 79 € al año, IVA incluido.</li>
      </ul>
      <p>La suscripción se renueva automáticamente al final de cada periodo y se cobra con la tarjeta que indiques en Stripe.</p>

      <h2>4. Cancelación y desistimiento</h2>
      <p>
        Puedes cancelar cuando quieras desde «Mi plan». Mantendrás Pro hasta el final del periodo ya pagado y no se te
        volverá a cobrar. Como consumidor, tienes 14 días naturales desde la contratación para desistir: escríbenos a{" "}
        {site.contactEmail} y te devolveremos el importe.
      </p>

      <h2>5. Cambios de precio o de condiciones</h2>
      <p>Te avisaremos por email con al menos 30 días de antelación. Si no estás de acuerdo, podrás cancelar antes de que se apliquen.</p>

      <h2>6. Disponibilidad</h2>
      <p>
        Intentamos que el servicio funcione siempre, pero puede haber interrupciones por mantenimiento o fallos de
        proveedores. Las alertas por email son una ayuda: revisa también tu panel.
      </p>

      <h2>7. Baja</h2>
      <p>Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde «Mi cuenta». Si tienes una suscripción activa, se cancelará.</p>

      <h2>8. Ley aplicable</h2>
      <p>Legislación española. Si eres consumidor, son competentes los tribunales de tu domicilio.</p>
    </LegalPage>
  );
}
