import type { Channel, Order, StockMap } from "./types";

export type Task = {
  /** SKU do catálogo; para item do ML ainda não associado, o próprio nome. */
  key: string;
  name: string;
  qty: number;
  inStock: number;
  /** O que realmente precisa ser fabricado depois de usar o estoque. */
  toMake: number;
  orders: { orderId: string; customer: string; channel: Channel; qty: number }[];
};

export const orderTotalCents = (o: Order) =>
  o.order_items.reduce((sum, i) => sum + i.unit_price_cents * i.qty, 0);

export const unitCount = (o: Order) => o.order_items.reduce((n, i) => n + i.qty, 0);

/** Soma, por item, o que falta fabricar ou separar nos pedidos pagos de todos os canais. */
export function buildTasks(orders: Order[], stock: StockMap): Task[] {
  const byKey = new Map<string, Task>();
  for (const order of orders) {
    if (order.status !== "to_make") continue;
    for (const item of order.order_items) {
      if (item.made) continue;
      const key = item.variant_id ?? item.name;
      const task = byKey.get(key) ?? {
        key,
        name: item.name,
        qty: 0,
        inStock: stock[key] ?? 0,
        toMake: 0,
        orders: [],
      };
      task.qty += item.qty;
      task.orders.push({
        orderId: order.id,
        customer: order.customer_name,
        channel: order.channel,
        qty: item.qty,
      });
      byKey.set(key, task);
    }
  }
  return [...byKey.values()]
    .map((t) => ({ ...t, toMake: Math.max(0, t.qty - t.inStock) }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
