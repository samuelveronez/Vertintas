"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/button";
import { formatBRL } from "@/lib/format";
import { setStatus } from "./api";
import { usePanel } from "./panel-context";
import { orderTotalCents, unitCount } from "./production";
import { channelClass, channelLabel, flow, statusClass, statusLabel } from "./status";
import type { Channel, Order, Status } from "./types";

export const bigButton = `${buttonClass("whatsapp")} min-h-11 w-full text-base`;

export function ChannelBadge({ channel }: { channel: Channel }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${channelClass[channel]}`}
    >
      {channelLabel[channel]}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

const whenFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
export const formatWhen = (iso: string) => whenFmt.format(new Date(iso));

// Caminho da tela de venda no ML; confirmar com um pedido real.
const mlOrderUrl = (ref: string) =>
  `https://www.mercadolivre.com.br/vendas/${ref}/detalhe`;
const whatsappTo = (phone: string) => `https://wa.me/55${phone.replace(/\D/g, "")}`;

export function OrderRow({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: (o: Order) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(order)}
      className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-card border border-line bg-white p-3 text-left hover:border-forest sm:grid-cols-[auto_1fr_auto]"
    >
      <span className="col-span-2 sm:col-span-1">
        <ChannelBadge channel={order.channel} />
      </span>
      <span>
        <span className="font-bold">{order.customer_name}</span>
        <br />
        <span className="text-sm text-ink-soft">
          {order.external_ref} · {formatWhen(order.ordered_at)} · {unitCount(order)}{" "}
          frasco(s)
          {order.destination && ` · ${order.destination}`}
        </span>
      </span>
      <span className="space-y-1 text-right">
        <span className="block font-bold">{formatBRL(orderTotalCents(order))}</span>
        <StatusBadge status={order.status} />
      </span>
    </button>
  );
}

export function Dialog({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[92vh] w-[min(40rem,calc(100vw-1.5rem))] rounded-2xl p-0 backdrop:bg-black/40"
    >
      <div className="space-y-4 p-5 text-lg">{children}</div>
    </dialog>
  );
}

export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Fechar"
      onClick={onClose}
      className="size-11 shrink-0 rounded-full bg-surface text-xl"
    >
      ✕
    </button>
  );
}

export function OrderDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { run, mode } = usePanel();
  const [tracking, setTracking] = useState(order.tracking ?? "");
  const isMl = order.channel === "ml";
  const complete = mode === "completo";
  const step = flow.indexOf(order.status);

  const act = (status: Status, success: string, patch = {}) => {
    const previous = order.status;
    onClose();
    return run(
      () => setStatus(order.id, status, patch),
      success,
      () =>
        setStatus(order.id, previous, {
          paid_at: order.paid_at,
          tracking: order.tracking,
        }),
    );
  };

  return (
    <Dialog onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{order.customer_name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <ChannelBadge channel={order.channel} />
            <StatusBadge status={order.status} />
            <span>
              {order.external_ref} · {formatWhen(order.ordered_at)}
            </span>
          </div>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      {step >= 0 ? (
        <ol className="flex flex-wrap gap-1 text-center text-xs font-bold">
          {flow.map((s, n) => (
            <li
              key={s}
              className={`min-w-20 flex-1 rounded-lg p-1.5 ${
                n < step
                  ? "bg-[#ddf3e4] text-[#14532d]"
                  : n === step
                    ? "bg-forest text-white"
                    : "bg-surface text-ink-soft"
              }`}
            >
              {statusLabel[s]}
            </li>
          ))}
        </ol>
      ) : order.status === "pending_payment" ? (
        <p className="rounded-xl border border-[#f0dc8a] bg-[#fff8db] p-3 text-base">
          {isMl
            ? "Aguardando pagamento. O Mercado Livre libera sozinho."
            : "Aguardando pagamento: confira o Pix no banco e confirme abaixo. Só entra na fabricação depois de pago."}
        </p>
      ) : null}

      <table className="w-full text-base">
        <thead>
          <tr className="text-left text-ink-soft">
            <th className="py-1">Item</th>
            <th>Qtd</th>
            <th className="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((i) => (
            <tr key={i.id} className="border-t border-line">
              <td className="py-2">{i.name}</td>
              <td>{i.qty}</td>
              <td className="text-right">{formatBRL(i.unit_price_cents * i.qty)}</td>
            </tr>
          ))}
          <tr className="border-t border-line font-bold">
            <td colSpan={2} className="py-2">
              Total
            </td>
            <td className="text-right">{formatBRL(orderTotalCents(order))}</td>
          </tr>
        </tbody>
      </table>

      <div className="rounded-card border border-line p-3 text-base">
        <p>
          <b>Entrega:</b> {order.shipping || "—"}
        </p>
        <p>
          <b>Destino:</b> {order.destination || "—"}
        </p>
        {order.customer_phone && (
          <p>
            <b>WhatsApp:</b> {order.customer_phone}
          </p>
        )}
        {order.tracking && (
          <p>
            <b>Rastreio:</b> {order.tracking}
          </p>
        )}
        {order.note && (
          <p>
            <b>Obs.:</b> {order.note}
          </p>
        )}
        {isMl && (
          <p className="text-ink-soft">
            Endereço completo e etiqueta ficam no Mercado Livre.
          </p>
        )}
      </div>

      {complete && (
        <div className="space-y-3">
          <label className="block text-base font-bold">
            Ajustar status
            <select
              value={order.status}
              onChange={(e) => {
                const next = e.target.value as Status;
                void act(next, `Status alterado para "${statusLabel[next]}".`, {
                  paid_at:
                    next === "pending_payment"
                      ? null
                      : (order.paid_at ?? new Date().toISOString()),
                });
              }}
              className="mt-1 w-full rounded-xl border-2 border-line bg-white p-3 text-lg font-normal"
            >
              {(Object.keys(statusLabel) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </label>
          {order.status === "pending_payment" && !isMl && (
            <button
              className={bigButton}
              onClick={() =>
                act("to_make", "Pagamento confirmado. Liberado para fabricar.", {
                  paid_at: new Date().toISOString(),
                })
              }
            >
              ✔ Confirmar pagamento recebido
            </button>
          )}
          {order.status === "ready_to_ship" && (
            <>
              {!isMl && (
                <label className="block text-base font-bold">
                  Código de rastreio (opcional)
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-line p-3 text-lg font-normal"
                  />
                </label>
              )}
              <button
                className={bigButton}
                onClick={() =>
                  act("shipped", "Pedido marcado como enviado.", {
                    tracking: tracking.trim() || null,
                  })
                }
              >
                🚚 Marcar como enviado
              </button>
            </>
          )}
          {order.status === "shipped" && !isMl && (
            <button
              className={bigButton}
              onClick={() => act("delivered", "Pedido marcado como entregue.")}
            >
              ✔ Marcar como entregue
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            {isMl ? (
              <a
                className={`${buttonClass("outline")} min-h-11 text-base`}
                href={mlOrderUrl(order.external_ref)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir no Mercado Livre
              </a>
            ) : (
              order.customer_phone && (
                <a
                  className={`${buttonClass("outline")} min-h-11 text-base`}
                  href={whatsappTo(order.customer_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 Falar no WhatsApp
                </a>
              )
            )}
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button
                className="min-h-11 rounded-full px-4 text-base font-bold text-promo underline"
                onClick={() => {
                  if (window.confirm("Cancelar este pedido?"))
                    void act("cancelled", "Pedido cancelado.");
                }}
              >
                Cancelar pedido
              </button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
