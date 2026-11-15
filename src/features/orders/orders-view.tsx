"use client";

import { useState } from "react";
import { buttonClass } from "@/components/button";
import { ManualOrderDialog } from "./manual-order-dialog";
import { OrderDialog, OrderRow } from "./order-ui";
import { usePanel } from "./panel-context";
import { channelLabel, statusLabel } from "./status";
import type { Channel, Order, Status } from "./types";

function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | "todos";
  options: [T | "todos", string][];
  onChange: (v: T | "todos") => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {options.map(([k, label]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={`min-h-11 rounded-full border px-4 font-bold ${value === k ? "border-forest bg-forest text-white" : "border-line bg-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

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
      <h1 className="font-display text-3xl font-bold text-forest">Todos os pedidos</h1>
      <p className="mb-4 text-ink-soft">Mercado Livre, site e WhatsApp na mesma lista.</p>

      <Chips
        value={channel}
        onChange={setChannel}
        options={[
          ["todos", "Todos os canais"],
          ...(Object.entries(channelLabel) as [Channel, string][]),
        ]}
      />
      <Chips
        value={status}
        onChange={setStatusFilter}
        options={[
          ["todos", "Qualquer situação"],
          ...(Object.entries(statusLabel) as [Status, string][]),
        ]}
      />

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
        className={`${buttonClass("outline")} mt-5 min-h-12`}
        onClick={() => setAdding(true)}
      >
        + Lançar pedido do WhatsApp
      </button>

      {open && <OrderDialog order={open} onClose={() => setOpen(null)} />}
      {adding && <ManualOrderDialog onClose={() => setAdding(false)} />}
    </div>
  );
}
