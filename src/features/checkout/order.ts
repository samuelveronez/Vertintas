import { z } from "zod";
import type { CartLine } from "@/features/cart/cart";
import { findVariant } from "@/features/catalog";
import { formatBRL } from "@/lib/format";

export const customerSchema = z
  .object({
    name: z.string().trim().min(3, "Informe seu nome completo"),
    phone: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{10,11}$/, "Informe o WhatsApp com DDD")),
    delivery: z.enum(["entrega", "retirada"]),
    address: z.string().trim(),
    note: z.string().trim(),
  })
  .refine((c) => c.delivery === "retirada" || c.address.length >= 8, {
    path: ["address"],
    message: "Informe CEP e endereço de entrega",
  });

export type Customer = z.infer<typeof customerSchema>;

/** Identificador curto do pedido; vai no txid do Pix e na mensagem do WhatsApp. */
export const newOrderId = () => `VT${Date.now().toString(36).toUpperCase()}`;

export function buildOrderMessage(
  lines: CartLine[],
  customer: Customer,
  totalCents: number,
  orderId: string,
  paidWithPix: boolean,
): string {
  const items = lines.flatMap((line) => {
    const found = findVariant(line.variantId);
    if (!found) return [];
    const { product, variant } = found;
    const detail = [variant.color, variant.size].filter(Boolean).join(" ");
    const colors = line.colors ? ` (cores: ${line.colors.join(", ")})` : "";
    return [
      `• ${line.qty}x ${product.name} ${detail}${colors} = ${formatBRL(variant.priceCents * line.qty)}`,
    ];
  });
  return [
    `Pedido ${orderId} - site VerTintas`,
    ...items,
    `Subtotal: ${formatBRL(totalCents)}`,
    paidWithPix ? "Paguei o Pix (comprovante em anexo)." : "Quero combinar o pagamento.",
    "",
    `Nome: ${customer.name}`,
    `WhatsApp: ${customer.phone}`,
    customer.delivery === "retirada"
      ? "Retirada na fábrica"
      : `Entrega: ${customer.address}`,
    ...(customer.note ? [`Obs.: ${customer.note}`] : []),
    customer.delivery === "retirada"
      ? "Podemos combinar o horário da retirada?"
      : "Podem calcular o frete?",
  ].join("\n");
}
