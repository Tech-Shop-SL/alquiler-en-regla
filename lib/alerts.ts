// Calendario de cada contrato: aniversario, plazo para comunicar la subida, fin de contrato y cobros.

import {
  addDays, addMonths, addYears, daysBetween, firstOfMonth, formatLong, formatMonth, nextAnniversary,
  type ISODate,
} from "./dates.ts";
import type { Payment, Property, RentChange } from "./types.ts";

export type AlertKind = "aviso_subida" | "aniversario" | "preaviso_fin" | "fin_contrato" | "cobro";

export type Alert = {
  kind: AlertKind;
  propertyId: string;
  propertyName: string;
  date: ISODate;
  daysLeft: number;
  title: string;
  detail: string;
  level: "urgente" | "pronto" | "info";
};

/** Antelación recomendada para comunicar la actualización por escrito (art. 18.2 LAU: exigible desde el mes siguiente a la notificación). */
export const NOTICE_DAYS = 30;
/** Preaviso del arrendador para no renovar (art. 10 LAU). */
export const LANDLORD_NOTICE_MONTHS = 4;
/** Contratos firmados desde esta fecha siguen el RDL 7/2019 (prórroga obligatoria 5/7 años + tácita 3 años). */
const RDL_7_2019: ISODate = "2019-03-06";

export type ContractTerm = {
  mandatoryEnd: ISODate;
  currentEnd: ISODate;
  inTacitExtension: boolean;
  oldRegime: boolean;
};

export function contractTerm(p: Property, from: ISODate): ContractTerm {
  const oldRegime = p.start_date < RDL_7_2019;
  const minYears = oldRegime ? 3 : p.landlord_is_company ? 7 : 5;
  const tacitYears = oldRegime ? 1 : 3;
  const mandatoryEnd = addYears(p.start_date, Math.max(p.duration_years, minYears));
  let currentEnd = mandatoryEnd;
  while (currentEnd < from) currentEnd = addYears(currentEnd, tacitYears);
  return { mandatoryEnd, currentEnd, inTacitExtension: currentEnd !== mandatoryEnd, oldRegime };
}

function level(daysLeft: number): Alert["level"] {
  if (daysLeft <= 7) return "urgente";
  if (daysLeft <= 30) return "pronto";
  return "info";
}

/** Meses sin cobro registrado: desde que el piso está en la app (máx. 12 meses atrás) hasta hoy, si ya venció. */
export function unpaidPeriods(p: Property, payments: Payment[], from: ISODate): ISODate[] {
  const current = firstOfMonth(from);
  const added = p.created_at ? firstOfMonth(p.created_at.slice(0, 10)) : current;
  const earliest = [firstOfMonth(p.start_date), added, addMonths(current, -11)].sort().at(-1)!;
  const unpaid: ISODate[] = [];
  for (let m = earliest; m <= current; m = addMonths(m, 1)) {
    const due = addDays(m, p.payment_day - 1);
    if (due <= from && !payments.some((pay) => pay.period === m)) unpaid.push(m);
  }
  return unpaid;
}

export function propertyAlerts(p: Property, payments: Payment[], from: ISODate, changes: RentChange[] = []): Alert[] {
  const alerts: Alert[] = [];
  const push = (kind: AlertKind, date: ISODate, title: string, detail: string) => {
    const daysLeft = daysBetween(from, date);
    alerts.push({ kind, propertyId: p.id, propertyName: p.name, date, daysLeft, title, detail, level: level(daysLeft) });
  };

  const anniversary = nextAnniversary(p.start_date, from);
  if (p.update_clause && p.update_index !== "NINGUNO") {
    const noticeBy = addDays(anniversary, -NOTICE_DAYS);
    const alreadyApplied = changes.some((c) => c.effective_date === anniversary);
    if (alreadyApplied) {
      // Ya se aplicó la subida de este aniversario: nada que avisar.
    } else if (noticeBy >= from) {
      push(
        "aviso_subida",
        noticeBy,
        "Comunica la actualización de renta",
        `Envía la carta antes del ${formatLong(noticeBy)} para poder cobrarla desde el aniversario (${formatLong(anniversary)}).`,
      );
    } else {
      push(
        "aviso_subida",
        noticeBy,
        "Vas tarde para comunicar la subida",
        `Envíala cuanto antes: la nueva renta solo se podrá cobrar desde el mes siguiente a que el inquilino reciba la carta.`,
      );
    }
    push("aniversario", anniversary, "Aniversario del contrato", "Fecha en la que se aplica la actualización anual.");
  } else {
    push("aniversario", anniversary, "Aniversario del contrato", "El contrato no prevé actualización: la renta no cambia.");
  }

  const term = contractTerm(p, from);
  const noticeEnd = addMonths(term.currentEnd, -LANDLORD_NOTICE_MONTHS);
  const extension = term.oldRegime ? "1 año" : "hasta 3 años";
  if (noticeEnd >= from) {
    push(
      "preaviso_fin",
      noticeEnd,
      "Último día para avisar si no quieres renovar",
      `Si no avisas por escrito antes de esta fecha, el contrato se prorroga ${extension} más (art. 10 LAU).`,
    );
  } else {
    push(
      "preaviso_fin",
      noticeEnd,
      "Plazo de preaviso vencido",
      `Ya no puedes evitar la prórroga: si nadie avisó a tiempo, el contrato sigue ${extension} más tras el ${formatLong(term.currentEnd)}. Si avisaste por escrito antes de esta fecha, ignora este mensaje.`,
    );
  }
  push(
    "fin_contrato",
    term.currentEnd,
    term.inTacitExtension ? "Fin de la prórroga tácita" : "Fin de la prórroga obligatoria",
    term.oldRegime
      ? "Contrato anterior al 6/3/2019: revisa los plazos con tu asesor."
      : "A partir de aquí el contrato puede terminar si se avisa con antelación.",
  );

  const unpaid = unpaidPeriods(p, payments, from);
  if (unpaid.length > 0) {
    push(
      "cobro",
      addDays(unpaid[0], p.payment_day - 1),
      unpaid.length === 1 ? "Cobro pendiente" : `${unpaid.length} cobros pendientes`,
      `Sin pago registrado: ${unpaid.map(formatMonth).join(", ")}.`,
    );
  }

  return alerts.sort((a, b) => a.date.localeCompare(b.date));
}
