import { markMade, setStatus, undoMade, type MadeResult } from "./api";
import type { Run } from "./panel-context";
import type { Task } from "./production";
import type { Order } from "./types";

/** Fabricou ou separou um item em todos os pedidos pagos; Desfazer devolve o estoque. */
export function finishTask(run: Run, task: Task) {
  let result: MadeResult | undefined;
  return run(
    async () => {
      result = await markMade(task.key);
    },
    task.toMake === 0 ? "Separado." : "Feito.",
    async () => {
      if (result) await undoMade(task.key, result);
    },
  );
}

export function finishPack(run: Run, order: Order) {
  return run(
    () => setStatus(order.id, "ready_to_ship"),
    `Pedido de ${order.customer_name} embalado.`,
    () => setStatus(order.id, "to_pack"),
  );
}
