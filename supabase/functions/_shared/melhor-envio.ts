// Lógica pura da cotação (sem APIs do Deno) para poder ser testada com o Vitest.

export type QuoteProduct = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};

export type ShippingOption = {
  id: number;
  name: string;
  company: string;
  priceCents: number;
  daysMin: number;
  daysMax: number;
};

const isInt = (v: unknown, max: number): v is number =>
  Number.isInteger(v) && (v as number) > 0 && (v as number) <= max;

const isNum = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max;

/** Valida o corpo vindo do navegador; limites evitam usar a função para cotar cargas absurdas. */
export function parseQuoteRequest(
  body: unknown,
): { to: string; products: QuoteProduct[] } | undefined {
  if (typeof body !== "object" || body === null) return;
  const { to, products } = body as Record<string, unknown>;
  if (typeof to !== "string" || !/^\d{8}$/.test(to)) return;
  if (!Array.isArray(products) || products.length === 0 || products.length > 50) return;

  const valid: QuoteProduct[] = [];
  for (const p of products as Record<string, unknown>[]) {
    if (
      typeof p?.id !== "string" ||
      !isInt(p.width, 100) ||
      !isInt(p.height, 100) ||
      !isInt(p.length, 100) ||
      !isNum(p.weight, 30) ||
      !isNum(p.insurance_value, 10_000) ||
      !isInt(p.quantity, 500)
    )
      return;
    valid.push({
      id: p.id,
      width: p.width,
      height: p.height,
      length: p.length,
      weight: p.weight,
      insurance_value: p.insurance_value,
      quantity: p.quantity,
    });
  }
  return { to, products: valid };
}

type RawOption = {
  id?: number;
  name?: string;
  error?: string;
  custom_price?: string | number;
  price?: string | number;
  custom_delivery_time?: number;
  delivery_time?: number;
  custom_delivery_range?: { min: number; max: number };
  delivery_range?: { min: number; max: number };
  company?: { name?: string };
};

/** Descarta serviços indisponíveis para o trecho e ordena do mais barato ao mais caro. */
export function normalizeOptions(raw: unknown): ShippingOption[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawOption[])
    .flatMap((o) => {
      // `custom_*` já embute as tarifas e descontos da conta, conforme a documentação.
      const price = Number(o.custom_price ?? o.price);
      const range = o.custom_delivery_range ?? o.delivery_range;
      const days = o.custom_delivery_time ?? o.delivery_time;
      if (o.error || !o.id || !Number.isFinite(price)) return [];
      return [
        {
          id: o.id,
          name: o.name ?? "Envio",
          company: o.company?.name ?? "",
          priceCents: Math.round(price * 100),
          daysMin: range?.min ?? days ?? 0,
          daysMax: range?.max ?? days ?? 0,
        },
      ];
    })
    .sort((a, b) => a.priceCents - b.priceCents);
}
