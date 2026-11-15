"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/button";
import { AddressFields } from "@/features/checkout/address-fields";
import { Consent } from "@/features/checkout/consent";
import { customerSchema } from "@/features/checkout/order";
import { supabase } from "@/lib/supabase";
import { saveProfile, sendLoginLink, signOut, useProfile } from "./profile";

const input =
  "mt-1 min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 font-normal";

export function AccountView() {
  const { ready, user, profile, reload } = useProfile();

  if (!supabase)
    return <p className="mt-8">A conta de cliente ainda não está disponível.</p>;
  if (!ready) return <p className="mt-8">Carregando…</p>;
  return user ? (
    <ProfileForm
      key={user.id + (profile ? "-saved" : "-new")}
      userId={user.id}
      email={user.email ?? ""}
      profile={profile}
      onSaved={reload}
    />
  ) : (
    <LoginForm />
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await sendLoginLink(email.trim());
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent")
    return (
      <p className="mt-8 rounded-card border border-line bg-surface p-6">
        Enviamos um link de acesso para <strong>{email}</strong>. Abra o e-mail e clique
        no link para entrar. Se não chegar em alguns minutos, olhe o spam.
      </p>
    );

  return (
    <form onSubmit={submit} className="mt-8 max-w-md space-y-4">
      <p>
        Entre com seu e-mail para salvar nome e endereço e comprar mais rápido. Sem senha:
        você recebe um link.
      </p>
      <label className="block font-bold">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={input}
        />
      </label>
      {status === "error" && (
        <p role="alert" className="text-sm text-promo">
          Não conseguimos enviar o link agora. Tente de novo em instantes.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className={`${buttonClass()} w-full disabled:opacity-50`}
      >
        {status === "sending" ? "Enviando…" : "Receber link de acesso"}
      </button>
      <p className="text-xs text-ink-soft">
        Comprar não exige conta. Veja a{" "}
        <Link href="/privacidade/" className="underline">
          política de privacidade
        </Link>
        .
      </p>
    </form>
  );
}

function ProfileForm({
  userId,
  email,
  profile,
  onSaved,
}: {
  userId: string;
  email: string;
  profile: Awaited<ReturnType<typeof useProfile>>["profile"];
  onSaved: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = customerSchema.safeParse({ ...data, delivery: "entrega", email });
    if (!parsed.success) {
      setStatus("idle");
      return setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
        ),
      );
    }
    setErrors({});
    setStatus("saving");
    const c = parsed.data;
    try {
      await saveProfile(userId, {
        name: c.name,
        phone: c.phone,
        email,
        cep: c.cep,
        street: c.street,
        number: c.number,
        complement: c.complement || null,
        district: c.district,
        city: c.city,
        state: c.state.toUpperCase(),
        accepts_whatsapp: c.acceptsWhatsapp,
        accepts_email: c.acceptsEmail,
      });
      setStatus("saved");
      onSaved();
    } catch {
      setStatus("error");
    }
  };

  const error = (name: string) =>
    errors[name] && <span className="text-sm text-promo">{errors[name]}</span>;

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-xl space-y-5">
      <p className="text-sm text-ink-soft">
        Conectado como <strong>{email}</strong>.{" "}
        <button type="button" className="underline" onClick={() => signOut()}>
          Sair
        </button>
      </p>
      <label className="block font-bold">
        Nome completo
        <input
          name="name"
          defaultValue={profile?.name}
          autoComplete="name"
          className={input}
        />
        {error("name")}
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
        />
        {error("phone")}
      </label>
      <AddressFields errors={errors} initial={profile ?? undefined} />
      <Consent
        errors={errors}
        defaults={{ whatsapp: profile?.accepts_whatsapp, email: profile?.accepts_email }}
      />
      {status === "error" && (
        <p role="alert" className="text-sm text-promo">
          Não conseguimos salvar agora. Tente de novo.
        </p>
      )}
      {status === "saved" && (
        <p className="text-sm font-bold text-forest">Dados salvos.</p>
      )}
      <button
        type="submit"
        disabled={status === "saving"}
        className={`${buttonClass()} w-full disabled:opacity-50`}
      >
        {status === "saving" ? "Salvando…" : "Salvar meus dados"}
      </button>
    </form>
  );
}
