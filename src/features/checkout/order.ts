import { z } from "zod";
import type { CartLine } from "@/features/cart/cart";
import { findVariant } from "@/features/catalog";
import { formatDeadline, type QuotedShipping } from "@/features/shipping/shipping";
import { formatBRL } from "@/lib/format";

const text = z.string().trim().default("");

export const customerSchema = z
  .object({
    name: z.string().trim().min(3, "Informe seu nome completo"),
    phone: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{10,11}$/, "Informe o WhatsApp com DDD")),
    delivery: z.enum(["entrega", "retirada"]),
    cep: z
      .string()
      .default("")
      .transform((v) => v.replace(/\D/g, "")),
    street: text,
    number: text,
    complement: text,
    district: text,
    city: text,
    state: text,
    note: z.string().trim(),
  })
  .superRefine((c, ctx) => {
    if (c.delivery === "retirada") return;
    const required: [keyof typeof c, boolean, string][] = [
      ["cep", /^\d{8}$/.test(c.cep), "Informe o CEP com 8 dígitos"],
      ["street", c.street.length >= 3, "Informe a rua"],
      ["number", c.number.length >= 1, "Informe o número ou S/N"],
      ["district", c.district.length >= 2, "Informe o bairro"],
      ["city", c.city.length >= 2, "Informe a cidade"],
      ["state", /^[A-Za-z]{2}$/.test(c.state), "Informe a UF"],
    ];
    for (const [path, ok, message] of required)
      if (!ok) ctx.addIssue({ code: "custom", path: [path], message });
  });

export type Customer = z.infer<typeof customerSchema>;

export function formatAddress(c: Customer): string {
  const line = [c.street, c.number].filter(Boolean).join(", ");
  const place = [c.district, `${c.city}/${c.state.toUpperCase()}`]
    .filter(Boolean)
    .join(" - ");
  return [[line, c.complement].filter(Boolean).join(" - "), place, `CEP ${c.cep}`].join(
    ", ",
  );
}

/** Identificador curto do pedido; vai no txid do Pix e na mensagem do WhatsApp. */
export const newOrderId = () => `VT${Date.now().toString(36).toUpperCase()}`;

export function buildOrderMessage(
  lines: CartLine[],
  customer: Customer,
  totalCents: number,
  orderId: string,
  paidWithPix: boolean,
  shipping?: QuotedShipping,
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
    `Produtos: ${formatBRL(totalCents)}`,
    ...(shipping
      ? [
          `Frete: ${shipping.option.company} ${shipping.option.name}, ${formatBRL(shipping.option.priceCents)}, ${formatDeadline(shipping.option)} (CEP ${shipping.cep})`,
          `Total: ${formatBRL(totalCents + shipping.option.priceCents)}`,
        ]
      : []),
    paidWithPix ? "Paguei o Pix (comprovante em anexo)." : "Quero combinar o pagamento.",
    "",
    `Nome: ${customer.name}`,
    `WhatsApp: ${customer.phone}`,
    customer.delivery === "retirada"
      ? "Retirada na fábrica"
      : `Entrega: ${formatAddress(customer)}`,
    ...(customer.note ? [`Obs.: ${customer.note}`] : []),
    customer.delivery === "retirada"
      ? "Podemos combinar o horário da retirada?"
      : shipping
        ? "Podem despachar assim que confirmar o pagamento?"
        : "Podem calcular o frete?",
  ].join("\n");
}
