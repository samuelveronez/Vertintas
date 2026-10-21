"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { findVariant } from "@/features/catalog";
import { asset, formatBRL } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { lineKey, totalCents } from "./cart";
import { cartActions, useCart } from "./store";

export function CartView() {
  const lines = useCart();

  if (lines.length === 0) {
    return (
      <div className="mt-8 rounded-card border border-line bg-surface p-8 text-center">
        <p>Seu carrinho está vazio.</p>
        <ButtonLink href="/produtos/" className="mt-4">
          Ver produtos
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[1fr_20rem]">
      <ul className="space-y-4">
        {lines.map((line) => {
          const found = findVariant(line.variantId);
          if (!found) return null;
          const { product, variant } = found;
          const key = lineKey(line);
          return (
            <li
              key={key}
              className="flex gap-4 rounded-card border border-line bg-white p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset(variant.images[0])}
                alt=""
                className="photo-bg h-24 w-20 rounded-lg object-contain"
              />
              <div className="flex-1">
                <p className="font-bold text-forest">{product.name}</p>
                <p className="text-sm text-ink-soft">
                  {[variant.color, variant.size].filter(Boolean).join(" · ")}
                </p>
                {line.colors && (
                  <p className="text-sm text-ink-soft">Cores: {line.colors.join(", ")}</p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full border-2 border-line bg-white">
                    <button
                      type="button"
                      aria-label="Diminuir"
                      className="h-10 w-10"
                      onClick={() => cartActions.setQty(key, line.qty - 1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      className="h-10 w-10"
                      onClick={() => cartActions.setQty(key, line.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => cartActions.setQty(key, 0)}
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p className="font-display font-bold">
                {formatBRL(variant.priceCents * line.qty)}
              </p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-card border border-line bg-surface p-6 shadow-card">
        <p className="flex justify-between text-lg">
          <span>Subtotal</span>
          <strong className="font-display">{formatBRL(totalCents(lines))}</strong>
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Frete combinado pelo WhatsApp, conforme seu CEP.
        </p>
        <ButtonLink href="/checkout/" className="mt-5 w-full">
          Pagar com Pix
        </ButtonLink>
        <a
          className="mt-3 flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-forest underline"
          href={whatsappLink("Olá! Quero fazer um pedido pelo site da VerTintas.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon /> Prefiro falar no WhatsApp
        </a>
        <Link href="/produtos/" className="mt-2 block text-center text-sm underline">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
