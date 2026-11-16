import { supabase } from "@/lib/supabase";
import type { Order, Status, StockItem, StockMap } from "./types";

function db() {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

const must = <T>(res: { data: T; error: { message: string } | null }) => {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
};

export async function fetchOrders(): Promise<Order[]> {
  const data = must(
    await db()
      .from("orders")
      .select("*, order_items(*)")
      .order("ordered_at", { ascending: false })
      .limit(300),
  );
  return data as Order[];
}

export async function fetchStock(): Promise<StockMap> {
  const rows = must(await db().from("stock").select("variant_id, qty"));
  return Object.fromEntries(rows.map((r) => [r.variant_id, r.qty]));
}

export async function fetchStockItems(): Promise<StockItem[]> {
  return must(
    await db().from("stock_items").select("variant_id, product, color, size, archived"),
  ) as StockItem[];
}

/** Cria ou atualiza (arquivar/restaurar) itens; o estoque começa em zero. */
export async function saveStockItems(items: StockItem[]) {
  must(await db().from("stock_items").upsert(items));
}

export async function setStatus(
  id: string,
  status: Status,
  patch: { paid_at?: string | null; tracking?: string | null } = {},
) {
  must(
    await db()
      .from("orders")
      .update({ status, ...patch })
      .eq("id", id),
  );
}

export type MadeResult = { item_ids: string[]; stock_used: number };

export async function markMade(variant: string): Promise<MadeResult> {
  return must(await db().rpc("mark_made", { p_variant: variant })) as MadeResult;
}

export async function undoMade(variant: string, result: MadeResult) {
  must(
    await db().rpc("undo_made", {
      p_variant: variant,
      p_item_ids: result.item_ids,
      p_stock_used: result.stock_used,
    }),
  );
}

export async function adjustStock(variant: string, delta: number) {
  must(await db().rpc("adjust_stock", { p_variant: variant, p_delta: delta }));
}

export type NewOrderItem = {
  variant_id: string;
  name: string;
  qty: number;
  unit_price_cents: number;
};

/** Cliente gravado junto do pedido do site; o endereço só vai quando há entrega. */
export type NewOrderCustomer = {
  email?: string;
  accepts_whatsapp: boolean;
  accepts_email: boolean;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};

export type NewOrder = {
  external_ref: string;
  name: string;
  phone: string;
  destination: string;
  shipping: string;
  note: string;
  items: NewOrderItem[];
  customer?: NewOrderCustomer;
};

/** Pedido lançado à mão pela equipe (WhatsApp). `paid` libera direto para fabricação. */
export async function createManualOrder(order: NewOrder, paid: boolean) {
  const row = must(
    await db()
      .from("orders")
      .insert({
        channel: "wa",
        external_ref: order.external_ref,
        customer_name: order.name,
        customer_phone: order.phone || null,
        destination: order.destination,
        shipping: order.shipping,
        note: order.note,
        status: paid ? "to_make" : "pending_payment",
        paid_at: paid ? new Date().toISOString() : null,
      })
      .select("id")
      .single(),
  );
  must(
    await db()
      .from("order_items")
      .insert(order.items.map((i) => ({ ...i, order_id: row.id }))),
  );
}

/** Chamado pelo checkout público; falhar não pode atrapalhar o cliente (o WhatsApp segue). */
export async function placeSiteOrder(order: NewOrder) {
  if (!supabase) return;
  const { error } = await supabase.rpc("place_site_order", {
    p_ref: order.external_ref,
    p_name: order.name,
    p_phone: order.phone,
    p_destination: order.destination,
    p_shipping: order.shipping,
    p_note: order.note,
    p_items: order.items,
    p_customer: order.customer ?? null,
  });
  if (error) throw new Error(error.message);
}

export type MlStatus = {
  connected: boolean;
  connected_at?: string | null;
  last_sync_at?: string | null;
};

export async function fetchMlStatus(): Promise<MlStatus> {
  return (must(await db().rpc("ml_status")) as MlStatus | null) ?? { connected: false };
}

/** A Edge Function `ml` valida o login da equipe e devolve a URL de autorização do ML. */
export async function mlAction(action: "connect" | "sync"): Promise<{ url?: string }> {
  const { data, error } = await db().functions.invoke("ml", { body: { action } });
  if (error) throw new Error(error.message);
  return data ?? {};
}
