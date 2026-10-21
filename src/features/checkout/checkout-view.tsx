"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { ButtonLink, buttonClass } from "@/components/button";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { totalCents } from "@/features/cart/cart";
import { cartActions, useCart } from "@/features/cart/store";
import { siteConfig } from "@/lib/config";
import { formatBRL } from "@/lib/format";
import { buildPixPayload } from "@/lib/pix";
import { whatsappLink } from "@/lib/whatsapp";
import { buildOrderMessage, customerSchema, newOrderId, type Customer } from "./order";

const input = "mt-1 min-h-12 w-full rounded-xl border-2 border-line bg-white px-4";

export function CheckoutView() {
  const lines = useCart();
  const [customer, setCustomer] = useState<Customer>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [delivery, setDelivery] = useState<Customer["delivery"]>("entrega");

  if (lines.length === 0 && !customer) {
    return (
      <div className="mt-8 rounded-card border border-line bg-surface p-8 text-center">
        <p>Seu carrinho está vazio.</p>
        <ButtonLink href="/produtos/" className="mt-4">
          Ver produtos
        </ButtonLink>
      </div>
    );
  }

  if (customer)
    return <PixStep customer={customer} onBack={() => setCustomer(undefined)} />;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = customerSchema.safeParse(data);
    if (parsed.success) {
      setErrors({});
      setCustomer(parsed.data);
    } else {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
        ),
      );
    }
  };

  const field = (name: string) =>
    errors[name] && (
      <span id={`${name}-error`} className="text-sm text-promo">
        {errors[name]}
      </span>
    );

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-xl space-y-5">
      <label className="block font-bold">
        Nome completo
        <input
          name="name"
          autoComplete="name"
          className={input}
          aria-describedby="name-error"
        />
        {field("name")}
      </label>
      <label className="block font-bold">
        WhatsApp (com DDD)
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          className={input}
          aria-describedby="phone-error"
        />
        {field("phone")}
      </label>
      <fieldset>
        <legend className="font-bold">Como quer receber?</legend>
        <div className="mt-2 flex gap-3">
          {(["entrega", "retirada"] as const).map((d) => (
            <label
              key={d}
              className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border-2 font-bold ${delivery === d ? "border-forest bg-forest text-white" : "border-line bg-white"}`}
            >
              <input
                type="radio"
                name="delivery"
                value={d}
                checked={delivery === d}
                onChange={() => setDelivery(d)}
                className="sr-only"
              />
              {d === "entrega" ? "Entrega" : "Retirar na fábrica"}
            </label>
          ))}
        </div>
      </fieldset>
      {delivery === "entrega" ? (
        <label className="block font-bold">
          CEP e endereço
          <textarea
            name="address"
            rows={2}
            autoComplete="street-address"
            className={input}
            aria-describedby="address-error"
          />
          {field("address")}
        </label>
      ) : (
        <>
          <input type="hidden" name="address" value="" />
          <p className="text-sm text-ink-soft">
            Endereço e horário da retirada são combinados pelo WhatsApp.
          </p>
        </>
      )}
      <label className="block font-bold">
        Observações <span className="font-normal">(opcional)</span>
        <textarea name="note" rows={2} className={input} />
      </label>
      <button type="submit" className={`${buttonClass()} w-full`}>
        Continuar para o Pix · {formatBRL(totalCents(lines))}
      </button>
      <p className="text-xs text-ink-soft">
        Usamos seus dados só para atender o pedido. Veja a{" "}
        <Link href="/privacidade/" className="underline">
          política de privacidade
        </Link>
        .
      </p>
    </form>
  );
}

function PixStep({ customer, onBack }: { customer: Customer; onBack: () => void }) {
  const lines = useCart();
  const [orderId] = useState(newOrderId);
  const [total] = useState(() => totalCents(lines));
  const [snapshot] = useState(lines);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  const { key, name, city } = siteConfig.pix;
  const payload = key
    ? buildPixPayload({ key, name, city, amountCents: total, txid: orderId })
    : "";

  useEffect(() => {
    if (payload) QRCode.toDataURL(payload, { margin: 1, width: 280 }).then(setQr);
  }, [payload]);

  const copy = async () => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
  };

  const send = (paid: boolean) =>
    whatsappLink(buildOrderMessage(snapshot, customer, total, orderId, paid));

  return (
    <div className="mt-8 max-w-xl space-y-6">
      <p className="text-lg">
        Pedido <strong>{orderId}</strong> · Total dos produtos:{" "}
        <strong className="font-display">{formatBRL(total)}</strong>
      </p>

      {payload ? (
        <section className="rounded-card border border-line bg-surface p-6 text-center shadow-card">
          <h2 className="font-display text-2xl font-bold text-forest">Pague com Pix</h2>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="QR Code Pix"
              width={280}
              height={280}
              className="mx-auto mt-4 rounded-xl bg-white"
            />
          )}
          <p className="mt-4 break-all rounded-xl bg-white p-3 text-left text-xs">
            {payload}
          </p>
          <button
            type="button"
            onClick={copy}
            className={`${buttonClass("outline")} mt-3 w-full`}
          >
            {copied ? "Código copiado!" : "Copiar código Pix"}
          </button>
        </section>
      ) : (
        <p className="rounded-card border border-line bg-surface p-6">
          O Pix automático ainda não está configurado. Envie o pedido pelo WhatsApp que
          passamos os dados de pagamento.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold text-forest">
          {payload ? "Depois de pagar" : "Finalize"}
        </h2>
        <p className="text-sm text-ink-soft">
          {payload
            ? "Envie o pedido e o comprovante pelo WhatsApp. Confirmamos o pagamento, calculamos o frete e combinamos a entrega."
            : "Enviamos o pedido pelo WhatsApp."}
        </p>
        <a
          href={send(Boolean(payload))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => cartActions.clear()}
          className={`${buttonClass("whatsapp")} w-full`}
        >
          <WhatsAppIcon />{" "}
          {payload ? "Enviar pedido e comprovante" : "Enviar pedido pelo WhatsApp"}
        </a>
        <button
          type="button"
          onClick={onBack}
          className="block w-full text-center text-sm underline"
        >
          Voltar e editar dados
        </button>
      </section>
    </div>
  );
}
