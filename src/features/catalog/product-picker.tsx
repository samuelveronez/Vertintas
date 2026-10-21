"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/button";
import { cartActions } from "@/features/cart/store";
import { asset, formatBRL } from "@/lib/format";
import { colorsOf, products, sizesOf, type Product } from ".";

const metallicColors = colorsOf(products.find((p) => p.slug === "acrilica-metalica")!);

const chip = (on: boolean) =>
  `min-h-11 rounded-full border-2 px-4 text-sm font-bold ${on ? "border-forest bg-forest text-white" : "border-line bg-white"}`;

export function ProductPicker({ product }: { product: Product }) {
  const colors = colorsOf(product);
  const sizes = sizesOf(product);
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(sizes[0]);
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [shot, setShot] = useState(0);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find(
    (v) => (!color || v.color === color) && v.size === size,
  )!;
  const need = variant.pickColors ?? 0;
  const ready = need === 0 || picked.length === need;
  const image = variant.images[Math.min(shot, variant.images.length - 1)];

  const togglePick = (c: string) =>
    setPicked((prev) =>
      prev.includes(c)
        ? prev.filter((x) => x !== c)
        : prev.length < need
          ? [...prev, c]
          : prev,
    );

  const add = () => {
    cartActions.add({
      variantId: variant.id,
      qty,
      ...(need ? { colors: [...picked].sort() } : {}),
    });
    setAdded(true);
  };

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <div className="photo-bg flex h-96 items-center justify-center rounded-card border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(image)}
            alt={`${product.name}${variant.color ? ` ${variant.color}` : ""}`}
            className="h-full w-auto object-contain"
          />
        </div>
        {variant.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {variant.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setShot(i)}
                aria-label={`Foto ${i + 1}`}
                aria-pressed={i === shot}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-white ${i === shot ? "border-forest" : "border-line"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(src)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <Link href="/produtos/" className="text-sm font-bold text-forest hover:underline">
          ← Todos os produtos
        </Link>
        <h1 className="mt-2 font-display text-4xl font-bold text-forest">
          {product.name}
        </h1>
        <p className="mt-2 text-ink-soft">{product.description}</p>
        {product.uses.length > 0 && (
          <p className="mt-2 text-sm text-ink-soft">
            <strong>Onde usar:</strong> {product.uses.join(", ")}.
          </p>
        )}

        <p className="mt-6 font-display text-3xl font-bold">
          {formatBRL(variant.priceCents)}{" "}
          <span className="text-base font-normal">/ {variant.size}</span>
        </p>

        {sizes.length > 1 && (
          <fieldset className="mt-6">
            <legend className="font-bold">Tamanho</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === size}
                  onClick={() => {
                    setSize(s);
                    setPicked([]);
                    setAdded(false);
                  }}
                  className={chip(s === size)}
                >
                  {s} ·{" "}
                  {formatBRL(product.variants.find((v) => v.size === s)!.priceCents)}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {colors.length > 0 && (
          <fieldset className="mt-6">
            <legend className="font-bold">
              Cor: <span className="font-normal">{color}</span>
            </legend>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={c === color}
                  title={c}
                  onClick={() => {
                    setColor(c);
                    setShot(0);
                    setAdded(false);
                  }}
                  className={`flex flex-col items-center rounded-lg border-2 bg-white p-1 text-[11px] leading-tight ${c === color ? "border-forest" : "border-line"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(product.variants.find((v) => v.color === c)!.images[0])}
                    alt=""
                    className="h-14 w-full object-contain"
                    loading="lazy"
                  />
                  <span className="mt-1 text-center">{c}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {need > 0 && (
          <fieldset className="mt-6">
            <legend className="font-bold">
              Escolha {need} cores{" "}
              <span className="font-normal">
                ({picked.length}/{need})
              </span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {metallicColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={picked.includes(c)}
                  onClick={() => togglePick(c)}
                  className={chip(picked.includes(c))}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-full border-2 border-line bg-white">
            <button
              type="button"
              aria-label="Diminuir"
              className="h-11 w-11 text-xl"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="w-8 text-center font-bold" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Aumentar"
              className="h-11 w-11 text-xl"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
          </div>
          <button type="button" disabled={!ready} onClick={add} className={buttonClass()}>
            Adicionar ao carrinho
          </button>
        </div>
        {!ready && (
          <p className="mt-2 text-sm text-promo">Escolha as {need} cores do kit.</p>
        )}
        {added && (
          <p className="mt-3 font-bold text-whatsapp" role="status">
            Adicionado!{" "}
            <Link href="/carrinho/" className="underline">
              Ver carrinho
            </Link>
          </p>
        )}

        {variant.mlUrl && (
          <p className="mt-10 text-xs text-ink-soft">
            Prefere comprar pelo Mercado Livre?{" "}
            <a
              href={variant.mlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-ink"
            >
              Ver anúncio
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
