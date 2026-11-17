"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/components/button";
import { usePanel } from "@/features/orders/panel-context";
import { basePath } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import { addStaff, fetchStaff, removeStaff, teamError, type StaffMember } from "./api";

const card = "space-y-2 rounded-card border border-line bg-white p-3 shadow-card";
const field = "mt-1 min-h-10 w-full rounded-xl border-2 border-line bg-white px-4";

export function TeamView() {
  const { notify } = usePanel();
  const [team, setTeam] = useState<StaffMember[]>();
  const [me, setMe] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<{ name: string; email: string; password: string }>();

  const load = useCallback(
    () => fetchStaff().then(setTeam, () => notify("Não foi possível carregar a equipe.")),
    [notify],
  );

  useEffect(() => {
    load();
    supabase?.auth.getSession().then(({ data }) => setMe(data.session?.user.id));
  }, [load]);

  const act = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      notify(success);
      await load();
    } catch (e) {
      notify(teamError(e));
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name"));
    const email = String(data.get("email"));
    setBusy(true);
    setAdded(undefined);
    try {
      const result = await addStaff(email, name);
      if (result.created && result.password)
        setAdded({ name, email, password: result.password });
      else notify("Pessoa liberada no painel.");
      form.reset();
      await load();
    } catch (err) {
      notify(teamError(err));
    } finally {
      setBusy(false);
    }
  };

  const copyAccess = async (a: NonNullable<typeof added>) => {
    const text = `Painel VerTintas\nEndereço: ${location.origin}${basePath}/painel/entrar/\nE-mail: ${a.email}\nSenha provisória: ${a.password}`;
    await navigator.clipboard.writeText(text).then(
      () => notify("Dados de acesso copiados."),
      () => notify("Não foi possível copiar; anote a senha."),
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-forest">Equipe</h1>
      <p className="text-ink-soft">
        Quem está aqui entra no painel e tem os mesmos poderes. Ao liberar um e-mail novo,
        o login é criado na hora, com uma senha provisória.
      </p>

      <section className={card}>
        <h2 className="font-display text-lg font-bold">Liberar uma pessoa</h2>
        <form
          onSubmit={add}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label className="font-bold">
            Nome
            <input name="name" required minLength={2} maxLength={80} className={field} />
          </label>
          <label className="font-bold">
            E-mail do login
            <input name="email" type="email" required className={field} />
          </label>
          <button type="submit" disabled={busy} className={`${buttonClass()} min-h-10`}>
            {busy ? "Liberando…" : "Liberar"}
          </button>
        </form>
      </section>

      {added && (
        <section role="status" className={`${card} border-forest`}>
          <h2 className="font-display text-lg font-bold">
            Login criado para {added.name}
          </h2>
          <p>
            E-mail: <b>{added.email}</b>
            <br />
            Senha provisória:{" "}
            <b className="font-mono text-lg tracking-wider">{added.password}</b>
          </p>
          <p className="text-sm text-ink-soft">
            Anote ou copie agora: a senha não aparece de novo. Passe para {added.name}{" "}
            entrar em Painel → Entrar.
          </p>
          <button
            className={`${buttonClass("outline")} min-h-10`}
            onClick={() => copyAccess(added)}
          >
            Copiar dados de acesso
          </button>
        </section>
      )}

      <section className={card}>
        <h2 className="font-display text-lg font-bold">Quem tem acesso</h2>
        {!team ? (
          <p>Carregando…</p>
        ) : (
          <ul className="divide-y divide-line">
            {team.map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {m.name}
                    {m.user_id === me && <span className="font-normal"> (você)</span>}
                  </p>
                  <p className="truncate text-sm text-ink-soft">{m.email}</p>
                </div>
                {m.user_id !== me && (
                  <button
                    className={`${buttonClass("outline")} min-h-10`}
                    disabled={busy}
                    onClick={() => {
                      if (confirm(`Tirar o acesso de ${m.name} ao painel?`))
                        act(() => removeStaff(m.user_id), "Acesso removido.");
                    }}
                  >
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
