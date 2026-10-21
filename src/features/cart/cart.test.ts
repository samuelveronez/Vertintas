import { describe, expect, it } from "vitest";
import { addLine, lineKey, setQty, totalCents } from "./cart";
import { products } from "@/features/catalog";

const pva = products[0].variants[0];

describe("cart", () => {
  it("soma quantidade da mesma linha", () => {
    const lines = addLine(addLine([], { variantId: pva.id, qty: 1 }), {
      variantId: pva.id,
      qty: 2,
    });
    expect(lines).toEqual([{ variantId: pva.id, qty: 3 }]);
  });

  it("separa kits com cores diferentes", () => {
    const lines = addLine(addLine([], { variantId: "k", qty: 1, colors: ["Ouro"] }), {
      variantId: "k",
      qty: 1,
      colors: ["Prata"],
    });
    expect(lines).toHaveLength(2);
  });

  it("remove a linha quando a quantidade chega a zero", () => {
    const lines = [{ variantId: pva.id, qty: 2 }];
    expect(setQty(lines, lineKey(lines[0]), 0)).toEqual([]);
  });

  it("calcula o total em centavos", () => {
    expect(totalCents([{ variantId: pva.id, qty: 3 }])).toBe(pva.priceCents * 3);
  });
});
