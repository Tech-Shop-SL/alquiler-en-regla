// Fechas como cadenas ISO "YYYY-MM-DD" en UTC, para no depender de la zona horaria del servidor.

export type ISODate = string;

function parse(d: ISODate): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function format(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function today(): ISODate {
  return format(new Date());
}

export function addDays(d: ISODate, days: number): ISODate {
  const date = parse(d);
  date.setUTCDate(date.getUTCDate() + days);
  return format(date);
}

/** Suma meses; si el día no existe en el mes destino (31 → 30, 29-feb), usa el último día. */
export function addMonths(d: ISODate, months: number): ISODate {
  const date = parse(d);
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return format(target);
}

export function addYears(d: ISODate, years: number): ISODate {
  return addMonths(d, years * 12);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

export function firstOfMonth(d: ISODate): ISODate {
  return d.slice(0, 8) + "01";
}

/** Próximo aniversario del contrato en o después de `from`. */
export function nextAnniversary(start: ISODate, from: ISODate): ISODate {
  let years = Math.max(1, Number(from.slice(0, 4)) - Number(start.slice(0, 4)) - 1);
  let candidate = addYears(start, years);
  while (candidate < from) {
    years += 1;
    candidate = addYears(start, years);
  }
  return candidate;
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatLong(d: ISODate): string {
  const date = parse(d);
  return `${date.getUTCDate()} de ${MONTHS[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

export function formatShort(d: ISODate): string {
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

export function formatMonth(d: ISODate): string {
  const date = parse(d);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
