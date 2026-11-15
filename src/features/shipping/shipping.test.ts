import { describe, expect, it } from "vitest";
import { products } from "@/features/catalog";
import {
  needsRefresh,
  normalizeOptions,
  parseQuoteRequest,
  signState,
  verifyState,
} from "../../../supabase/functions/_shared/melhor-envio";
import { quoteProducts } from "./packaging";
import { cartSignature, formatDeadline } from "./shipping";

const pva = products[0].variants[0];

describe("quoteProducts", () => {
  it("gera uma entrada por linha com seguro em reais", () => {
    const [p] = quoteProducts([{ variantId: pva.id, qty: 3 }]);
    expect(p).toMatchObject({ quantity: 3, insurance_value: 14 });
    expect(parseQuoteRequest({ to: "58000000", products: [p] })).toBeDefined();
  });

  it("ignora variantes que não existem mais", () => {
    expect(quoteProducts([{ variantId: "x", qty: 1 }])).toEqual([]);
  });
});

describe("parseQuoteRequest", () => {
  it("rejeita CEP inválido e carga absurda", () => {
    const p = quoteProducts([{ variantId: pva.id, qty: 1 }]);
    expect(parseQuoteRequest({ to: "5800", products: p })).toBeUndefined();
    expect(
      parseQuoteRequest({ to: "58000000", products: [{ ...p[0], quantity: 9999 }] }),
    ).toBeUndefined();
  });
});

describe("normalizeOptions", () => {
  it("usa preço da conta, converte para centavos, ordena e descarta erros", () => {
    const out = normalizeOptions([
      {
        id: 2,
        name: "SEDEX",
        custom_price: "31.90",
        custom_delivery_range: { min: 2, max: 3 },
        company: { name: "Correios" },
      },
      {
        id: 1,
        name: "PAC",
        price: "20.10",
        custom_price: "18.55",
        custom_delivery_time: 6,
        company: { name: "Correios" },
      },
      { id: 3, name: ".Package", error: "Serviço indisponível" },
    ]);
    expect(out.map((o) => [o.id, o.priceCents, o.daysMin, o.daysMax])).toEqual([
      [1, 1855, 6, 6],
      [2, 3190, 2, 3],
    ]);
  });
});

describe("shipping", () => {
  it("muda a assinatura quando o carrinho muda", () => {
    expect(cartSignature([{ variantId: "a", qty: 1 }])).not.toBe(
      cartSignature([{ variantId: "a", qty: 2 }]),
    );
  });

  it("formata prazo", () => {
    const base = { id: 1, name: "", company: "", priceCents: 0 };
    expect(formatDeadline({ ...base, daysMin: 3, daysMax: 3 })).toBe("3 dias úteis");
    expect(formatDeadline({ ...base, daysMin: 2, daysMax: 4 })).toBe("2 a 4 dias úteis");
  });
});

describe("oauth", () => {
  it("aceita só estado assinado, recente e com o mesmo segredo", async () => {
    const now = 1_000_000;
    const state = await signState("segredo", now);
    expect(await verifyState("segredo", state, now + 60_000)).toBe(true);
    expect(await verifyState("outro", state, now + 60_000)).toBe(false);
    expect(await verifyState("segredo", state, now + 11 * 60_000)).toBe(false);
    expect(await verifyState("segredo", "1.abc", now)).toBe(false);
    expect(await verifyState("segredo", null, now)).toBe(false);
  });

  it("renova o token quando falta menos de um dia", () => {
    const now = Date.parse("2026-11-17T00:00:00Z");
    expect(needsRefresh("2026-11-17T12:00:00Z", now)).toBe(true);
    expect(needsRefresh("2026-12-10T00:00:00Z", now)).toBe(false);
  });
});
