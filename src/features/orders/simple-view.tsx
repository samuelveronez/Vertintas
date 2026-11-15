"use client";

import { useState } from "react";
import { finishPack, finishTask } from "./actions";
import { bigButton } from "./order-ui";
import { usePanel } from "./panel-context";
import type { Task } from "./production";
import type { Order } from "./types";

type Step = "make" | "pack";

const stepButton = (on: boolean) =>
  `min-h-24 rounded-2xl border-4 p-4 text-left ${on ? "border-forest bg-[#eef3ee]" : "border-line bg-white"}`;

const bigAction = `${bigButton} min-h-20 text-2xl`;

function Done({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-4 border-line bg-white p-8 text-center text-2xl font-bold text-forest">
      ✔ {children}
    </div>
  );
}

/** Uma tarefa por vez, sem canal, cliente ou valor: só o que fabricar e embalar. */
export function SimpleView({ tasks, toPack }: { tasks: Task[]; toPack: Order[] }) {
  const { run } = usePanel();
  const [chosen, setChosen] = useState<Step>();
  const step: Step = chosen ?? (tasks.length ? "make" : "pack");
  const [task, ...laterTasks] = tasks;
  const [order, ...laterOrders] = toPack;

  return (
    <div className="space-y-5 text-xl">
      <div className="grid grid-cols-2 gap-3">
        <button
          className={stepButton(step === "make")}
          aria-pressed={step === "make"}
          onClick={() => setChosen("make")}
        >
          <b className="block font-display text-4xl leading-none">{tasks.length}</b>
          <span className="font-bold">para fabricar</span>
        </button>
        <button
          className={stepButton(step === "pack")}
          aria-pressed={step === "pack"}
          onClick={() => setChosen("pack")}
        >
          <b className="block font-display text-4xl leading-none">{toPack.length}</b>
          <span className="font-bold">para embalar</span>
        </button>
      </div>

      {step === "make" &&
        (task ? (
          <>
            <section className="space-y-5 rounded-3xl border-4 border-forest bg-white p-6">
              <h2 className="font-display text-3xl font-bold leading-tight">
                {task.name}
              </h2>
              {task.toMake > 0 && (
                <p className="font-display text-5xl font-bold text-forest">
                  Fabricar {task.toMake}
                </p>
              )}
              {task.qty > task.toMake && (
                <p className="text-2xl font-bold">
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
                    <li key={t.key} className="rounded-xl bg-white px-4 py-3">
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
            <section className="space-y-5 rounded-3xl border-4 border-forest bg-white p-6">
              <h2 className="font-display text-3xl font-bold leading-tight">
                Pedido de {order.customer_name}
              </h2>
              <ul className="space-y-2 text-2xl">
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
              <p className="font-bold text-ink-soft">
                Depois: {laterOrders.map((o) => o.customer_name).join(", ")}
              </p>
            )}
          </>
        ) : (
          <Done>Nada para embalar.</Done>
        ))}
    </div>
  );
}
