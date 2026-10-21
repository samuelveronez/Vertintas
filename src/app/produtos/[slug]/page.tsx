import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/features/catalog";
import { ProductPicker } from "@/features/catalog/product-picker";

type Params = { slug: string };

export const dynamicParams = false;

export const generateStaticParams = () => products.map((p) => ({ slug: p.slug }));

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product?.name, description: product?.description };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ProductPicker product={product} />
    </div>
  );
}
