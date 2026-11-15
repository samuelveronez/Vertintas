import { describe, expect, it } from "vitest";
import { buildTasks, orderTotalCents, unitCount } from "./production";
import type { Order } from "./types";

const order = (over: Partial<Order> & Pick<Order, "id" | "order_items">): Order => ({
  channel: "ml",
  external_ref: over.id,
  customer_name: `Cliente ${over.id}`,
  customer_phone: null,
  destination: "",
  shipping: "",
  status: "to_make",
  paid_at: null,
  tracking: null,
  note: "",
  ordered_at: "2026-11-15T10:00:00Z",
  ...over,
});
const item = (variant_id: string | null, name: string, qty: number, made = false) => ({
  id: `${name}${qty}`,
  variant_id,
  name,
  qty,
  unit_price_cents: 1400,
  made,
});

describe("buildTasks", () => {
  it("soma o mesmo item de pedidos e canais diferentes", () => {
    const tasks = buildTasks(
      [
        order({ id: "1", order_items: [item("a", "PVA Azul 100 ml", 3)] }),
        order({
          id: "2",
          channel: "site",
          order_items: [item("a", "PVA Azul 100 ml", 2)],
        }),
      ],
      {},
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ qty: 5, toMake: 5 });
    expect(tasks[0].orders.map((o) => o.channel)).toEqual(["ml", "site"]);
  });

  it("desconta o estoque do que precisa ser fabricado", () => {
    const [t] = buildTasks(
      [order({ id: "1", order_items: [item("a", "PVA Azul 100 ml", 3)] })],
      { a: 2 },
    );
    expect(t).toMatchObject({ qty: 3, inStock: 2, toMake: 1 });
  });

  it("não fabrica além da demanda quando o estoque cobre tudo", () => {
    const [t] = buildTasks(
      [order({ id: "1", order_items: [item("a", "PVA Azul 100 ml", 1)] })],
      { a: 9 },
    );
    expect(t.toMake).toBe(0);
  });

  it("ignora pedidos fora de 'a fabricar' e itens já feitos", () => {
    const tasks = buildTasks(
      [
        order({ id: "1", status: "pending_payment", order_items: [item("a", "A", 1)] }),
        order({ id: "2", status: "to_pack", order_items: [item("a", "A", 1)] }),
        order({ id: "3", order_items: [item("a", "A", 1, true), item("b", "B", 1)] }),
      ],
      {},
    );
    expect(tasks.map((t) => t.key)).toEqual(["b"]);
  });

  it("usa o nome como chave quando o item do ML não tem SKU", () => {
    const [t] = buildTasks(
      [order({ id: "1", order_items: [item(null, "Tinta sem SKU", 2)] })],
      {},
    );
    expect(t.key).toBe("Tinta sem SKU");
  });
});

describe("totais do pedido", () => {
  it("calcula valor e quantidade de frascos", () => {
    const o = order({ id: "1", order_items: [item("a", "A", 3), item("b", "B", 1)] });
    expect(orderTotalCents(o)).toBe(5600);
    expect(unitCount(o)).toBe(4);
  });
});
