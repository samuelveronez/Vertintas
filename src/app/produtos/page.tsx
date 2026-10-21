import type { Metadata } from "next";
import { products } from "@/features/catalog";
import { ProductCard } from "@/features/catalog/product-card";

export const metadata: Metadata = { title: "Produtos" };

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-forest">Produtos</h1>
      <p className="mt-2 text-ink-soft">
        Escolha a linha, a cor e o tamanho. O pedido fecha com Pix.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
