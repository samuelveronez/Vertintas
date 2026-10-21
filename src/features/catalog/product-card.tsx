import Link from "next/link";
import { asset, formatBRL } from "@/lib/format";
import { cheapest, colorsOf, type Product } from ".";

export function ProductCard({ product }: { product: Product }) {
  const colors = colorsOf(product).length;
  return (
    <Link
      href={`/produtos/${product.slug}/`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-transform hover:-translate-y-1"
    >
      <div className="photo-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(product.cover ?? product.variants[0].images[0])}
          alt={`Frasco de ${product.name}`}
          className="aspect-square w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="font-display text-xl font-bold text-forest">{product.name}</h3>
        <p className="text-sm text-ink-soft">{product.tagline}</p>
        <p className="mt-auto pt-3 font-display text-lg font-bold">
          <span className="text-sm font-normal">a partir de </span>
          {formatBRL(cheapest(product))}
        </p>
        {colors > 1 && <p className="text-xs text-ink-soft">{colors} cores</p>}
      </div>
    </Link>
  );
}
