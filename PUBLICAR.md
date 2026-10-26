# Cómo publicar Alquiler en Regla

Esta guía lleva la app desde tu ordenador hasta una web pública con dominio propio. Calcula unas 2 o 3 horas.
Todo lo que hay que configurar está aquí, en orden.

## 0. Antes de nada

- [ ] **Dominio**: compra uno (por ejemplo, en Namecheap, Cloudflare o DonDominio). Lo usarás para la web y para enviar emails.
- [ ] **Datos legales**: nombre o razón social, NIF y dirección. Si vas a cobrar, date de alta como autónomo o crea una sociedad.
- [ ] **Revisión legal**: que un abogado civil o inmobiliario revise:
  - [ ] el cálculo y los topes (`lib/rules.ts`),
  - [ ] los plazos de las alertas (`lib/alerts.ts`),
  - [ ] la carta (`lib/letter.ts`),
  - [ ] las páginas legales (`app/legal/`).
- [ ] **RDL 29/2026**: comprueba en el BOE que el Congreso lo convalidó. Si no, cambia o borra la regla `rdl-29-2026` en `lib/rules.ts` y ejecuta `npm test`.

## 1. Código en GitHub

1. Crea una cuenta en github.com y un repositorio **privado** llamado `alquiler-en-regla`.
2. Instala Git (git-scm.com) y, en la carpeta del proyecto:

```
git init
git add .
git commit -m "Primera versión"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/alquiler-en-regla.git
git push -u origin main
```

`.gitignore` ya impide subir `.env.local` y tus claves.

## 2. Supabase (base de datos y acceso)

1. En supabase.com crea un proyecto en una **región de la UE** (Frankfurt o Irlanda) y guarda la contraseña de la base de datos.
2. En **SQL Editor**, pega y ejecuta `supabase/schema.sql`.
3. En **Authentication → URL Configuration**:
   - **Site URL**: `https://tudominio.es`
   - **Redirect URLs**: `https://tudominio.es/auth/callback` y `http://localhost:3000/auth/callback`
4. En **Authentication → Emails → SMTP Settings** activa un SMTP propio con los datos de Resend (paso 4).
   **Imprescindible**: sin él, Supabase solo envía unos pocos emails por hora y la gente no podrá entrar.
5. En **Authentication → Email Templates → Magic Link**, traduce el asunto y el texto al español.
6. En **Project Settings → API** copia la URL, la `anon key` y la `service_role key`.

## 3. Stripe (cobros)

1. Crea la cuenta en stripe.com, complétala con tus datos fiscales y bancarios y **activa los pagos** (modo live).
2. **Productos → Añadir producto** «Alquiler en Regla Pro», con dos precios recurrentes: 9,99 € al mes y 79 € al año.
   Copia los dos IDs, que empiezan por `price_`.
3. **Configuración → Facturación → Portal de clientes**: activa la cancelación y el cambio de tarjeta.
4. **Configuración → Impuestos**: decide si los precios incluyen IVA (las condiciones dicen «IVA incluido»). Valóralo con tu gestor.
5. **Desarrolladores → Webhooks → Añadir endpoint**:
   - URL: `https://tudominio.es/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copia el secreto de firma (`whsec_...`).
6. Copia la clave secreta live (`sk_live_...`).

## 4. Resend (emails)

1. En resend.com añade tu dominio y crea en tu proveedor de dominio los registros DNS que te indique (SPF, DKIM).
2. Crea una API key.
3. Usa estos datos en el SMTP de Supabase (host `smtp.resend.com`, puerto 465, usuario `resend`, contraseña = la API key).

## 5. Anthropic (lectura de contratos)

En console.anthropic.com crea una API key, añade saldo y **pon un límite de gasto mensual** (por ejemplo, 20 €).

## 6. Plausible (analítica, opcional)

En plausible.io añade tu dominio. No usa cookies, así que no necesitas banner.

## 7. Vercel (publicación)

1. En vercel.com, entra con GitHub e **importa** el repositorio. Vercel detecta Next.js.
2. En **Settings → Environment Variables** añade todas las variables de `.env.example` con los valores reales:
   - `NEXT_PUBLIC_SITE_URL=https://tudominio.es` (sin barra al final).
   - `CRON_SECRET`: una cadena aleatoria larga. Puedes generarla con
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `ALERTS_FROM_EMAIL="Alquiler en Regla <avisos@tudominio.es>"`.
   - `LEGAL_NAME`, `LEGAL_ID`, `LEGAL_ADDRESS`, `CONTACT_EMAIL`.
3. **Deploy**.
4. En **Settings → Domains** añade `tudominio.es` y crea en tu proveedor de dominio los registros DNS que te indique.

Las funciones se ejecutan en Fráncfort (`fra1`, definido en `vercel.json`), cerca de Supabase. Si creaste Supabase en Irlanda, cámbialo a `dub1`.

Los crons de `vercel.json` (índices del INE a las 6:00 y alertas a las 7:00, hora UTC) se activan solos.

## 8. Comprobaciones finales

En tu ordenador, con las variables de producción en `.env.local`:

```
npm run check -- --prod
npm test
npm run build
```

En la web publicada:

- [ ] La landing carga en `https://tudominio.es` y el candado HTTPS aparece.
- [ ] Apúntate a la lista de espera y comprueba que aparece en Supabase (tabla `waitlist`).
- [ ] Carga los índices del INE la primera vez:
      `curl -H "Authorization: Bearer TU_CRON_SECRET" https://tudominio.es/api/cron/indices`
      Debe responder algo como `{"IPC":24,"IRAV":24}`.
- [ ] Entra con tu email: llega el enlace en español y te lleva al panel.
- [ ] Añade un piso subiendo un contrato en PDF.
- [ ] Genera una carta: el IPC/IRAV aparece ya rellenado.
- [ ] Marca un cobro y prueba el botón de WhatsApp.
- [ ] Suscríbete a Pro con tu tarjeta, comprueba que el plan cambia y **cancela y reembolsa** desde Stripe.
- [ ] Descarga tus datos y elimina una cuenta de prueba desde «Mi cuenta».
- [ ] Revisa el aviso legal, la privacidad y las condiciones con tus datos reales.
- [ ] Comparte el enlace en WhatsApp y comprueba que sale la imagen de vista previa.

## 9. Después de publicar

- Revisa **Vercel → Logs** y **Stripe → Webhooks** la primera semana por si hay errores.
- Cada mes:
  - [ ] Comprueba en Supabase que `index_values` tiene el último mes. Si no, el INE cambió los códigos de serie: actualiza `INE_SERIE_IPC` y `INE_SERIE_IRAV`.
  - [ ] Revisa el BOE por si hay nuevas normas sobre la renta.
- Copias de seguridad: el plan gratuito de Supabase no las incluye con restauración a un momento dado; con usuarios de pago, pasa al plan Pro de Supabase.
