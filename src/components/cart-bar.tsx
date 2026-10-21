"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { itemCount, totalCents } from "@/features/cart/cart";
import { useCart } from "@/features/cart/store";
import { formatBRL } from "@/lib/format";

/** Atalho fixo para o carrinho no celular; some nas telas de carrinho e checkout. */
export function CartBar() {
  const lines = useCart();
  const pathname = usePathname();
  if (lines.length === 0 || /^\/(carrinho|checkout)/.test(pathname)) return null;

  return (
    <Link
      href="/carrinho/"
      className="fixed inset-x-0 bottom-0 z-30 flex min-h-14 items-center justify-between bg-forest px-4 font-bold text-white md:hidden"
    >
      <span>
        Carrinho · {itemCount(lines)} {itemCount(lines) === 1 ? "item" : "itens"}
      </span>
      <span className="rounded-full bg-gold px-4 py-1 text-ink">
        {formatBRL(totalCents(lines))}
      </span>
    </Link>
  );
}
