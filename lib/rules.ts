// Motor de reglas de actualización de renta (vivienda habitual, LAU).
//
// Los topes temporales viven aquí como DATOS con fecha de vigencia, no como lógica:
// cuando cambie la norma (o un real decreto-ley no se convalide) se edita esta lista
// y todo lo demás sigue funcionando. Revisa CAP_RULES con un abogado antes de lanzar.

import type { ISODate } from "./dates.ts";

export type IndexName = "IPC" | "IRAV" | "OTRO" | "NINGUNO";

/** Los contratos firmados hasta esta fecha (incluida) son anteriores a la Ley 12/2023 de Vivienda. */
export const LEY_VIVIENDA_CUTOFF: ISODate = "2023-05-25";
/** Desde esta fecha el IRAV es el techo de las actualizaciones de contratos posteriores a la Ley de Vivienda. */
export const IRAV_FROM: ISODate = "2025-01-01";

export type CapRule = {
  id: string;
  /** Se aplica si el aniversario (fecha de actualización) cae entre from y to, ambos incluidos. */
  from: ISODate;
  to: ISODate;
  capPct: number;
  /** Si la renta supera el índice de precios de referencia, no cabe ninguna subida. */
  zeroIfAboveReference?: boolean;
  label: string;
  url: string;
  /** Aviso que se muestra siempre que la regla se aplica. */
  caveat?: string;
};

export const CAP_RULES: CapRule[] = [
  {
    id: "rdl-6-2022",
    from: "2022-03-31",
    to: "2023-12-31",
    capPct: 2,
    label: "Tope extraordinario del 2 % sin nuevo pacto (RDL 6/2022 y prórrogas)",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2022-4972",
  },
  {
    id: "ley-12-2023-2024",
    from: "2024-01-01",
    to: "2024-12-31",
    capPct: 3,
    label: "Tope del 3 % en 2024 sin nuevo pacto (Ley 12/2023, de Vivienda)",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2023-12203",
  },
  {
    id: "rdl-29-2026",
    from: "2026-10-08",
    to: "2027-12-31",
    capPct: 2,
    zeroIfAboveReference: true,
    label: "Tope del 2 % sin nuevo pacto (Real Decreto-ley 29/2026, de 6 de octubre)",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-20823",
    caveat:
      "Un real decreto-ley debe convalidarse en el Congreso. Comprueba en el BOE que sigue en vigor antes de enviar la carta.",
  },
];

export type UpdateInput = {
  signedDate: ISODate;
  /** Fecha en la que se cumple la anualidad y se aplica la actualización. */
  anniversary: ISODate;
  rent: number;
  updateClause: boolean;
  index: IndexName;
  /** Variación anual del índice pactado (en %), publicada por el INE. Para IRAV se usa iravPct. */
  indexPct: number | null;
  /** Último IRAV publicado por el INE (en %). Obligatorio en contratos posteriores a la Ley de Vivienda desde 2025. */
  iravPct: number | null;
  /** La renta actual supera el sistema estatal de índices de precios de referencia. */
  rentAboveReference: boolean;
};

export type UpdateResult = {
  allowed: boolean;
  pct: number;
  newRent: number;
  increase: number;
  regime: "anterior" | "posterior";
  indexLabel: string;
  steps: string[];
  rulesApplied: CapRule[];
  caveats: string[];
  missing: string[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtPct = (n: number) => n.toFixed(2).replace(".", ",");

export function activeCapRules(date: ISODate): CapRule[] {
  return CAP_RULES.filter((r) => r.from <= date && date <= r.to);
}

export function computeUpdate(input: UpdateInput): UpdateResult {
  const regime = input.signedDate <= LEY_VIVIENDA_CUTOFF ? "anterior" : "posterior";
  const base: UpdateResult = {
    allowed: false,
    pct: 0,
    newRent: input.rent,
    increase: 0,
    regime,
    indexLabel: input.index === "IRAV" ? "IRAV" : input.index === "IPC" ? "IPC" : "índice pactado",
    steps: [],
    rulesApplied: [],
    caveats: [],
    missing: [],
  };

  if (!input.updateClause || input.index === "NINGUNO") {
    base.steps.push(
      "El contrato no prevé actualización de la renta, así que no se puede subir (art. 18 LAU).",
    );
    return base;
  }

  base.steps.push(
    regime === "anterior"
      ? `Contrato firmado hasta el 25/05/2023: se actualiza con el índice pactado (${base.indexLabel}).`
      : "Contrato firmado después del 25/05/2023 (Ley de Vivienda): la actualización nunca puede superar el IRAV.",
  );

  const pactedPct = input.index === "IRAV" ? input.iravPct : input.indexPct;
  if (pactedPct === null || Number.isNaN(pactedPct)) {
    base.missing.push(input.index === "IRAV" ? "iravPct" : "indexPct");
    return base;
  }
  let pct = pactedPct;
  base.steps.push(`Variación del ${base.indexLabel}: ${fmtPct(pactedPct)} %.`);

  if (regime === "posterior" && input.anniversary >= IRAV_FROM && input.index !== "IRAV") {
    if (input.iravPct === null || Number.isNaN(input.iravPct)) {
      base.missing.push("iravPct");
      return base;
    }
    if (input.iravPct < pct) {
      pct = input.iravPct;
      base.steps.push(`Se limita al IRAV: ${fmtPct(input.iravPct)} %.`);
    }
  }

  for (const rule of activeCapRules(input.anniversary)) {
    const cap = rule.zeroIfAboveReference && input.rentAboveReference ? 0 : rule.capPct;
    if (pct > cap) {
      pct = cap;
      base.steps.push(
        cap === 0
          ? `${rule.label}: la renta supera el índice de referencia, así que no cabe subida.`
          : `${rule.label}: se limita al ${fmtPct(cap)} %.`,
      );
    }
    base.rulesApplied.push(rule);
    if (rule.caveat) base.caveats.push(rule.caveat);
  }

  if (pct < 0) {
    base.steps.push("El índice es negativo: la renta baja en la misma proporción.");
  }

  pct = round2(pct);
  const newRent = round2(input.rent * (1 + pct / 100));
  return { ...base, allowed: true, pct, newRent, increase: round2(newRent - input.rent) };
}
