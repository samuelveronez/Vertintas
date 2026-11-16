"use client";

import { products } from "@/features/catalog";
import { adjustStock } from "./api";
import { usePanel } from "./panel-context";

const rows = products.flatMap((p) =>
  p.variants.map((v) => ({
    id: v.id,
    group: p.name,
    label: [v.color, v.size].filter(Boolean).join(" · "),
  })),
);

export function StockView() {
  const { stock, run, loading } = usePanel();
  const change = (id: string, delta: number) =>
    run(() => adjustStock(id, delta), "Estoque atualizado.");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-forest">Estoque</h1>
      <p className="mb-4 text-ink-soft">
        Frascos prontos. Ao fabricar ou separar um pedido o estoque baixa sozinho; aqui
        você corrige ou soma o que acabou de produzir.
      </p>
      {loading ? (
        <p>Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-0"
            >
              <span>
                {(i === 0 || rows[i - 1].group !== r.group) && (
                  <span className="block text-xs font-bold uppercase text-ink-soft">
                    {r.group}
                  </span>
                )}
                {r.label}
              </span>
              <span className="flex items-center gap-2">
                <button
                  aria-label={`Menos um ${r.label}`}
                  className="size-9 rounded-full border-2 border-forest text-lg font-bold text-forest"
                  onClick={() => change(r.id, -1)}
                >
                  −
                </button>
                <b className="min-w-[2.5ch] text-center text-lg">{stock[r.id] ?? 0}</b>
                <button
                  aria-label={`Mais um ${r.label}`}
                  className="size-9 rounded-full border-2 border-forest text-lg font-bold text-forest"
                  onClick={() => change(r.id, 1)}
                >
                  +
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
