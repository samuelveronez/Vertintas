"use client";

import Link from "next/link";
import { itemCount } from "@/features/cart/cart";
import { useCart } from "@/features/cart/store";

export function CartLink() {
  const count = itemCount(useCart());
  return (
    <Link
      href="/carrinho/"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-forest px-4 hover:bg-forest hover:text-white"
    >
      Carrinho
      <span
        aria-label={`${count} itens`}
        className="rounded-full bg-gold px-2 text-xs text-ink"
      >
        {count}
      </span>
    </Link>
  );
}
