"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import { confirmPayment, finishPack, finishTask } from "./actions";
import { bigButton } from "./order-ui";
import { usePanel } from "./panel-context";
import { orderTotalCents, type Task } from "./production";
import type { Order } from "./types";

type Step = "pay" | "make" | "pack";

const stepButton = (on: boolean) =>
  `flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition-colors ${on ? "bg-forest text-white shadow-card" : "bg-white text-ink ring-1 ring-line"}`;

const bigAction = `${bigButton} min-h-20 text-2xl`;
const mainCard = "space-y-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-line";
const title = "font-display text-3xl font-bold leading-tight";

function Now({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-gold px-3 py-1 text-sm font-bold uppercase tracking-wide text-ink">
      {children}
    </span>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl bg-[#eef3ee] px-5 py-4 font-display text-5xl font-bold text-forest">
      {children}
    </p>
  );
}

function Done({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-3xl bg-white p-10 text-center shadow-card ring-1 ring-line">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-whatsapp text-3xl text-white">
        ✔
      </span>
      <p className="text-2xl font-bold text-forest">{children}</p>
    </div>
  );
}

function Later({ children }: { children: React.ReactNode }) {
  return <p className="font-bold text-ink-soft">Depois: {children}</p>;
}

/** Uma tarefa por vez, sem canal nem estoque: confirmar pagamento, fabricar e embalar. */
export function SimpleView({
  tasks,
  toPack,
  toConfirm,
}: {
  tasks: Task[];
  toPack: Order[];
  toConfirm: Order[];
}) {
  const { run } = usePanel();
  const [chosen, setChosen] = useState<Step>();
  // Sem escolha do usuário, mostra a primeira etapa que tem trabalho: pagar libera fabricar.
  const step: Step =
    chosen ??
    (toConfirm.length ? "pay" : tasks.length ? "make" : toPack.length ? "pack" : "make");
  const [task, ...laterTasks] = tasks;
  const [order, ...laterOrders] = toPack;
  const [payment, ...laterPayments] = toConfirm;

  const steps: [Step, number, string][] = [
    ["pay", toConfirm.length, "confirmar pagamento"],
    ["make", tasks.length, "para fabricar"],
    ["pack", toPack.length, "para embalar"],
  ];

  return (
    <div className="mx-auto max-w-xl space-y-5 text-xl">
      <div className="grid grid-cols-3 gap-2">
        {steps.map(([id, n, label]) => (
          <button
            key={id}
            className={stepButton(step === id)}
            aria-pressed={step === id}
            onClick={() => setChosen(id)}
          >
            <b className="font-display text-4xl leading-none">{n}</b>
            <span className="text-sm font-bold leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {step === "pay" &&
        (payment ? (
          <>
            <section className={mainCard}>
              <Now>Agora</Now>
              <h2 className={title}>Pedido de {payment.customer_name}</h2>
              <Highlight>{formatBRL(orderTotalCents(payment))}</Highlight>
              <p className="text-xl text-ink-soft">Conferir o Pix no banco.</p>
              <button className={bigAction} onClick={() => confirmPayment(run, payment)}>
                ✔ Recebi o pagamento
              </button>
            </section>
            {laterPayments.length > 0 && (
              <Later>{laterPayments.map((o) => o.customer_name).join(", ")}</Later>
            )}
          </>
        ) : (
          <Done>Nenhum pagamento para confirmar.</Done>
        ))}

      {step === "make" &&
        (task ? (
          <>
            <section className={mainCard}>
              <Now>Agora</Now>
              <h2 className={title}>{task.name}</h2>
              {task.toMake > 0 && <Highlight>Fabricar {task.toMake}</Highlight>}
              {task.qty > task.toMake && (
                <p className="text-2xl font-bold text-ink-soft">
                  Pegar {task.qty - task.toMake} do estoque
                </p>
              )}
              <button className={bigAction} onClick={() => finishTask(run, task)}>
                ✔ Pronto
              </button>
            </section>
            {laterTasks.length > 0 && (
              <section>
                <h3 className="mb-2 font-bold text-ink-soft">Depois:</h3>
                <ul className="space-y-1.5">
                  {laterTasks.map((t) => (
                    <li
                      key={t.key}
                      className="rounded-xl bg-white px-4 py-3 ring-1 ring-line"
                    >
                      <b>{t.qty}×</b> {t.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <Done>Nada para fabricar.</Done>
        ))}

      {step === "pack" &&
        (order ? (
          <>
            <section className={mainCard}>
              <Now>Agora</Now>
              <h2 className={title}>Pedido de {order.customer_name}</h2>
              <ul className="space-y-2 rounded-2xl bg-[#eef3ee] p-5 text-2xl">
                {order.order_items.map((i) => (
                  <li key={i.id}>
                    <b>{i.qty}×</b> {i.name}
                  </li>
                ))}
              </ul>
              <button className={bigAction} onClick={() => finishPack(run, order)}>
                📦 Embalei
              </button>
            </section>
            {laterOrders.length > 0 && (
              <Later>{laterOrders.map((o) => o.customer_name).join(", ")}</Later>
            )}
          </>
        ) : (
          <Done>Nada para embalar.</Done>
        ))}
    </div>
  );
}
