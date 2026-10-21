import { findVariant } from "@/features/catalog";

export type CartLine = { variantId: string; qty: number; colors?: string[] };

// A mesma variante com escolhas de cor diferentes (kits) é uma linha distinta.
export const lineKey = (line: Pick<CartLine, "variantId" | "colors">) =>
  [line.variantId, ...(line.colors ?? [])].join("|");

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const key = lineKey(line);
  const found = lines.some((l) => lineKey(l) === key);
  return found
    ? lines.map((l) => (lineKey(l) === key ? { ...l, qty: l.qty + line.qty } : l))
    : [...lines, line];
}

export function setQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  return lines.flatMap((l) =>
    lineKey(l) !== key ? [l] : qty > 0 ? [{ ...l, qty }] : [],
  );
}

export function totalCents(lines: CartLine[]): number {
  return lines.reduce(
    (sum, l) => sum + (findVariant(l.variantId)?.variant.priceCents ?? 0) * l.qty,
    0,
  );
}

export const itemCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
