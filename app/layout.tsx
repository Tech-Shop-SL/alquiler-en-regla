import type { Metadata } from "next";
import Script from "next/script";
import { site } from "@/lib/site";
import "./globals.css";

const description =
  "Alertas, cobros y carta de actualización de renta con el índice correcto (IPC, IRAV y topes legales) para propietarios de 1 a 5 pisos.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Alquiler en Regla — tu alquiler en piloto automático",
  description,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: site.name,
    title: "Tu alquiler en piloto automático. Y siempre en regla.",
    description,
  },
  twitter: { card: "summary_large_image" },
};

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        {plausibleDomain && (
          <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
