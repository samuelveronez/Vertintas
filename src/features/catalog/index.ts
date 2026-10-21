import { products } from "./data";
import type { Product, Variant } from "./types";

export { products };
export type { Product, Variant };

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export function findVariant(
  id: string,
): { product: Product; variant: Variant } | undefined {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === id);
    if (variant) return { product, variant };
  }
}

export const colorsOf = (product: Product) => [
  ...new Set(product.variants.flatMap((v) => (v.color ? [v.color] : []))),
];

export const sizesOf = (product: Product) => [
  ...new Set(product.variants.map((v) => v.size)),
];

export const cheapest = (product: Product) =>
  Math.min(...product.variants.map((v) => v.priceCents));
