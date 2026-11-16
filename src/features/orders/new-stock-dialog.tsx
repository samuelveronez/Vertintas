"use client";

import { useState } from "react";
import { saveStockItems } from "./api";
import { CloseButton, Dialog, bigButton } from "./order-ui";
import { usePanel } from "./panel-context";
import { buildNewItems, newItemSchema } from "./stock-model";
import type { StockItem } from "./types";

const field = "mt-1 w-full rounded-xl border-2 border-line p-2.5 text-base font-normal";

/** `product` preenchido = adicionar cor/tamanho a um produto que já existe. */
export function NewStockDialog({
  items,
  product,
  onClose,
}: {
  items: StockItem[];
  product?: string;
  onClose: () => void;
}) {
  const { run } = usePanel();
  const [error, setError] = useState("");
  const names = [...new Set(items.map((i) => i.product))];

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = newItemSchema.safeParse({
      product: f.get("product"),
      color: f.get("color"),
      sizes: f.get("sizes"),
    });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    const built = buildNewItems(parsed.data, items);
    if ("error" in built) return setError(built.error);
    onClose();
    void run(() => saveStockItems(built.items), "Adicionado ao estoque.");
  }

  return (
    <Dialog onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-bold">
          {product ? `Nova cor ou tamanho em ${product}` : "Novo produto"}
        </h2>
        <CloseButton onClose={onClose} />
      </div>
      <form onSubmit={submit} className="space-y-3">
        {!product && (
          <label className="block font-bold">
            Produto
            <input name="product" required list="stock-products" className={field} />
            <datalist id="stock-products">
              {names.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
        )}
        {product && <input type="hidden" name="product" value={product} />}
        <label className="block font-bold">
          Cor (deixe vazio se não tiver)
          <input name="color" className={field} />
        </label>
        <label className="block font-bold">
          Tamanhos, separados por vírgula
          <input name="sizes" required placeholder="100 ml, 250 ml" className={field} />
        </label>
        <p className="text-base text-ink-soft">
          Cada tamanho entra com estoque zero. Aparece só no painel; o site continua com o
          catálogo atual.
        </p>
        {error && (
          <p role="alert" className="font-bold text-promo">
            {error}
          </p>
        )}
        <button type="submit" className={bigButton}>
          Adicionar
        </button>
      </form>
    </Dialog>
  );
}
