// Elige el dato del INE que corresponde a una fecha de actualización.

import { addMonths, firstOfMonth, type ISODate } from "./dates.ts";
import type { IndexValue } from "./types.ts";

/** El INE publica el dato de un mes hacia mediados del mes siguiente. */
const PUBLICATION_DAY = 15;

/**
 * Último dato publicado antes de `date`: si la fecha es antes del día 15, el último
 * publicado es el de hace dos meses; a partir del 15, el del mes anterior.
 * Es una aproximación: el propietario ve el mes usado y puede corregir el valor.
 */
export function latestPublished(values: IndexValue[], indexName: IndexValue["index_name"], date: ISODate): IndexValue | null {
  const lag = Number(date.slice(8, 10)) >= PUBLICATION_DAY ? -1 : -2;
  const maxPeriod = addMonths(firstOfMonth(date), lag);
  return (
    values
      .filter((v) => v.index_name === indexName && v.period <= maxPeriod)
      .sort((a, b) => b.period.localeCompare(a.period))[0] ?? null
  );
}
