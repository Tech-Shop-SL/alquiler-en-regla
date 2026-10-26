import { test } from "node:test";
import assert from "node:assert/strict";
import { computeUpdate, type UpdateInput } from "./rules.ts";
import { contractTerm, propertyAlerts, unpaidPeriods } from "./alerts.ts";
import { rentForPeriod } from "./rent.ts";
import { latestPublished } from "./indices.ts";
import { parseIneSeries } from "./ine.ts";
import { addMonths, nextAnniversary } from "./dates.ts";
import type { Property } from "./types.ts";

const base: UpdateInput = {
  signedDate: "2021-03-01",
  anniversary: "2025-03-01",
  rent: 1000,
  updateClause: true,
  index: "IPC",
  indexPct: 3,
  iravPct: 2.2,
  rentAboveReference: false,
};

test("sin cláusula no hay subida", () => {
  const r = computeUpdate({ ...base, updateClause: false });
  assert.equal(r.allowed, false);
  assert.equal(r.newRent, 1000);
});

test("contrato anterior a la Ley de Vivienda en 2025: IPC sin tope", () => {
  const r = computeUpdate(base);
  assert.equal(r.regime, "anterior");
  assert.equal(r.pct, 3);
  assert.equal(r.newRent, 1030);
});

test("contrato posterior a la Ley de Vivienda en 2025: se limita al IRAV", () => {
  const r = computeUpdate({ ...base, signedDate: "2023-06-01", anniversary: "2025-06-01" });
  assert.equal(r.regime, "posterior");
  assert.equal(r.pct, 2.2);
});

test("el 25/05/2023 todavía es régimen anterior", () => {
  assert.equal(computeUpdate({ ...base, signedDate: "2023-05-25" }).regime, "anterior");
});

test("2024: tope del 3 %", () => {
  const r = computeUpdate({ ...base, anniversary: "2024-03-01", indexPct: 3.4 });
  assert.equal(r.pct, 3);
});

test("RDL 29/2026: tope del 2 % entre el 8/10/2026 y el 31/12/2027", () => {
  const r = computeUpdate({ ...base, anniversary: "2026-11-01", indexPct: 2.9 });
  assert.equal(r.pct, 2);
  assert.equal(r.caveats.length, 1);
  assert.equal(computeUpdate({ ...base, anniversary: "2026-10-07", indexPct: 2.9 }).pct, 2.9);
  assert.equal(computeUpdate({ ...base, anniversary: "2028-01-01", indexPct: 2.9 }).pct, 2.9);
});

test("RDL 29/2026: renta por encima del índice de referencia, 0 %", () => {
  const r = computeUpdate({ ...base, anniversary: "2027-01-01", rentAboveReference: true });
  assert.equal(r.pct, 0);
  assert.equal(r.newRent, 1000);
});

test("falta el IRAV en un contrato posterior", () => {
  const r = computeUpdate({ ...base, signedDate: "2024-01-01", iravPct: null });
  assert.deepEqual(r.missing, ["iravPct"]);
});

test("addMonths ajusta fin de mes y años bisiestos", () => {
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonths("2024-02-29", 12), "2025-02-28");
});

test("próximo aniversario", () => {
  assert.equal(nextAnniversary("2022-03-15", "2026-10-26"), "2027-03-15");
  assert.equal(nextAnniversary("2022-11-01", "2026-10-26"), "2026-11-01");
});

const prop: Property = {
  id: "p1", owner_id: "u1", name: "Piso Centro", address: null, tenant_name: null,
  tenant_email: null, tenant_phone: null, rent: 800, signed_date: "2022-01-10",
  start_date: "2022-02-01", duration_years: 1, update_clause: true, update_index: "IPC",
  update_clause_text: null, landlord_is_company: false, payment_day: 5, notes: null,
};

test("prórroga obligatoria de 5 años (7 si el arrendador es empresa)", () => {
  assert.equal(contractTerm(prop, "2026-10-26").mandatoryEnd, "2027-02-01");
  assert.equal(contractTerm({ ...prop, landlord_is_company: true }, "2026-10-26").mandatoryEnd, "2029-02-01");
  const tacit = contractTerm(prop, "2027-06-01");
  assert.equal(tacit.currentEnd, "2030-02-01");
  assert.equal(tacit.inTacitExtension, true);
});

test("alertas: aviso de subida, preaviso de fin y cobro pendiente", () => {
  const alerts = propertyAlerts(prop, [], "2026-10-26");
  assert.deepEqual(alerts.map((a) => a.kind), ["preaviso_fin", "cobro", "aviso_subida", "aniversario", "fin_contrato"]);
  // El preaviso (1/10/2026) ya pasó: se avisa como vencido.
  assert.equal(alerts[0].title, "Plazo de preaviso vencido");
  assert.equal(propertyAlerts(prop, [], "2026-09-01").find((a) => a.kind === "preaviso_fin")?.title, "Último día para avisar si no quieres renovar");
  const paid = propertyAlerts(prop, [{ id: "x", property_id: "p1", period: "2026-10-01", amount: 800, paid_at: "2026-10-03" }], "2026-10-26");
  assert.ok(!paid.some((a) => a.kind === "cobro"));
});

test("aviso de subida tardío y ya aplicado", () => {
  const late = propertyAlerts(prop, [], "2027-01-20").find((a) => a.kind === "aviso_subida");
  assert.equal(late?.title, "Vas tarde para comunicar la subida");
  const change = { id: "c", property_id: "p1", effective_date: "2027-02-01", old_rent: 800, new_rent: 816, pct: 2 };
  assert.ok(!propertyAlerts(prop, [], "2027-01-20", [change]).some((a) => a.kind === "aviso_subida"));
});

test("cobros atrasados desde que el piso está en la app", () => {
  const added = { ...prop, created_at: "2026-08-15T10:00:00Z" };
  assert.deepEqual(unpaidPeriods(added, [], "2026-10-26"), ["2026-08-01", "2026-09-01", "2026-10-01"]);
  assert.deepEqual(unpaidPeriods(added, [], "2026-10-03"), ["2026-08-01", "2026-09-01"]);
  const alert = propertyAlerts(added, [], "2026-10-26").find((a) => a.kind === "cobro");
  assert.equal(alert?.title, "3 cobros pendientes");
});

test("renta por mes según el historial", () => {
  const changes = [{ id: "c", property_id: "p1", effective_date: "2027-02-01", old_rent: 800, new_rent: 816, pct: 2 }];
  assert.equal(rentForPeriod({ ...prop, rent: 816 }, changes, "2027-01-01"), 800);
  assert.equal(rentForPeriod({ ...prop, rent: 816 }, changes, "2027-02-01"), 816);
  assert.equal(rentForPeriod(prop, [], "2027-02-01"), 800);
});

test("índice publicado para una fecha", () => {
  const values = [
    { index_name: "IPC" as const, period: "2026-08-01", pct: 4.5 },
    { index_name: "IPC" as const, period: "2026-09-01", pct: 4.9 },
    { index_name: "IRAV" as const, period: "2026-09-01", pct: 2.54 },
  ];
  assert.equal(latestPublished(values, "IPC", "2026-11-01")?.pct, 4.9);
  assert.equal(latestPublished(values, "IPC", "2026-10-01")?.pct, 4.5);
  assert.equal(latestPublished(values, "IRAV", "2026-10-20")?.pct, 2.54);
  assert.equal(latestPublished(values, "IRAV", "2026-01-01"), null);
});

test("parseo de la API del INE", () => {
  const parsed = parseIneSeries("IRAV", {
    COD: "IRAV1",
    Data: [{ Anyo: 2026, FK_Periodo: 9, Valor: 2.54 }, { Anyo: 2026, FK_Periodo: 8, Valor: null }],
  });
  assert.deepEqual(parsed, [{ index_name: "IRAV", period: "2026-09-01", pct: 2.54 }]);
});
