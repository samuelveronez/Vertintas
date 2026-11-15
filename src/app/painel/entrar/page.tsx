"use client";

import { useState } from "react";
import { buttonClass } from "@/components/button";
import { supabase } from "@/lib/supabase";

const field = "mt-1 w-full rounded-xl border-2 border-line bg-white p-3.5 text-lg";

export default function EntrarPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { error: err } = await supabase!.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    // Em caso de sucesso o PanelFrame percebe a sessão e leva para o painel.
    if (err) setError("E-mail ou senha incorretos.");
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-center font-display text-3xl font-bold text-forest">
        VerTintas
      </h1>
      <p className="mt-1 text-center text-ink-soft">Painel de pedidos</p>
      <form
        onSubmit={submit}
        className="mt-6 space-y-4 rounded-card border border-line bg-white p-6 shadow-card"
      >
        <label className="block font-bold">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </label>
        <label className="block font-bold">
          Senha
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={field}
          />
        </label>
        {error && (
          <p role="alert" className="font-bold text-promo">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className={`${buttonClass()} min-h-16 w-full text-xl`}
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <p className="text-sm text-ink-soft">
          Este aparelho continua conectado até você tocar em Sair.
        </p>
      </form>
    </div>
  );
}
