"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import { finishPack, finishTask } from "./actions";
import { ChannelBadge, OrderDialog, OrderRow, bigButton } from "./order-ui";
import { usePanel } from "./panel-context";
import { SimpleView } from "./simple-view";
import { buildTasks, orderTotalCents, type Task } from "./production";
import { channelLabel } from "./status";
import type { Order } from "./types";

const card = "space-y-3 rounded-card border border-line bg-white p-4 shadow-card";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia!" : h < 18 ? "Boa tarde!" : "Boa noite!";
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className={`${card} text-center text-ink-soft`}>{children}</div>;
}

function MakeCard({ task }: { task: Task }) {
  const { run } = usePanel();
  const onlyPick = task.toMake === 0;
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold">{task.name}</h3>
        <span className="shrink-0 text-right font-display text-3xl font-bold leading-none text-forest">
          {task.qty}
          <small className="block text-sm font-normal text-ink-soft">nos pedidos</small>
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5 text-sm">
        {task.orders.map((o) => (
          <li
            key={o.orderId}
            className="rounded-full border border-line bg-surface px-2.5 py-0.5"
          >
            {channelLabel[o.channel]} · {o.customer} · {o.qty}
          </li>
        ))}
      </ul>
      <p>
        <span
          className={`rounded-full px-3 py-1 text-base font-bold ${onlyPick ? "bg-[#ddf3e4] text-[#14532d]" : "bg-[#fff1c2] text-[#5a4300]"}`}
        >
          {onlyPick
            ? `Tem no estoque (${task.inStock}): só separar`
            : `Fabricar ${task.toMake} · estoque ${task.inStock}`}
        </span>
      </p>
      <button className={bigButton} onClick={() => finishTask(run, task)}>
        {onlyPick ? "✔ Separei" : "✔ Fabriquei"}
      </button>
    </div>
  );
}

function PackCard({ order }: { order: Order }) {
  const { run } = usePanel();
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold">{order.customer_name}</h3>
        <ChannelBadge channel={order.channel} />
      </div>
      <ul className="list-disc pl-5">
        {order.order_items.map((i) => (
          <li key={i.id}>
            <b>{i.qty}×</b> {i.name}
          </li>
        ))}
      </ul>
      <p className="text-base text-ink-soft">
        Para: {order.destination || "—"} · {order.shipping || "—"}
      </p>
      <button className={bigButton} onClick={() => finishPack(run, order)}>
        📦 Embalei
      </button>
    </div>
  );
}

export function TodayView() {
  const { orders, stock, mode, loading, error } = usePanel();
  const [tab, setTab] = useState<"make" | "pack">("make");
  const [open, setOpen] = useState<Order | null>(null);

  if (loading) return <p>Carregando…</p>;
  if (error)
    return (
      <p role="alert" className="font-bold text-promo">
        Não foi possível carregar os pedidos: {error}
      </p>
    );

  const tasks = buildTasks(orders, stock);
  const toPack = orders.filter((o) => o.status === "to_pack");
  if (mode !== "completo") return <SimpleView tasks={tasks} toPack={toPack} />;
  const ready = orders.filter((o) => o.status === "ready_to_ship");
  const count = (s: Order["status"]) => orders.filter((o) => o.status === s).length;
  const openValue = orders
    .filter((o) => !["pending_payment", "delivered", "cancelled"].includes(o.status))
    .reduce((n, o) => n + orderTotalCents(o), 0);

  const tabButton = (id: "make" | "pack", n: number, label: string) => (
    <button
      type="button"
      aria-pressed={tab === id}
      onClick={() => setTab(id)}
      className={`min-h-20 rounded-2xl border-2 p-3.5 text-left ${tab === id ? "border-forest bg-[#eef3ee]" : "border-line bg-white"}`}
    >
      <b className="block font-display text-3xl leading-none">{n}</b>
      <span className="font-bold">{label}</span>
    </button>
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">{greeting()}</h1>
      <p className="mb-4 text-ink-soft">
        Resumo do dia, juntando Mercado Livre, site e WhatsApp.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [count("pending_payment"), "aguardando pagamento"],
          [count("to_make"), "pedidos a fabricar"],
          [ready.length, "prontos para enviar"],
          [formatBRL(openValue), "em pedidos abertos"],
        ].map(([n, label]) => (
          <div key={label} className={card}>
            <b className="block font-display text-2xl">{n}</b>
            <span className="text-sm text-ink-soft">{label}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {tabButton(
          "make",
          tasks.reduce((n, t) => n + t.qty, 0),
          "frascos para fabricar ou separar",
        )}
        {tabButton("pack", toPack.length, "pedidos para embalar")}
      </div>

      {tab === "make" ? (
        tasks.length ? (
          <>
            <p className="mb-3 text-ink-soft">
              Pedidos pagos de todos os canais, somados. O que já está no estoque é só
              separar; o resto, fabricar.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {tasks.map((t) => (
                <MakeCard key={t.key} task={t} />
              ))}
            </div>
          </>
        ) : (
          <Empty>
            Tudo pronto por enquanto. Quando chegar pedido novo, ele aparece aqui.
          </Empty>
        )
      ) : toPack.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {toPack.map((o) => (
            <PackCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <Empty>
          Nada para embalar agora. Os pedidos aparecem aqui depois de fabricados.
        </Empty>
      )}

      {ready.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold">
            Prontos para postar ({ready.length})
          </h2>
          <div className="space-y-2">
            {ready.map((o) => (
              <OrderRow key={o.id} order={o} onOpen={setOpen} />
            ))}
          </div>
        </section>
      )}

      {open && <OrderDialog order={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
