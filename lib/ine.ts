// Descarga la variación anual del IPC y del IRAV desde la API pública del INE (wstempus).
// El INE cambia los códigos de serie cuando cambia de base; si dejan de llegar datos,
// actualiza INE_SERIE_IPC / INE_SERIE_IRAV en las variables de entorno.

import type { IndexValue } from "./types.ts";

export const DEFAULT_SERIES = {
  IPC: "IPC290750", // Nacional. Índice general. Variación anual.
  IRAV: "IRAV1", // Total Nacional. Índice general. Variación anual.
} as const;

type IneSeries = {
  COD: string;
  Data: { Anyo: number; FK_Periodo: number; Valor: number | null; Secreto?: boolean }[];
};

export function parseIneSeries(indexName: IndexValue["index_name"], json: IneSeries): IndexValue[] {
  return json.Data
    .filter((d) => d.Valor !== null && !d.Secreto && d.FK_Periodo >= 1 && d.FK_Periodo <= 12)
    .map((d) => ({
      index_name: indexName,
      period: `${d.Anyo}-${String(d.FK_Periodo).padStart(2, "0")}-01`,
      pct: Number(d.Valor),
    }));
}

export async function fetchIneSeries(indexName: IndexValue["index_name"], last = 24): Promise<IndexValue[]> {
  const code = (indexName === "IPC" ? process.env.INE_SERIE_IPC : process.env.INE_SERIE_IRAV) || DEFAULT_SERIES[indexName];
  const res = await fetch(`https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/${code}?nult=${last}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`INE ${code}: HTTP ${res.status}`);
  return parseIneSeries(indexName, (await res.json()) as IneSeries);
}
