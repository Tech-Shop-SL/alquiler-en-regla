// Datos del titular de la web, usados en las páginas legales y en los emails.
// Se configuran con variables de entorno; `npm run check` avisa si falta alguno antes de publicar.

export const site = {
  name: "Alquiler en Regla",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  legalName: process.env.LEGAL_NAME ?? "[Nombre o razón social]",
  legalId: process.env.LEGAL_ID ?? "[NIF]",
  legalAddress: process.env.LEGAL_ADDRESS ?? "[Dirección postal]",
  contactEmail: process.env.CONTACT_EMAIL ?? "[email de contacto]",
};
