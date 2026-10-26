// Renta vigente en cada mes, a partir del historial de actualizaciones aplicadas.

import { firstOfMonth, type ISODate } from "./dates.ts";
import type { Property, RentChange } from "./types.ts";

export function rentForPeriod(p: Property, changes: RentChange[], period: ISODate): number {
  const sorted = [...changes].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (sorted.length === 0) return Number(p.rent);
  let rent = Number(sorted[0].old_rent);
  for (const c of sorted) {
    if (firstOfMonth(c.effective_date) <= period) rent = Number(c.new_rent);
  }
  return rent;
}
