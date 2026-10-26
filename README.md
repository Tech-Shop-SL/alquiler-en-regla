# Alquiler en Regla

"Tu alquiler en piloto automático y siempre en regla". MVP para propietarios de 1 a 5 pisos en España.
Stack: Next.js 15 + Supabase + Stripe + Claude (lectura de contratos) + Resend (emails).

## Qué incluye

| Función | Dónde |
|---|---|
| Landing con lista de espera (semana 1) | `app/page.tsx`, `app/WaitlistForm.tsx` |
| Ficha de propiedad y contrato | `app/app/propiedades/PropertyForm.tsx` |
| Alertas: aviso de subida (30 días antes), aniversario, preaviso de no renovación (4 meses), fin de prórroga y cobro pendiente | `lib/alerts.ts`, panel en `app/app/page.tsx`, email diario en `app/api/cron/alertas` |
| Registro de cobros + recordatorio por WhatsApp o email | `app/app/propiedades/[id]/page.tsx`, `lib/reminders.ts` |
| Cálculo de actualización (IPC / IRAV / topes) y carta | `lib/rules.ts`, `lib/letter.ts`, `app/app/propiedades/[id]/actualizacion` |
| Lectura del contrato en PDF con IA | `app/api/extract/route.ts` |
| Plan gratis (1 piso) y Pro (9,99 €/mes o 79 €/año, hasta 5) | `app/app/plan`, `app/api/stripe/*` |
| Historial de rentas y botón «Aplicar nueva renta» | `lib/rent.ts`, `applyRentUpdate` en `app/app/actions.ts` |
| IPC e IRAV automáticos desde la API del INE (cron diario) | `lib/ine.ts`, `lib/indices.ts`, `app/api/cron/indices` |
| Límite de lecturas con IA: 3/mes gratis, 20/mes Pro | `app/api/extract/route.ts`, `EXTRACTION_LIMIT` en `lib/types.ts` |
| Demo pública con datos de ejemplo (sin cuenta) | `app/demo/page.tsx` |
| Analítica de la landing con Plausible (evento `Waitlist`) | `app/layout.tsx`, `lib/analytics.ts` |

## Puesta en marcha

1. **Supabase**: crea un proyecto (región UE), abre el SQL Editor y ejecuta `supabase/schema.sql`
   (se puede volver a ejecutar sin perder datos cuando se actualice).
   En Authentication → URL Configuration añade `http://localhost:3000/auth/callback` (y la URL de producción).
2. **Stripe** (modo test): crea un producto "Pro" con dos precios (9,99 €/mes y 79 €/año).
   Crea un webhook a `/api/stripe/webhook` con los eventos `checkout.session.completed`,
   `customer.subscription.updated` y `customer.subscription.deleted`. Activa el Customer Portal.
3. **Anthropic**: crea una API key para la lectura de contratos.
4. **Resend**: verifica tu dominio para enviar las alertas.
5. Copia `.env.example` a `.env.local` y rellénalo.
6. `npm install`, luego `npm run dev` y abre http://localhost:3000.

Tests del motor de reglas: `npm test`.
Demo sin cuenta: http://localhost:3000/demo.
Despliegue: Vercel (los crons diarios de índices y alertas están en `vercel.json`; define `CRON_SECRET`).
Para cargar los índices la primera vez sin esperar al cron:
`curl -H "Authorization: Bearer TU_CRON_SECRET" http://localhost:3000/api/cron/indices`.

## Reglas legales: léelo antes de lanzar

- Los topes de actualización están en `CAP_RULES` (`lib/rules.ts`) como datos con fechas de vigencia.
  Si cambia la norma, edita esa lista.
- **RDL 29/2026** (BOE-A-2026-20823): tope del 2 % sin nuevo pacto entre el 8/10/2026 y el 31/12/2027,
  y 0 % si la renta supera el índice de referencia. Un real decreto-ley debe convalidarse en el Congreso:
  comprueba que sigue en vigor y su ámbito exacto (zonas tensionadas o todo el territorio).
- El IPC y el IRAV se descargan del INE (series `IPC290750` e `IRAV1`) y se rellenan solos con el último dato
  publicado antes del aniversario. Es una aproximación (el INE publica hacia el día 15): el propietario ve el mes
  usado y puede corregirlo. Si el INE cambia de base, actualiza `INE_SERIE_IPC` / `INE_SERIE_IRAV`.
- Haz que un abogado civil o inmobiliario revise `lib/rules.ts`, `lib/alerts.ts`, la carta (`lib/letter.ts`) y la política de privacidad.

## Pendiente antes de producción

- Completar los datos del responsable en `app/legal/privacidad` y firmar los contratos de encargado del tratamiento (DPA) con los proveedores.
- Protección anti-spam en la lista de espera (por ejemplo, Cloudflare Turnstile) si empieza a llegar basura.
