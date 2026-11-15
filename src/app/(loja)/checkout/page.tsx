import type { Metadata } from "next";
import { CheckoutView } from "@/features/checkout/checkout-view";

export const metadata: Metadata = { title: "Finalizar pedido" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-forest">Finalizar pedido</h1>
      <CheckoutView />
    </div>
  );
}
