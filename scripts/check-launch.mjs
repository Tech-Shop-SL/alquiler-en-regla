// Comprobación antes de publicar: `npm run check` (lee .env.local) o `npm run check -- --prod` (exige claves live).
// No muestra los valores de las claves, solo si están bien.

import { existsSync, readFileSync } from "node:fs";

const prod = process.argv.includes("--prod");
const env = { ...process.env };
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const errors = [];
const warnings = [];
const need = (key, why) => { if (!env[key]) errors.push(`Falta ${key} (${why})`); };

need("NEXT_PUBLIC_SITE_URL", "URL pública de la web");
need("NEXT_PUBLIC_SUPABASE_URL", "Supabase");
need("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase");
need("SUPABASE_SERVICE_ROLE_KEY", "Supabase, para el webhook y los crons");
need("ANTHROPIC_API_KEY", "lectura de contratos");
need("STRIPE_SECRET_KEY", "pagos");
need("STRIPE_WEBHOOK_SECRET", "pagos");
need("STRIPE_PRICE_MONTHLY", "precio mensual de Pro");
need("STRIPE_PRICE_YEARLY", "precio anual de Pro");
need("RESEND_API_KEY", "emails de alertas");
need("ALERTS_FROM_EMAIL", "remitente de las alertas");
need("CRON_SECRET", "protege los crons");
need("LEGAL_NAME", "aviso legal y privacidad");
need("LEGAL_ID", "NIF en el aviso legal");
need("LEGAL_ADDRESS", "dirección en el aviso legal");
need("CONTACT_EMAIL", "contacto en las páginas legales");

const url = env.NEXT_PUBLIC_SITE_URL ?? "";
if (prod && !url.startsWith("https://")) errors.push("NEXT_PUBLIC_SITE_URL debe empezar por https:// en producción");
if (prod && /localhost|127\.0\.0\.1/.test(url)) errors.push("NEXT_PUBLIC_SITE_URL apunta a localhost");
if (url.endsWith("/")) errors.push("NEXT_PUBLIC_SITE_URL no debe acabar en /");

const stripeKey = env.STRIPE_SECRET_KEY ?? "";
if (stripeKey.startsWith("sk_test_")) (prod ? errors : warnings).push("Stripe está en modo test (sk_test_)");
if (stripeKey.startsWith("pk_")) errors.push("STRIPE_SECRET_KEY es una clave publicable (pk_); usa la secreta (sk_ o rk_)");
if ((env.STRIPE_PRICE_MONTHLY ?? "").startsWith("prod_")) errors.push("STRIPE_PRICE_MONTHLY es un producto (prod_); usa el ID del precio (price_)");
if ((env.STRIPE_PRICE_YEARLY ?? "").startsWith("prod_")) errors.push("STRIPE_PRICE_YEARLY es un producto (prod_); usa el ID del precio (price_)");
if ((env.CRON_SECRET ?? "").length > 0 && env.CRON_SECRET.length < 24) errors.push("CRON_SECRET es demasiado corto (mínimo 24 caracteres)");
if (/tudominio/.test(env.ALERTS_FROM_EMAIL ?? "")) errors.push("ALERTS_FROM_EMAIL sigue con el dominio de ejemplo");
for (const key of ["LEGAL_NAME", "LEGAL_ID", "LEGAL_ADDRESS", "CONTACT_EMAIL"]) {
  if (/^\[|\]$/.test(env[key] ?? "")) errors.push(`${key} sigue con el texto de ejemplo`);
}
if (!env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) warnings.push("Sin analítica (NEXT_PUBLIC_PLAUSIBLE_DOMAIN): no sabrás cuántas visitas se apuntan");

warnings.push("Recuerda: comprueba en el BOE que el RDL 29/2026 sigue en vigor (lib/rules.ts) y que un abogado ha revisado textos y cálculos");

for (const e of errors) console.log(`✖ ${e}`);
for (const w of warnings) console.log(`! ${w}`);
if (errors.length) {
  console.log(`\n${errors.length} problema(s) por resolver antes de publicar.`);
  process.exit(1);
}
console.log("\n✓ Configuración lista para publicar.");
