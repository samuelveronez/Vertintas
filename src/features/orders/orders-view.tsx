"use client";

import { useState } from "react";
import { buttonClass } from "@/components/button";
import { ManualOrderDialog } from "./manual-order-dialog";
import { OrderDialog, OrderRow } from "./order-ui";
import { usePanel } from "./panel-context";
import { channelLabel, statusLabel } from "./status";
import type { Channel, Order, Status } from "./types";

function Filter<T extends string>({
  label,
  value,
  options,
  counts,
  onChange,
}: {
  label: string;
  value: T | "todos";
  options: [T | "todos", string][];
  counts: Record<string, number>;
  onChange: (v: T | "todos") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="w-[4.5rem] shrink-0 text-xs font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([k, text]) => (
          <button
            key={k}
            type="button"
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-colors ${value === k ? "bg-forest text-white" : "bg-surface text-ink hover:bg-[#e4eae4]"}`}
          >
            {text}
            <span
              className={`text-xs font-normal ${value === k ? "text-white/80" : "text-ink-soft"}`}
            >
              {counts[k] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const countBy = (orders: Order[], key: "channel" | "status") =>
  orders.reduce<Record<string, number>>(
    (n, o) => ({ ...n, [o[key]]: (n[o[key]] ?? 0) + 1 }),
    {},
  );

export function OrdersView() {
  const { orders, loading, error } = usePanel();
  const [channel, setChannel] = useState<Channel | "todos">("todos");
  const [status, setStatusFilter] = useState<Status | "todos">("todos");
  const [open, setOpen] = useState<Order | null>(null);
  const [adding, setAdding] = useState(false);

  const shown = orders.filter(
    (o) =>
      (channel === "todos" || o.channel === channel) &&
      (status === "todos" || o.status === status),
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-forest">Todos os pedidos</h1>
      <p className="mb-3 text-ink-soft">Mercado Livre, site e WhatsApp na mesma lista.</p>

      <div className="mb-3 space-y-2 rounded-card border border-line bg-white p-3">
        <Filter
          label="Canal"
          value={channel}
          onChange={setChannel}
          counts={{ todos: orders.length, ...countBy(orders, "channel") }}
          options={[
            ["todos", "Todos"],
            ...(Object.entries(channelLabel) as [Channel, string][]),
          ]}
        />
        <Filter
          label="Situação"
          value={status}
          onChange={setStatusFilter}
          counts={{ todos: orders.length, ...countBy(orders, "status") }}
          options={[
            ["todos", "Todas"],
            ...(Object.entries(statusLabel) as [Status, string][]),
          ]}
        />
      </div>

      {loading ? (
        <p>Carregando…</p>
      ) : error ? (
        <p role="alert" className="font-bold text-promo">
          {error}
        </p>
      ) : shown.length ? (
        <div className="space-y-2">
          {shown.map((o) => (
            <OrderRow key={o.id} order={o} onOpen={setOpen} />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-line bg-white p-8 text-center text-ink-soft">
          Nenhum pedido com esses filtros.
        </p>
      )}

      <button
        className={`${buttonClass("outline")} mt-4 min-h-10`}
        onClick={() => setAdding(true)}
      >
        + Lançar pedido do WhatsApp
      </button>

      {open && <OrderDialog order={open} onClose={() => setOpen(null)} />}
      {adding && <ManualOrderDialog onClose={() => setAdding(false)} />}
    </div>
  );
}
