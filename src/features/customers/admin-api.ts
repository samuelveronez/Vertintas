import { supabase } from "@/lib/supabase";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  accepts_whatsapp: boolean;
  accepts_email: boolean;
  consent_at: string | null;
  has_account: boolean;
  created_at: string;
  orders_count: number;
  total_cents: number;
  last_order_at: string | null;
};

function db() {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

export async function fetchCustomers(): Promise<CustomerRow[]> {
  const { data, error } = await db().rpc("customers_overview");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateCustomer(
  id: string,
  patch: Partial<
    Pick<CustomerRow, "name" | "phone" | "email" | "accepts_whatsapp" | "accepts_email">
  >,
) {
  const { error } = await db().from("customers").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Exclusão definitiva (LGPD); os pedidos ficam, sem a ligação com o cliente. */
export async function deleteCustomer(id: string) {
  const { error } = await db().from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
