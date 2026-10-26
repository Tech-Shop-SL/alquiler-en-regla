import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = { title: `Aviso legal — ${site.name}` };

// Información exigida por el art. 10 de la Ley 34/2002 (LSSI). Revísala con un profesional.
export default function LegalNotice() {
  return (
    <LegalPage title="Aviso legal" updated="26 de octubre de 2026">
      <h2>Titular</h2>
      <p>
        {site.name} es un servicio de {site.legalName}, con NIF {site.legalId} y domicilio en {site.legalAddress}.
        Contacto: {site.contactEmail}.
      </p>

      <h2>Objeto</h2>
      <p>
        {site.name} es una herramienta para que los propietarios gestionen sus alquileres de vivienda: fechas del contrato,
        cobros y cálculo de la actualización de la renta.
      </p>

      <h2>No es asesoramiento legal</h2>
      <p>
        La información, los cálculos y las plantillas de cartas son orientativos y se basan en la normativa publicada en el
        BOE y en los índices del INE. No sustituyen el consejo de un abogado. Revisa tu contrato y, si tienes dudas, consulta
        con un profesional antes de comunicar una subida al inquilino.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        Mantenemos la información actualizada con la mayor diligencia, pero la normativa cambia y puede haber retrasos o
        errores. No respondemos de las decisiones tomadas únicamente a partir de la información de la web.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>Los textos, el diseño y el código de la web pertenecen a su titular. Las cartas que generes son tuyas.</p>

      <h2>Legislación aplicable</h2>
      <p>Se aplica la legislación española.</p>
    </LegalPage>
  );
}
