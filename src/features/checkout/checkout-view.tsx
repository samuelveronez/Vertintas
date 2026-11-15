"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { ButtonLink, buttonClass } from "@/components/button";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { totalCents } from "@/features/cart/cart";
import { findVariant } from "@/features/catalog";
import { useProfile } from "@/features/customers/profile";
import { placeSiteOrder } from "@/features/orders/api";
import { cartActions, useCart } from "@/features/cart/store";
import { cartSignature, shippingEnabled } from "@/features/shipping/shipping";
import { useShippingChoice } from "@/features/shipping/store";
import { siteConfig } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import {
  fetchOrderTemplate,
  fetchPickupEnabled,
  fetchPixConfig,
  type PixConfig,
} from "@/lib/settings";
import { formatDeadline, type QuotedShipping } from "@/features/shipping/shipping";
import { formatBRL } from "@/lib/format";
import { buildPixPayload } from "@/lib/pix";
import { whatsappLink } from "@/lib/whatsapp";
import { AddressFields } from "./address-fields";
import { Consent } from "./consent";
import {
  customerPayload,
  formatAddress,
  buildOrderMessage,
  customerSchema,
  newOrderId,
  type Customer,
} from "./order";

const input = "mt-1 min-h-12 w-full rounded-xl border-2 border-line bg-white px-4";

export function CheckoutView() {
  const lines = useCart();
  const [customer, setCustomer] = useState<Customer>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chosenDelivery, setDelivery] = useState<Customer["delivery"]>("entrega");
  const [pickupEnabled, setPickupEnabled] = useState(true);
  // Com a retirada desligada no painel, só resta a entrega.
  const delivery = pickupEnabled ? chosenDelivery : "entrega";

  useEffect(() => {
    fetchPickupEnabled().then(setPickupEnabled, () => undefined);
  }, []);
  const { user, profile } = useProfile();
  const saved = useShippingChoice();
  const choice = saved?.signature === cartSignature(lines) ? saved : undefined;
  const quoted = choice?.option ? { ...choice, option: choice.option } : undefined;
  const needsQuote = shippingEnabled && delivery === "entrega" && !choice;

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
    return (
      <PixStep
        customer={customer}
        shipping={customer.delivery === "entrega" ? quoted : undefined}
        onBack={() => setCustomer(undefined)}
      />
    );

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
    <form
      key={profile ? "conta" : "convidado"}
      onSubmit={submit}
      noValidate
      className="mt-8 max-w-xl space-y-5"
    >
      {!user && supabase && (
        <p className="rounded-xl bg-surface p-3 text-sm">
          Já tem conta?{" "}
          <Link href="/conta/" className="font-bold underline">
            Entre para usar seus dados salvos
          </Link>
          . Comprar sem conta também funciona.
        </p>
      )}
      <label className="block font-bold">
        Nome completo
        <input
          name="name"
          defaultValue={profile?.name}
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
          defaultValue={profile?.phone ?? ""}
          autoComplete="tel"
          inputMode="tel"
          className={input}
          aria-describedby="phone-error"
        />
        {field("phone")}
      </label>
      {pickupEnabled ? (
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
      ) : (
        <input type="hidden" name="delivery" value="entrega" />
      )}
      {delivery === "entrega" ? (
        <AddressFields
          quotedCep={choice?.cep}
          errors={errors}
          initial={
            !choice || choice.cep === profile?.cep ? (profile ?? undefined) : undefined
          }
        />
      ) : (
        <p className="text-sm text-ink-soft">
          Endereço e horário da retirada são combinados pelo WhatsApp.
        </p>
      )}
      <label className="block font-bold">
        E-mail <span className="font-normal">(opcional)</span>
        <input
          name="email"
          type="email"
          defaultValue={profile?.email ?? user?.email ?? ""}
          autoComplete="email"
          className={input}
          aria-describedby="email-error"
        />
        {field("email")}
      </label>
      <Consent
        errors={errors}
        defaults={{ whatsapp: profile?.accepts_whatsapp, email: profile?.accepts_email }}
      />
      <label className="block font-bold">
        Observações <span className="font-normal">(opcional)</span>
        <textarea name="note" rows={2} className={input} />
      </label>
      {delivery === "entrega" && quoted && (
        <p className="rounded-xl bg-surface p-3 text-sm">
          Frete:{" "}
          <strong>
            {quoted.option.company} {quoted.option.name}
          </strong>{" "}
          · {formatDeadline(quoted.option)} · {formatBRL(quoted.option.priceCents)} (CEP{" "}
          {quoted.cep}).{" "}
          <Link href="/carrinho/" className="underline">
            Alterar
          </Link>
        </p>
      )}
      {delivery === "entrega" && choice && !choice.option && (
        <p className="rounded-xl bg-surface p-3 text-sm">
          Frete combinado pelo WhatsApp (CEP {choice.cep}).{" "}
          <Link href="/carrinho/" className="underline">
            Calcular de novo
          </Link>
        </p>
      )}
      {needsQuote && (
        <p role="alert" className="rounded-xl bg-surface p-3 text-sm">
          Calcule o frete para o seu CEP no{" "}
          <Link href="/carrinho/" className="font-bold underline">
            carrinho
          </Link>{" "}
          ou escolha retirar na fábrica.
        </p>
      )}
      <button
        type="submit"
        disabled={needsQuote}
        className={`${buttonClass()} w-full disabled:opacity-50`}
      >
        Continuar para o Pix ·{" "}
        {formatBRL(
          totalCents(lines) +
            (delivery === "entrega" ? (quoted?.option.priceCents ?? 0) : 0),
        )}
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

function PixStep({
  customer,
  shipping,
  onBack,
}: {
  customer: Customer;
  shipping?: QuotedShipping;
  onBack: () => void;
}) {
  const lines = useCart();
  const [orderId] = useState(newOrderId);
  const [productsTotal] = useState(() => totalCents(lines));
  const total = productsTotal + (shipping?.option.priceCents ?? 0);
  const [snapshot] = useState(lines);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  // O Pix do painel vale mais que o das variáveis de build; falha na leitura cai no padrão.
  const [pix, setPix] = useState<PixConfig>();
  useEffect(() => {
    fetchPixConfig()
      .catch(() => null)
      .then((config) => setPix(config ?? siteConfig.pix));
  }, []);

  const payload = pix?.key
    ? buildPixPayload({
        key: pix.key,
        name: pix.name || siteConfig.pix.name,
        city: pix.city || siteConfig.pix.city,
        amountCents: total,
        txid: orderId,
      })
    : "";

  useEffect(() => {
    if (payload) QRCode.toDataURL(payload, { margin: 1, width: 280 }).then(setQr);
  }, [payload]);

  const copy = async () => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
  };

  const [template, setTemplate] = useState<string>();
  useEffect(() => {
    fetchOrderTemplate()
      .catch(() => null)
      .then((saved) => setTemplate(saved ?? undefined));
  }, []);

  const send = (paid: boolean) =>
    whatsappLink(
      buildOrderMessage(customer, productsTotal, orderId, paid, shipping, template),
    );

  // Avisa o painel da loja; se falhar, o pedido segue pelo WhatsApp como antes.
  const register = () => {
    const items = snapshot.flatMap((line) => {
      const found = findVariant(line.variantId);
      if (!found) return [];
      const { product, variant } = found;
      return [
        {
          variant_id: variant.id,
          name: [product.name, variant.color, variant.size].filter(Boolean).join(" · "),
          qty: line.qty,
          unit_price_cents: variant.priceCents,
        },
      ];
    });
    placeSiteOrder({
      external_ref: orderId,
      name: customer.name,
      phone: customer.phone,
      destination: customer.delivery === "retirada" ? "" : formatAddress(customer),
      shipping:
        customer.delivery === "retirada"
          ? "Retirada na fábrica"
          : shipping
            ? `${shipping.option.company} ${shipping.option.name} · ${formatBRL(shipping.option.priceCents)} · ${formatDeadline(shipping.option)}`
            : "A combinar (frete)",
      note: customer.note,
      items,
      customer: customerPayload(customer),
    }).catch(() => undefined);
  };

  return (
    <div className="mt-8 max-w-xl space-y-6">
      <p className="text-lg">
        Pedido <strong>{orderId}</strong> ·{" "}
        {shipping ? "Total com frete" : "Total dos produtos"}:{" "}
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
      ) : !pix ? (
        <p className="rounded-card border border-line bg-surface p-6">
          Carregando o Pix…
        </p>
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
            ? `Envie o pedido e o comprovante pelo WhatsApp. Confirmamos o pagamento e ${shipping ? "despachamos o pedido" : "calculamos o frete e combinamos a entrega"}.`
            : "Enviamos o pedido pelo WhatsApp."}
        </p>
        <a
          href={send(Boolean(payload))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            register();
            cartActions.clear();
          }}
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
