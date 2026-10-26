import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = { title: `Política de privacidad — ${site.name}` };

// Revísala con un profesional antes de publicar.
export default function Privacy() {
  return (
    <LegalPage title="Política de privacidad" updated="26 de octubre de 2026">
      <h2>Responsable</h2>
      <p>{site.legalName}, NIF {site.legalId}, {site.legalAddress}. Contacto: {site.contactEmail}.</p>

      <h2>Qué datos tratamos y para qué</h2>
      <ul>
        <li><strong>Lista de espera:</strong> tu email, número de pisos y tu respuesta opcional, para avisarte del lanzamiento. Base: tu consentimiento, que puedes retirar cuando quieras.</li>
        <li><strong>Cuenta:</strong> tu email, para darte acceso y enviarte las alertas del servicio. Base: ejecución del contrato.</li>
        <li><strong>Datos de tus contratos e inquilinos</strong> (nombre, email, móvil, renta, fechas y cobros): los tratamos por cuenta tuya, como encargados del tratamiento, solo para prestarte el servicio. Tú eres responsable de tener una base legítima para tratarlos (normalmente, el propio contrato de alquiler).</li>
        <li><strong>Contratos en PDF:</strong> se envían a nuestro proveedor de IA únicamente para extraer los datos y no se almacenan.</li>
        <li><strong>Pagos:</strong> los gestiona Stripe; no guardamos datos de tarjeta. Conservamos los datos de facturación el tiempo que exige la ley fiscal.</li>
      </ul>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>Mientras tengas la cuenta abierta. Si la eliminas, borramos tus datos y los de tus pisos en ese momento, salvo los que debamos conservar por obligación legal.</p>

      <h2>Proveedores (encargados del tratamiento)</h2>
      <p>
        Supabase (base de datos, alojada en la UE), Vercel (alojamiento), Stripe (pagos), Anthropic (lectura de contratos),
        Resend (emails) y Plausible (estadísticas de visitas anónimas, sin cookies). Algunos están en EE. UU. y se acogen al
        Marco de Privacidad de Datos UE-EE. UU. o a cláusulas contractuales tipo.
      </p>

      <h2>Cookies</h2>
      <p>Solo usamos las cookies técnicas imprescindibles para mantener tu sesión iniciada. No usamos cookies de publicidad ni de analítica.</p>

      <h2>Seguridad</h2>
      <p>Los datos se cifran en tránsito (HTTPS) y en reposo, y cada propietario solo puede acceder a sus propios datos.</p>

      <h2>Tus derechos</h2>
      <p>
        Puedes descargar todos tus datos o eliminar tu cuenta desde «Mi cuenta». También puedes ejercer los derechos de acceso,
        rectificación, supresión, oposición, limitación y portabilidad escribiendo a {site.contactEmail}, y reclamar ante la
        Agencia Española de Protección de Datos (aepd.es).
      </p>
    </LegalPage>
  );
}
