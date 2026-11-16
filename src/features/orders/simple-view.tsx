"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import {
  confirmPayment,
  finishDelivery,
  finishPack,
  finishShip,
  finishTask,
  moveOrder,
} from "./actions";
import { OrderDialog, bigButton } from "./order-ui";
import { usePanel } from "./panel-context";
import { orderTotalCents, type Task } from "./production";
import type { Order, Status } from "./types";

const card =
  "cursor-grab space-y-2 rounded-xl bg-white p-3 shadow-card ring-1 ring-line active:cursor-grabbing";
const action = `${bigButton} min-h-10 text-base`;

type Drag = { order: Order } | { task: Task };

function Column({
  title,
  count,
  empty,
  accepts,
  onDrop,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  /** Diz se o cartão arrastado pode ser solto aqui. */
  accepts: boolean;
  onDrop: () => void;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <section
      onDragOver={(e) => {
        if (!accepts) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (accepts) onDrop();
      }}
      className={`space-y-2 rounded-2xl p-2 transition-colors md:min-w-56 md:flex-1 ${over ? "bg-[#d9e6d9] ring-2 ring-forest" : "bg-[#eef3ee]"}`}
    >
      <h2 className="flex items-center justify-between px-1 font-display text-lg font-bold text-forest">
        {title}
        <span className="grid min-w-9 place-items-center rounded-full bg-forest px-2 py-0.5 text-sm text-white">
          {count}
        </span>
      </h2>
      {count === 0 ? (
        <p className="px-1 py-4 text-center text-ink-soft">{empty}</p>
      ) : (
        children
      )}
    </section>
  );
}

/** Kanban sem canal nem estoque: três colunas, cada cartão com um botão que o move adiante. */
export function SimpleView({
  tasks,
  toPack,
  toConfirm,
  toShip,
  shipped,
}: {
  tasks: Task[];
  toPack: Order[];
  toConfirm: Order[];
  toShip: Order[];
  shipped: Order[];
}) {
  const { run, orders } = usePanel();
  const [open, setOpen] = useState<Order | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const openById = (id: string) => setOpen(orders.find((o) => o.id === id) ?? null);

  // Cartão de pedido vai para qualquer coluna, menos Fabricar (os itens já feitos não voltam
  // sozinhos); o de fabricação só avança para Embalar, como o botão "Pronto".
  const accepts = (to: Status) => {
    if (!drag) return false;
    if ("task" in drag) return to === "to_pack";
    const from = drag.order.status;
    return to !== from && (to !== "to_make" || from === "pending_payment");
  };
  const drop = (to: Status) => {
    if (!drag) return;
    if ("task" in drag) void finishTask(run, drag.task);
    else if (to === "to_make") void confirmPayment(run, drag.order);
    else void moveOrder(run, drag.order, to);
    setDrag(null);
  };
  const dragProps = (d: Drag) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", "card");
      e.dataTransfer.effectAllowed = "move";
      setDrag(d);
    },
    onDragEnd: () => setDrag(null),
  });

  const Name = ({ order }: { order: Order }) => (
    <button
      type="button"
      onClick={() => setOpen(order)}
      className="block w-full text-left font-bold leading-tight underline-offset-2 hover:underline"
    >
      {order.customer_name}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 text-sm md:flex-row md:items-start md:overflow-x-auto md:pb-2">
      <Column
        title="Pagamento"
        accepts={accepts("pending_payment")}
        onDrop={() => drop("pending_payment")}
        count={toConfirm.length}
        empty="Nada para confirmar."
      >
        {toConfirm.map((o) => (
          <article key={o.id} className={card} {...dragProps({ order: o })}>
            <Name order={o} />
            <p className="font-display text-xl font-bold text-forest">
              {formatBRL(orderTotalCents(o))}
            </p>
            <button className={action} onClick={() => confirmPayment(run, o)}>
              ✔ Recebi
            </button>
          </article>
        ))}
      </Column>

      <Column
        title="Fabricar"
        accepts={accepts("to_make")}
        onDrop={() => drop("to_make")}
        count={tasks.length}
        empty="Nada para fabricar."
      >
        {tasks.map((t) => (
          <article key={t.key} className={card} {...dragProps({ task: t })}>
            <h3 className="font-bold leading-tight">{t.name}</h3>
            <ul className="flex flex-wrap gap-1 text-sm">
              {t.orders.map((o) => (
                <li key={o.orderId}>
                  <button
                    type="button"
                    onClick={() => openById(o.orderId)}
                    className="rounded-full bg-surface px-2 py-0.5 hover:bg-[#e4eae4]"
                  >
                    {o.customer} · {o.qty}
                  </button>
                </li>
              ))}
            </ul>
            {t.toMake > 0 && (
              <p className="font-display text-xl font-bold text-forest">
                Fabricar {t.toMake}
              </p>
            )}
            {t.qty > t.toMake && (
              <p className="font-bold text-ink-soft">
                Pegar {t.qty - t.toMake} do estoque
              </p>
            )}
            <button className={action} onClick={() => finishTask(run, t)}>
              ✔ Pronto
            </button>
          </article>
        ))}
      </Column>

      <Column
        title="Embalar"
        accepts={accepts("to_pack")}
        onDrop={() => drop("to_pack")}
        count={toPack.length}
        empty="Nada para embalar."
      >
        {toPack.map((o) => (
          <article key={o.id} className={card} {...dragProps({ order: o })}>
            <Name order={o} />
            <ul className="space-y-0.5 rounded-lg bg-[#eef3ee] p-2">
              {o.order_items.map((i) => (
                <li key={i.id}>
                  <b>{i.qty}×</b> {i.name}
                </li>
              ))}
            </ul>
            <button className={action} onClick={() => finishPack(run, o)}>
              📦 Embalei
            </button>
          </article>
        ))}
      </Column>

      <Column
        title="Enviar"
        accepts={accepts("ready_to_ship")}
        onDrop={() => drop("ready_to_ship")}
        count={toShip.length}
        empty="Nada para enviar."
      >
        {toShip.map((o) => (
          <article key={o.id} className={card} {...dragProps({ order: o })}>
            <Name order={o} />
            {o.destination && <p className="text-ink-soft">{o.destination}</p>}
            <button className={action} onClick={() => finishShip(run, o)}>
              🚚 Enviei
            </button>
          </article>
        ))}
      </Column>

      <Column
        title="Enviado"
        accepts={accepts("shipped")}
        onDrop={() => drop("shipped")}
        count={shipped.length}
        empty="Nada a caminho."
      >
        {shipped.map((o) => (
          <article key={o.id} className={card} {...dragProps({ order: o })}>
            <Name order={o} />
            {o.destination && <p className="text-ink-soft">{o.destination}</p>}
            {o.tracking && <p className="text-ink-soft">Rastreio: {o.tracking}</p>}
            {/* Pedido do ML tem entrega acompanhada pelo próprio ML. */}
            {o.channel !== "ml" && (
              <button className={action} onClick={() => finishDelivery(run, o)}>
                ✔ Entregue
              </button>
            )}
          </article>
        ))}
      </Column>
      {open && <OrderDialog order={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
