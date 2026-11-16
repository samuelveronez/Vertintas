"use client";

import { useState } from "react";
import { buttonClass } from "@/components/button";
import { products } from "@/features/catalog";
import { createManualOrder } from "./api";
import { CloseButton, Dialog, bigButton } from "./order-ui";
import { usePanel } from "./panel-context";

const options = products.flatMap((p) =>
  p.variants.map((v) => ({
    id: v.id,
    priceCents: v.priceCents,
    label: [p.name, v.color, v.size].filter(Boolean).join(" · "),
  })),
);

const field = "mt-1 w-full rounded-xl border-2 border-line p-2.5 text-base font-normal";

type Line = { variantId: string; qty: number };

export function ManualOrderDialog({ onClose }: { onClose: () => void }) {
  const { run } = usePanel();
  const [lines, setLines] = useState<Line[]>([{ variantId: options[0].id, qty: 1 }]);
  const [error, setError] = useState("");

  const patch = (i: number, change: Partial<Line>) =>
    setLines((ls) => ls.map((l, n) => (n === i ? { ...l, ...change } : l)));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    if (name.length < 3) return setError("Informe o nome do cliente.");
    onClose();
    void run(
      () =>
        createManualOrder(
          {
            external_ref: `WA-${Date.now().toString(36).toUpperCase()}`,
            name,
            phone: String(f.get("phone")).trim(),
            destination: String(f.get("destination")).trim(),
            shipping: String(f.get("shipping")).trim(),
            note: String(f.get("note")).trim(),
            items: lines.map((l) => {
              const o = options.find((x) => x.id === l.variantId)!;
              return {
                variant_id: o.id,
                name: o.label,
                qty: l.qty,
                unit_price_cents: o.priceCents,
              };
            }),
          },
          f.get("paid") === "on",
        ),
      "Pedido lançado.",
    );
  }

  return (
    <Dialog onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Novo pedido do WhatsApp</h2>
        <CloseButton onClose={onClose} />
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block font-bold">
          Nome do cliente
          <input name="name" required className={field} />
        </label>
        <label className="block font-bold">
          WhatsApp (com DDD)
          <input name="phone" inputMode="tel" className={field} />
        </label>
        <label className="block font-bold">
          Cidade ou endereço
          <input name="destination" className={field} />
        </label>
        <label className="block font-bold">
          Forma de entrega
          <input name="shipping" placeholder="Correios, retirada…" className={field} />
        </label>

        <fieldset className="space-y-2">
          <legend className="font-bold">Itens</legend>
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <select
                aria-label="Produto"
                value={l.variantId}
                onChange={(e) => patch(i, { variantId: e.target.value })}
                className="min-w-0 flex-1 rounded-xl border-2 border-line p-3 text-base"
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                aria-label="Quantidade"
                type="number"
                min={1}
                max={500}
                value={l.qty}
                onChange={(e) =>
                  patch(i, { qty: Math.max(1, Number(e.target.value) || 1) })
                }
                className="w-20 rounded-xl border-2 border-line p-2.5 text-base"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  aria-label="Remover item"
                  className="size-12 rounded-full bg-surface"
                  onClick={() => setLines((ls) => ls.filter((_, n) => n !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className={`${buttonClass("outline")} min-h-11 text-base`}
            onClick={() =>
              setLines((ls) => [...ls, { variantId: options[0].id, qty: 1 }])
            }
          >
            + Adicionar item
          </button>
        </fieldset>

        <label className="block font-bold">
          Observações
          <input name="note" className={field} />
        </label>
        <label className="flex items-center gap-3 font-bold">
          <input name="paid" type="checkbox" className="size-6" />
          Já recebi o pagamento
        </label>
        {error && (
          <p role="alert" className="font-bold text-promo">
            {error}
          </p>
        )}
        <button type="submit" className={bigButton}>
          Lançar pedido
        </button>
      </form>
    </Dialog>
  );
}
