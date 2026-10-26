// Carta de actualización de renta. Plantilla pendiente de revisión por un abogado civil o inmobiliario.

import { formatLong, formatMonth, type ISODate } from "./dates.ts";
import type { UpdateResult } from "./rules.ts";

export type LetterInput = {
  landlordName: string;
  city: string;
  date: ISODate;
  tenantName: string;
  address: string;
  signedDate: ISODate;
  anniversary: ISODate;
  oldRent: number;
  result: UpdateResult;
};

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export function buildLetter(i: LetterInput): string[] {
  const r = i.result;
  const rules = r.rulesApplied.map((rule) => rule.label).join("; ");
  const direction = r.pct < 0 ? "reducción" : "actualización";

  return [
    `${i.city}, a ${formatLong(i.date)}`,
    `De: ${i.landlordName}, arrendador/a.`,
    `A: ${i.tenantName}, arrendatario/a de la vivienda situada en ${i.address}.`,
    `Asunto: ${direction} anual de la renta.`,
    `Estimado/a ${i.tenantName}:`,
    `Conforme a lo previsto en el contrato de arrendamiento firmado el ${formatLong(i.signedDate)} y en el artículo 18 de la Ley 29/1994, de Arrendamientos Urbanos, le comunico la ${direction} anual de la renta con efectos desde el ${formatLong(i.anniversary)}, fecha en que se cumple una nueva anualidad del contrato.`,
    `La variación aplicada es del ${r.pct.toFixed(2).replace(".", ",")} %, calculada con el ${r.indexLabel}${r.regime === "posterior" && r.indexLabel !== "IRAV" ? " y con el límite del Índice de Referencia para la Actualización de Arrendamientos de Vivienda (IRAV) publicado por el INE" : ""}${rules ? `, y respetando el límite legal vigente (${rules})` : ""}.`,
    `La renta mensual pasa de ${eur(i.oldRent)} a ${eur(r.newRent)} (${r.increase >= 0 ? "+" : ""}${eur(r.increase)} al mes). La nueva renta será exigible a partir de la mensualidad de ${formatMonth(i.anniversary)}, o desde el mes siguiente a la recepción de esta comunicación si fuera posterior.`,
    "Quedo a su disposición para cualquier aclaración, y le ruego que me confirme la recepción de esta carta.",
    "Atentamente,",
    i.landlordName,
  ];
}
