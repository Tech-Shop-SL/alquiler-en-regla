import type { ISODate } from "./dates.ts";
import type { IndexName } from "./rules.ts";

export type Property = {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  rent: number;
  signed_date: ISODate;
  start_date: ISODate;
  duration_years: number;
  update_clause: boolean;
  update_index: IndexName;
  update_clause_text: string | null;
  landlord_is_company: boolean;
  payment_day: number;
  notes: string | null;
  created_at?: string;
};

export type RentChange = {
  id: string;
  property_id: string;
  effective_date: ISODate;
  old_rent: number;
  new_rent: number;
  pct: number;
};

export type IndexValue = {
  index_name: "IPC" | "IRAV";
  period: ISODate;
  pct: number;
};

export type Payment = {
  id: string;
  property_id: string;
  period: ISODate;
  amount: number;
  paid_at: ISODate;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
};

export const FREE_PROPERTY_LIMIT = 1;
export const PRO_PROPERTY_LIMIT = 5;
/** Lecturas de contrato con IA al mes. */
export const EXTRACTION_LIMIT = { free: 3, pro: 20 } as const;
