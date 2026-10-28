"use client";

import { useState } from "react";
import type { CartLine } from "@/features/cart/cart";
import { formatBRL } from "@/lib/format";
import {
  cartSignature,
  fetchQuote,
  formatDeadline,
  isCep,
  normalizeCep,
  type ShippingOption,
} from "./shipping";
import { setShippingChoice, useShippingChoice } from "./store";

export function ShippingQuote({ lines }: { lines: CartLine[] }) {
  const signature = cartSignature(lines);
  const saved = useShippingChoice();
  const choice = saved?.signature === signature ? saved : undefined;

  const [cep, setCep] = useState(saved?.cep ?? "");
  const [options, setOptions] = useState<ShippingOption[]>();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const quote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCep(cep)) return setStatus("error");
    setStatus("loading");
    try {
      setOptions(await fetchQuote(cep, lines));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mt-4 border-t border-line pt-4">
      <form onSubmit={quote} className="flex gap-2">
        <label className="flex-1 text-sm font-bold">
          CEP de entrega
          <input
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            className="mt-1 min-h-11 w-full rounded-xl border-2 border-line bg-white px-3 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-6 min-h-11 rounded-full border-2 border-forest px-4 text-sm font-bold text-forest"
        >
          {status === "loading" ? "Calculando…" : "Calcular"}
        </button>
      </form>

      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-promo">
          {isCep(cep)
            ? "Não conseguimos calcular agora. Tente de novo ou fale no WhatsApp."
            : "Informe um CEP com 8 dígitos."}
        </p>
      )}
      {options?.length === 0 && (
        <p className="mt-2 text-sm">Nenhum envio disponível para esse CEP.</p>
      )}

      {options && options.length > 0 && (
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">Opções de envio</legend>
          {options.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-line bg-white p-3 text-sm has-checked:border-forest"
            >
              <input
                type="radio"
                name="shipping"
                checked={choice?.option.id === o.id}
                onChange={() =>
                  setShippingChoice({ cep: normalizeCep(cep), signature, option: o })
                }
              />
              <span className="flex-1">
                <strong>
                  {o.company} {o.name}
                </strong>
                <br />
                {formatDeadline(o)}
              </span>
              <strong className="font-display">{formatBRL(o.priceCents)}</strong>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
