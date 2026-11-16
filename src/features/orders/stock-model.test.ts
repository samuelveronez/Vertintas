import { describe, expect, it } from "vitest";
import type { Product } from "@/features/catalog/types";
import {
  buildArchived,
  buildGroups,
  buildNewItems,
  mergeItems,
  newItemSchema,
} from "./stock-model";
import type { StockItem } from "./types";

const variant = (id: string, size: string, color?: string) => ({
  id,
  size,
  color,
  priceCents: 1400,
  images: [],
});
const catalog = [
  {
    slug: "pva",
    name: "Tinta PVA",
    tagline: "",
    description: "",
    uses: [],
    variants: [
      variant("a100", "100 ml", "Azul"),
      variant("a250", "250 ml", "Azul"),
      variant("r100", "100 ml", "Rosa"),
    ],
  },
] as Product[];

describe("buildGroups", () => {
  it("monta a grade cor × tamanho", () => {
    const [g] = buildGroups(mergeItems(catalog, []));
    expect(g.sizes).toEqual(["100 ml", "250 ml"]);
    expect(g.rows.map((r) => r.color)).toEqual(["Azul", "Rosa"]);
    expect(g.rows[1].ids).toEqual({ "100 ml": "r100" });
  });

  it("esconde arquivados e lista em Arquivados por cor", () => {
    const archived: StockItem[] = ["a100", "a250"].map((id, i) => ({
      variant_id: id,
      product: "Tinta PVA",
      color: "Azul",
      size: i ? "250 ml" : "100 ml",
      archived: true,
    }));
    const items = mergeItems(catalog, archived);
    expect(buildGroups(items)[0].rows.map((r) => r.color)).toEqual(["Rosa"]);
    const [entry] = buildArchived(items);
    expect(entry.label).toBe("Tinta PVA · Azul");
    expect(entry.items).toHaveLength(2);
  });
});

describe("buildNewItems", () => {
  const parse = (v: object) => newItemSchema.parse(v);

  it("cria um item por tamanho, sem repetir", () => {
    const r = buildNewItems(
      parse({ product: "Glitter", color: "Ouro", sizes: "10 g, 20 g, 10 g" }),
      [],
    );
    expect("items" in r && r.items.map((i) => i.variant_id)).toEqual([
      "painel-glitter-ouro-10-g",
      "painel-glitter-ouro-20-g",
    ]);
  });

  it("recusa combinação já existente, mesmo arquivada", () => {
    const existing = mergeItems(catalog, [
      { variant_id: "a100", product: "Tinta PVA", color: "Azul", size: "100 ml", archived: true },
    ]);
    const r = buildNewItems(
      parse({ product: "tinta pva", color: "azul", sizes: "100 ml" }),
      existing,
    );
    expect(r).toEqual({ error: "Tinta PVA · Azul · 100 ml já existe (arquivado)." });
  });

  it("exige produto e tamanho", () => {
    expect(newItemSchema.safeParse({ product: "", color: "", sizes: "10 g" }).success).toBe(false);
    expect(newItemSchema.safeParse({ product: "X", color: "", sizes: " , " }).success).toBe(false);
  });
});
