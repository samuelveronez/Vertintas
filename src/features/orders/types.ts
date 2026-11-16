export type Channel = "ml" | "site" | "wa";

export type Status =
  | "pending_payment"
  | "to_make"
  | "to_pack"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  variant_id: string | null;
  name: string;
  qty: number;
  unit_price_cents: number;
  made: boolean;
};

export type Order = {
  id: string;
  channel: Channel;
  external_ref: string;
  customer_name: string;
  customer_phone: string | null;
  destination: string;
  shipping: string;
  status: Status;
  paid_at: string | null;
  tracking: string | null;
  note: string;
  ordered_at: string;
  order_items: OrderItem[];
};

export type StockMap = Record<string, number>;

/** Linha de `stock_items`: produto criado no painel ou item do catálogo arquivado. */
export type StockItem = {
  variant_id: string;
  product: string;
  color: string;
  size: string;
  archived: boolean;
};
