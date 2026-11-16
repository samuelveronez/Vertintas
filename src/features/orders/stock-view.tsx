"use client";

import { useMemo, useState } from "react";
import { buttonClass } from "@/components/button";
import { products } from "@/features/catalog";
import { adjustStock, saveStockItems } from "./api";
import { NewStockDialog } from "./new-stock-dialog";
import { usePanel } from "./panel-context";
import {
  buildArchived,
  buildGroups,
  mergeItems,
  type StockGroup,
  type StockRow,
} from "./stock-model";
import type { StockItem } from "./types";

type Filter = "all" | "out" | "low";
const LOW = 2;

const filters: [Filter, string][] = [
  ["all", "Todos"],
  ["out", "Em falta"],
  ["low", "Baixo"],
];

const matches = (qty: number, f: Filter) =>
  f === "all" || (f === "out" ? qty === 0 : qty > 0 && qty <= LOW);

export function StockView() {
  const { stock, stockItems, run, loading } = usePanel();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<{ product?: string } | null>(null);

  const items = useMemo(() => mergeItems(products, stockItems), [stockItems]);
  const groups = useMemo(() => buildGroups(items), [items]);
  const archived = useMemo(() => buildArchived(items), [items]);
  const qty = (id: string) => stock[id] ?? 0;

  const allIds = groups.flatMap((g) => g.rows.flatMap((r) => Object.values(r.ids)));
  const out = allIds.filter((id) => qty(id) === 0).length;
  const low = allIds.filter((id) => qty(id) > 0 && qty(id) <= LOW).length;
  const total = allIds.reduce((sum, id) => sum + qty(id), 0);

  const change = (id: string, delta: number) =>
    run(() => adjustStock(id, delta), "Estoque atualizado.");

  const setArchived = (target: StockItem[], value: boolean, success: string) =>
    run(
      () => saveStockItems(target.map((i) => ({ ...i, archived: value }))),
      success,
      () => saveStockItems(target.map((i) => ({ ...i, archived: !value }))),
    );

  const itemsOf = (ids: string[]) => items.filter((i) => ids.includes(i.variant_id));
  const idsOfRow = (r: StockRow) => Object.values(r.ids);

  const q = query.trim().toLowerCase();
  const visible = groups
    .map((g) => ({
      group: g,
      rows: g.rows.filter(
        (r) =>
          (!q || `${g.product} ${r.color}`.toLowerCase().includes(q)) &&
          (filter === "all" || idsOfRow(r).some((id) => matches(qty(id), filter))),
      ),
    }))
    .filter((v) => v.rows.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">Estoque</h1>
          <p className="text-ink-soft">
            Frascos prontos. Ao fabricar ou separar um pedido o estoque baixa sozinho;
            aqui você corrige ou soma o que acabou de produzir.
          </p>
        </div>
        <button
          className={`${buttonClass("whatsapp")} min-h-11 text-base`}
          onClick={() => setDialog({})}
        >
          + Novo produto
        </button>
      </div>

      {loading ? (
        <p>Carregando…</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Frascos prontos" value={total} />
            <Stat label="Em falta" value={out} tone={out > 0 ? "alert" : undefined} />
            <Stat label={`Baixo (1–${LOW})`} value={low} />
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              aria-label="Buscar produto ou cor"
              placeholder="Buscar produto ou cor"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-11 min-w-48 flex-1 rounded-xl border-2 border-line p-2.5 text-base"
            />
            {filters.map(([key, name]) => (
              <button
                key={key}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`min-h-11 rounded-full border-2 px-4 font-bold ${
                  filter === key
                    ? "border-forest bg-forest text-white"
                    : "border-line bg-white"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="rounded-card border border-line bg-white p-4 text-ink-soft">
              Nenhum item encontrado.
            </p>
          )}

          {visible.map(({ group, rows }) => {
            // Com busca ou filtro ativo a lista já está enxuta, então abre sozinha.
            const expanded = open[group.product] ?? (q !== "" || filter !== "all");
            const count = rows.flatMap(idsOfRow);
            return (
              <section
                key={group.product}
                className="overflow-hidden rounded-card border border-line bg-white"
              >
                <button
                  aria-expanded={expanded}
                  onClick={() => setOpen((o) => ({ ...o, [group.product]: !expanded }))}
                  className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left"
                >
                  <span aria-hidden>{expanded ? "▾" : "▸"}</span>
                  <b className="flex-1">{group.product}</b>
                  {count.some((id) => qty(id) === 0) && (
                    <span className="text-sm font-bold text-promo">
                      {count.filter((id) => qty(id) === 0).length} em falta
                    </span>
                  )}
                  <span className="text-sm text-ink-soft">
                    {rows.length} {rows.length === 1 ? "cor" : "cores"} ·{" "}
                    {count.reduce((s, id) => s + qty(id), 0)} frascos
                  </span>
                </button>
                {expanded && (
                  <Grid
                    group={group}
                    rows={rows}
                    qty={qty}
                    onChange={change}
                    onArchiveRow={(r) =>
                      setArchived(
                        itemsOf(idsOfRow(r)),
                        true,
                        `${group.product} ${r.color}`.trim() + " arquivado.",
                      )
                    }
                    onArchiveProduct={() => {
                      if (window.confirm(`Arquivar "${group.product}" inteiro?`))
                        void setArchived(
                          itemsOf(group.rows.flatMap(idsOfRow)),
                          true,
                          `${group.product} arquivado.`,
                        );
                    }}
                    onAdd={() => setDialog({ product: group.product })}
                  />
                )}
              </section>
            );
          })}

          {archived.length > 0 && (
            <details className="rounded-card border border-line bg-white">
              <summary className="min-h-12 cursor-pointer px-4 py-3 font-bold">
                Arquivados ({archived.length})
              </summary>
              <ul className="border-t border-line">
                {archived.map((a) => (
                  <li
                    key={a.key}
                    className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-0"
                  >
                    <span className="text-ink-soft">{a.label}</span>
                    <button
                      className={`${buttonClass("outline")} min-h-11 text-base`}
                      onClick={() => setArchived(a.items, false, `${a.label} restaurado.`)}
                    >
                      Restaurar
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {dialog && (
        <NewStockDialog
          items={items}
          product={dialog.product}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "alert";
}) {
  return (
    <div className="rounded-card bg-surface p-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className={`text-2xl font-bold ${tone === "alert" ? "text-promo" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function Grid({
  group,
  rows,
  qty,
  onChange,
  onArchiveRow,
  onArchiveProduct,
  onAdd,
}: {
  group: StockGroup;
  rows: StockRow[];
  qty: (id: string) => number;
  onChange: (id: string, delta: number) => void;
  onArchiveRow: (r: StockRow) => void;
  onArchiveProduct: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="border-t border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-base">
          <thead>
            <tr className="bg-surface text-sm text-ink-soft">
              <th className="px-4 py-2 text-left font-normal">Cor</th>
              {group.sizes.map((s) => (
                <th key={s} className="px-2 py-2 font-normal">
                  {s || "Único"}
                </th>
              ))}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.color} className="border-t border-line">
                <th className="px-4 py-1 text-left font-normal">{r.color || "Única"}</th>
                {group.sizes.map((s) => {
                  const id = r.ids[s];
                  if (!id)
                    return (
                      <td key={s} className="px-2 text-center text-ink-soft">
                        —
                      </td>
                    );
                  const n = qty(id);
                  const label = [group.product, r.color, s].filter(Boolean).join(" ");
                  return (
                    <td key={s} className={`px-2 py-1 ${n === 0 ? "bg-[#fdecea]" : ""}`}>
                      <span className="flex items-center justify-center gap-1">
                        <button
                          aria-label={`Menos um ${label}`}
                          className="size-9 rounded-full border-2 border-forest text-lg font-bold text-forest"
                          onClick={() => onChange(id, -1)}
                        >
                          −
                        </button>
                        <b
                          className={`min-w-[2.5ch] text-center text-lg ${n <= LOW ? "text-promo" : ""}`}
                        >
                          {n}
                        </b>
                        <button
                          aria-label={`Mais um ${label}`}
                          className="size-9 rounded-full border-2 border-forest text-lg font-bold text-forest"
                          onClick={() => onChange(id, 1)}
                        >
                          +
                        </button>
                      </span>
                    </td>
                  );
                })}
                <td className="px-2 text-center">
                  <button
                    aria-label={`Arquivar ${r.color || group.product}`}
                    title="Arquivar"
                    className="size-9 rounded-full text-ink-soft hover:bg-surface"
                    onClick={() => onArchiveRow(r)}
                  >
                    🗄
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-line px-4 py-2">
        <button className={`${buttonClass("outline")} min-h-11 text-base`} onClick={onAdd}>
          + Nova cor ou tamanho
        </button>
        <button
          className="min-h-11 rounded-full px-4 text-base font-bold text-promo underline"
          onClick={onArchiveProduct}
        >
          Arquivar produto
        </button>
      </div>
    </div>
  );
}
