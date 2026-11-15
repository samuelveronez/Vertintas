import { lineKey, type CartLine } from "@/features/cart/cart";
import { findVariant } from "@/features/catalog";
import type { QuoteProduct } from "../../../supabase/functions/_shared/melhor-envio";

// Peso (kg) e caixa (cm) de UMA unidade já embalada. Valores estimados: confirmar pesando
// os frascos reais (pergunta em aberto no ADR 0002).
const BOTTLES = {
  "100 ml": { weight: 0.15, width: 6, height: 10, length: 6 },
  "250 ml": { weight: 0.32, width: 7, height: 12, length: 7 },
  "500 ml": { weight: 0.62, width: 9, height: 14, length: 9 },
} as const;

// Kits "N cores" levam N frascos de 100 ml numa caixa única.
function packageOf(size: string) {
  if (size in BOTTLES) return BOTTLES[size as keyof typeof BOTTLES];
  const bottles = Number(/(\d+)/.exec(size)?.[1] ?? 1);
  return {
    weight: BOTTLES["100 ml"].weight * bottles + 0.1,
    width: 12,
    height: 10,
    length: Math.max(12, bottles * 3),
  };
}

export function quoteProducts(lines: CartLine[]): QuoteProduct[] {
  return lines.flatMap((line) => {
    const found = findVariant(line.variantId);
    if (!found) return [];
    const { variant } = found;
    return [
      {
        id: lineKey(line),
        ...packageOf(variant.size),
        insurance_value: variant.priceCents / 100,
        quantity: line.qty,
      },
    ];
  });
}
