import { markMade, setStatus, undoMade, type MadeResult } from "./api";
import type { Run } from "./panel-context";
import type { Task } from "./production";
import type { Order, Status } from "./types";

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

/** Pix conferido no banco: libera o pedido para fabricação. */
export function confirmPayment(run: Run, order: Order) {
  return run(
    () => setStatus(order.id, "to_make", { paid_at: new Date().toISOString() }),
    "Pagamento confirmado. Liberado para fabricar.",
    () => setStatus(order.id, "pending_payment", { paid_at: null }),
  );
}

export function finishShip(run: Run, order: Order) {
  return run(
    () => setStatus(order.id, "shipped"),
    `Pedido de ${order.customer_name} enviado.`,
    () => setStatus(order.id, "ready_to_ship"),
  );
}

export function finishDelivery(run: Run, order: Order) {
  return run(
    () => setStatus(order.id, "delivered"),
    `Pedido de ${order.customer_name} entregue.`,
    () => setStatus(order.id, "shipped"),
  );
}

/** Arrastar no Kanban: muda o status livremente; o pagamento acompanha para a etapa fazer sentido. */
export function moveOrder(run: Run, order: Order, status: Status) {
  const previous = { status: order.status, paid_at: order.paid_at };
  return run(
    () =>
      setStatus(order.id, status, {
        paid_at:
          status === "pending_payment"
            ? null
            : (order.paid_at ?? new Date().toISOString()),
      }),
    `Pedido de ${order.customer_name} movido.`,
    () => setStatus(order.id, previous.status, { paid_at: previous.paid_at }),
  );
}
