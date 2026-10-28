import { z } from "zod";
import { lineKey, type CartLine } from "@/features/cart/cart";
import { shippingApiUrl } from "@/lib/config";
import { quoteProducts } from "./packaging";

const optionSchema = z.object({
  id: z.number(),
  name: z.string(),
  company: z.string(),
  priceCents: z.number(),
  daysMin: z.number(),
  daysMax: z.number(),
});

export type ShippingOption = z.infer<typeof optionSchema>;

/** Frete escolhido; só vale enquanto o carrinho tiver a mesma `signature` da cotação. */
export type ShippingChoice = { cep: string; signature: string; option: ShippingOption };

export const normalizeCep = (v: string) => v.replace(/\D/g, "");
export const isCep = (v: string) => /^\d{8}$/.test(normalizeCep(v));

export const cartSignature = (lines: CartLine[]) =>
  lines.map((l) => `${lineKey(l)}x${l.qty}`).join(",");

export const shippingEnabled = shippingApiUrl !== "";

export async function fetchQuote(
  cep: string,
  lines: CartLine[],
): Promise<ShippingOption[]> {
  const res = await fetch(shippingApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: normalizeCep(cep), products: quoteProducts(lines) }),
  });
  if (!res.ok) throw new Error(`shipping quote ${res.status}`);
  return z.object({ options: z.array(optionSchema) }).parse(await res.json()).options;
}

export function formatDeadline({ daysMin, daysMax }: ShippingOption): string {
  const unit = (n: number) => (n === 1 ? "dia útil" : "dias úteis");
  return daysMin === daysMax
    ? `${daysMax} ${unit(daysMax)}`
    : `${daysMin} a ${daysMax} dias úteis`;
}
