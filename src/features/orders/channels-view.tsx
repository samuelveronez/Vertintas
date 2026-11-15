"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/components/button";
import { fetchMlStatus, mlAction, type MlStatus } from "./api";
import { fetchPickupEnabled, savePickupEnabled } from "@/lib/settings";
import { ChannelBadge, formatWhen } from "./order-ui";
import { usePanel } from "./panel-context";

const card = "space-y-2 rounded-card border border-line bg-white p-4 shadow-card";

function PickupCard() {
  const { run } = usePanel();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetchPickupEnabled().then(setEnabled, () => setEnabled(null));
  }, []);

  const toggle = async () => {
    if (enabled === null) return;
    const next = !enabled;
    await run(
      () => savePickupEnabled(next),
      next ? "Retirada ligada." : "Retirada desligada.",
    );
    setEnabled(await fetchPickupEnabled());
  };

  return (
    <section className={card}>
      <h2 className="font-display text-xl font-bold">Retirada na fábrica</h2>
      <p>
        <b>{enabled === null ? "…" : enabled ? "● Ligada" : "○ Desligada"}</b>
        <br />
        <span className="text-base text-ink-soft">
          {enabled === false
            ? "O site não oferece mais retirar na fábrica: só entrega."
            : "O cliente pode escolher retirar na fábrica ao fechar o pedido no site."}
        </span>
      </p>
      <button
        className={`${buttonClass(enabled ? "outline" : "primary")} min-h-12`}
        disabled={enabled === null}
        onClick={toggle}
      >
        {enabled ? "Desligar retirada" : "Ligar retirada"}
      </button>
    </section>
  );
}

export function ChannelsView() {
  const { orders, notify, refresh } = usePanel();
  const [ml, setMl] = useState<MlStatus | null>(null);

  useEffect(() => {
    fetchMlStatus().then(setMl, () => setMl({ connected: false }));
  }, []);

  async function act(action: "connect" | "sync") {
    try {
      const { url } = await mlAction(action);
      if (url) window.location.assign(url);
      else {
        notify("Pedidos do Mercado Livre atualizados.");
        await refresh();
        setMl(await fetchMlStatus());
      }
    } catch (e) {
      notify(`Não deu certo: ${e instanceof Error ? e.message : "erro"}`);
    }
  }

  const count = (ch: string) => orders.filter((o) => o.channel === ch).length;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">Canais de venda</h1>
      <p className="mb-4 text-ink-soft">De onde os pedidos chegam.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <section className={card}>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <ChannelBadge channel="ml" /> Mercado Livre
          </h2>
          {ml?.connected ? (
            <p>
              <b>● Conectado</b>
              <br />
              <span className="text-base text-ink-soft">
                Última verificação:{" "}
                {ml.last_sync_at ? formatWhen(ml.last_sync_at) : "ainda não"} ·{" "}
                {count("ml")} pedido(s) no painel
              </span>
            </p>
          ) : (
            <p>
              <b>Não conectado.</b> Conecte para os pedidos entrarem sozinhos.
            </p>
          )}
          <ul className="list-disc pl-5 text-base">
            <li>Novos pedidos entram sozinhos na lista.</li>
            <li>Etiquetas e envio continuam no Mercado Livre.</li>
            <li>Por enquanto o painel só lê; não altera anúncios nem estoque lá.</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              className={`${buttonClass(ml?.connected ? "outline" : "primary")} min-h-11 text-base`}
              onClick={() => act("connect")}
            >
              {ml?.connected ? "Reconectar" : "Conectar Mercado Livre"}
            </button>
            {ml?.connected && (
              <button
                className={`${buttonClass("outline")} min-h-11 text-base`}
                onClick={() => act("sync")}
              >
                Atualizar agora
              </button>
            )}
          </div>
        </section>
        <section className={card}>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <ChannelBadge channel="site" /> Site
          </h2>
          <p>
            <b>{count("site")}</b> pedido(s) no painel
          </p>
          <p className="text-base text-ink-soft">
            Pix manual: o pedido chega como “aguardando pagamento” e alguém confere no
            banco e confirma.
          </p>
        </section>
        <section className={card}>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <ChannelBadge channel="wa" /> WhatsApp
          </h2>
          <p>
            <b>{count("wa")}</b> pedido(s) no painel
          </p>
          <p className="text-base text-ink-soft">
            Lançamento manual em Todos os pedidos → “Lançar pedido do WhatsApp”.
          </p>
        </section>
        <PickupCard />
      </div>
    </div>
  );
}
