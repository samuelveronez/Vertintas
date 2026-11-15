import type { Channel, Status } from "./types";

export const channelLabel: Record<Channel, string> = {
  ml: "Mercado Livre",
  site: "Site",
  wa: "WhatsApp",
};

export const channelClass: Record<Channel, string> = {
  ml: "bg-[#ffe600] text-ink",
  site: "bg-forest text-white",
  wa: "bg-whatsapp text-white",
};

export const statusLabel: Record<Status, string> = {
  pending_payment: "Aguardando pagamento",
  to_make: "A fabricar",
  to_pack: "A embalar",
  ready_to_ship: "Pronto p/ enviar",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

/** Etapas na ordem em que o pedido avança (pagamento pendente fica fora da linha). */
export const flow: Status[] = [
  "to_make",
  "to_pack",
  "ready_to_ship",
  "shipped",
  "delivered",
];

export const statusClass: Record<Status, string> = {
  pending_payment: "bg-[#fff1c2] text-[#5a4300]",
  to_make: "bg-[#e1ecfb] text-[#123a7a]",
  to_pack: "bg-[#e1ecfb] text-[#123a7a]",
  ready_to_ship: "bg-[#e1ecfb] text-[#123a7a]",
  shipped: "bg-[#e9ece7] text-ink",
  delivered: "bg-[#ddf3e4] text-[#14532d]",
  cancelled: "bg-[#fde2e6] text-[#7a1226]",
};
