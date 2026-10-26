// Enlaces de recordatorio de pago al inquilino: el propietario los abre y envía desde su propio WhatsApp o correo.

import { formatMonth, type ISODate } from "./dates.ts";
import type { Property } from "./types.ts";

export function reminderText(p: Property, period: ISODate): string {
  const amount = Number(p.rent).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const hello = p.tenant_name ? `Hola, ${p.tenant_name.split(" ")[0]}` : "Hola";
  return `${hello}. Te escribo para recordarte el pago del alquiler de ${formatMonth(period)} (${amount}) de ${p.address ?? p.name}, que vencía el día ${p.payment_day}. Si ya lo has hecho, ignora este mensaje. ¡Gracias!`;
}

export function whatsappLink(p: Property, period: ISODate): string | null {
  const phone = (p.tenant_phone ?? "").replace(/\D/g, "");
  if (!phone) return null;
  const withPrefix = phone.length === 9 ? `34${phone}` : phone;
  return `https://wa.me/${withPrefix}?text=${encodeURIComponent(reminderText(p, period))}`;
}

export function mailtoLink(p: Property, period: ISODate): string | null {
  if (!p.tenant_email) return null;
  const subject = `Recordatorio: alquiler de ${formatMonth(period)}`;
  return `mailto:${p.tenant_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reminderText(p, period))}`;
}
