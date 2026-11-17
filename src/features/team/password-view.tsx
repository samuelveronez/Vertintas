"use client";

import { useState } from "react";
import { buttonClass } from "@/components/button";
import { usePanel } from "@/features/orders/panel-context";
import { supabase } from "@/lib/supabase";

const field = "mt-1 min-h-10 w-full rounded-xl border-2 border-line bg-white px-4";

/** Quem está logado define a própria senha; a provisória deixa de valer. */
export function PasswordView() {
  const { notify } = usePanel();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password"));
    if (password.length < 8)
      return setError("A senha precisa ter ao menos 8 caracteres.");
    if (password !== String(data.get("confirm")))
      return setError("As duas senhas não são iguais.");

    setError("");
    setBusy(true);
    const { error: err } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes("different")
          ? "Escolha uma senha diferente da atual."
          : "Não foi possível trocar a senha agora. Saia, entre de novo e tente outra vez.",
      );
      return;
    }
    form.reset();
    notify("Senha trocada.");
  };

  return (
    <div className="max-w-md space-y-4">
      <h1 className="font-display text-2xl font-bold text-forest">Trocar minha senha</h1>
      <form
        onSubmit={submit}
        className="space-y-3 rounded-card border border-line bg-white p-3 shadow-card"
      >
        <label className="block font-bold">
          Nova senha
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={field}
          />
        </label>
        <label className="block font-bold">
          Repita a nova senha
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={field}
          />
        </label>
        {error && (
          <p role="alert" className="font-bold text-promo">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${buttonClass()} min-h-10`}>
          {busy ? "Salvando…" : "Trocar senha"}
        </button>
      </form>
    </div>
  );
}
