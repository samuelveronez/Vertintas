"use client";

import { formatBRL } from "@/lib/format";
import {
  confirmPayment,
  finishDelivery,
  finishPack,
  finishShip,
  finishTask,
} from "./actions";
import { bigButton } from "./order-ui";
import { usePanel } from "./panel-context";
import { orderTotalCents, type Task } from "./production";
import type { Order } from "./types";

const card = "space-y-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-line";
const action = `${bigButton} min-h-12 text-lg`;

function Column({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl bg-[#eef3ee] p-3 md:min-w-56 md:flex-1">
      <h2 className="flex items-center justify-between px-1 font-display text-xl font-bold text-forest">
        {title}
        <span className="grid min-w-9 place-items-center rounded-full bg-forest px-2 py-0.5 text-base text-white">
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
  const { run } = usePanel();

  return (
    <div className="flex flex-col gap-4 text-base md:flex-row md:items-start md:overflow-x-auto md:pb-2">
      <Column title="Pagamento" count={toConfirm.length} empty="Nada para confirmar.">
        {toConfirm.map((o) => (
          <article key={o.id} className={card}>
            <h3 className="font-bold leading-tight">{o.customer_name}</h3>
            <p className="font-display text-2xl font-bold text-forest">
              {formatBRL(orderTotalCents(o))}
            </p>
            <button className={action} onClick={() => confirmPayment(run, o)}>
              ✔ Recebi
            </button>
          </article>
        ))}
      </Column>

      <Column title="Fabricar" count={tasks.length} empty="Nada para fabricar.">
        {tasks.map((t) => (
          <article key={t.key} className={card}>
            <h3 className="font-bold leading-tight">{t.name}</h3>
            {t.toMake > 0 && (
              <p className="font-display text-2xl font-bold text-forest">
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

      <Column title="Embalar" count={toPack.length} empty="Nada para embalar.">
        {toPack.map((o) => (
          <article key={o.id} className={card}>
            <h3 className="font-bold leading-tight">{o.customer_name}</h3>
            <ul className="space-y-1 rounded-xl bg-[#eef3ee] p-3">
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

      <Column title="Enviar" count={toShip.length} empty="Nada para enviar.">
        {toShip.map((o) => (
          <article key={o.id} className={card}>
            <h3 className="font-bold leading-tight">{o.customer_name}</h3>
            {o.destination && <p className="text-ink-soft">{o.destination}</p>}
            <button className={action} onClick={() => finishShip(run, o)}>
              🚚 Enviei
            </button>
          </article>
        ))}
      </Column>

      <Column title="Enviado" count={shipped.length} empty="Nada a caminho.">
        {shipped.map((o) => (
          <article key={o.id} className={card}>
            <h3 className="font-bold leading-tight">{o.customer_name}</h3>
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
    </div>
  );
}
