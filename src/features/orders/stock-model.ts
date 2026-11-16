import { z } from "zod";
import type { Product } from "@/features/catalog/types";
import type { StockItem } from "./types";

export type StockRow = { color: string; ids: Record<string, string> };
export type StockGroup = { product: string; sizes: string[]; rows: StockRow[] };
export type ArchivedEntry = { key: string; label: string; items: StockItem[] };

const label = (...parts: string[]) => parts.filter(Boolean).join(" · ");

/** Catálogo do site + itens do painel; a linha do banco vence (é assim que um item do catálogo é arquivado). */
export function mergeItems(catalog: Product[], saved: StockItem[]): StockItem[] {
  const byId = new Map<string, StockItem>();
  for (const p of catalog) {
    for (const v of p.variants) {
      byId.set(v.id, {
        variant_id: v.id,
        product: p.name,
        color: v.color ?? "",
        size: v.size,
        archived: false,
      });
    }
  }
  for (const s of saved) byId.set(s.variant_id, s);
  return [...byId.values()];
}

/** Produto → grade de cores (linhas) × tamanhos (colunas), só com itens ativos. */
export function buildGroups(items: StockItem[]): StockGroup[] {
  const groups = new Map<string, StockGroup>();
  for (const it of items) {
    if (it.archived) continue;
    const g = groups.get(it.product) ?? { product: it.product, sizes: [], rows: [] };
    groups.set(it.product, g);
    if (!g.sizes.includes(it.size)) g.sizes.push(it.size);
    let row = g.rows.find((r) => r.color === it.color);
    if (!row) g.rows.push((row = { color: it.color, ids: {} }));
    row.ids[it.size] = it.variant_id;
  }
  return [...groups.values()];
}

/** Arquivados agrupados por produto e cor, para restaurar de uma vez. */
export function buildArchived(items: StockItem[]): ArchivedEntry[] {
  const entries = new Map<string, ArchivedEntry>();
  for (const it of items) {
    if (!it.archived) continue;
    const key = `${it.product}|${it.color}`;
    const e = entries.get(key) ?? { key, label: label(it.product, it.color), items: [] };
    e.items.push(it);
    entries.set(key, e);
  }
  return [...entries.values()];
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const same = (a: string, b: string) => slug(a) === slug(b);

export const newItemSchema = z.object({
  product: z.string().trim().min(1, "Informe o produto.").max(80),
  color: z.string().trim().max(60),
  sizes: z
    .string()
    .transform((s) =>
      [...new Set(s.split(/[,;]/).map((x) => x.trim()).filter(Boolean))],
    )
    .pipe(z.array(z.string().max(40)).min(1, "Informe ao menos um tamanho.").max(12)),
});

/** Gera um item por tamanho; recusa combinação que já existe (inclusive arquivada). */
export function buildNewItems(
  input: z.output<typeof newItemSchema>,
  existing: StockItem[],
): { items: StockItem[] } | { error: string } {
  // Reaproveita a grafia do produto/cor existentes para não duplicar por diferença de maiúscula.
  const product = existing.find((e) => same(e.product, input.product))?.product ?? input.product;
  const items: StockItem[] = [];
  for (const size of input.sizes) {
    const clash = existing.find(
      (e) => e.product === product && same(e.color, input.color) && same(e.size, size),
    );
    if (clash) {
      return {
        error: `${label(product, clash.color, clash.size)} já existe${clash.archived ? " (arquivado)" : ""}.`,
      };
    }
    items.push({
      variant_id: `painel-${slug(product)}-${slug(input.color)}-${slug(size)}`,
      product,
      color: input.color,
      size,
      archived: false,
    });
  }
  return { items };
}
