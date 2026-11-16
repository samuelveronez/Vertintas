"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PanelProvider, usePanel, type Mode } from "./panel-context";

type Auth = "loading" | "out" | "denied" | "ok";

const tabs = [
  { href: "/painel/", label: "Hoje", modes: ["simples", "completo"] },
  { href: "/painel/pedidos/", label: "Todos os pedidos", modes: ["completo"] },
  { href: "/painel/estoque/", label: "Estoque", modes: ["completo"] },
  { href: "/painel/canais/", label: "Canais de venda", modes: ["completo"] },
];

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="mx-auto max-w-xl px-4 py-20 text-center text-lg">{children}</p>;
}

export function PanelFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<Auth>("loading");
  const onLogin = pathname.startsWith("/painel/entrar");

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;

    // Só quem está na tabela `staff` entra; qualquer outro login cai em "sem acesso".
    async function check(userId: string | undefined) {
      if (!userId) return active && setAuth("out");
      const { data } = await client.from("staff").select("user_id").eq("user_id", userId);
      if (active) setAuth(data?.length ? "ok" : "denied");
    }

    client.auth.getSession().then(({ data }) => check(data.session?.user.id));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => check(session?.user.id), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (auth === "out" && !onLogin) router.replace("/painel/entrar/");
    if (auth === "ok" && onLogin) router.replace("/painel/");
  }, [auth, onLogin, router]);

  if (!supabase)
    return (
      <Notice>
        O painel ainda não está conectado ao banco de dados. Falta configurar{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        .
      </Notice>
    );
  if (auth === "loading") return <Notice>Carregando…</Notice>;
  if (auth === "out") return onLogin ? <>{children}</> : <Notice>Entrando…</Notice>;
  if (auth === "denied")
    return (
      <Notice>
        Este e-mail não tem acesso ao painel. Peça para o administrador liberar.{" "}
        <button className="font-bold underline" onClick={() => supabase?.auth.signOut()}>
          Sair
        </button>
      </Notice>
    );
  if (onLogin) return <Notice>Entrando…</Notice>;

  return (
    <PanelProvider>
      <Nav />
      <Body>{children}</Body>
    </PanelProvider>
  );
}

/** O Kanban do modo simples usa a largura toda; as demais telas ficam numa coluna de leitura. */
function Body({ children }: { children: React.ReactNode }) {
  const { mode } = usePanel();
  return (
    <div
      className={`mx-auto px-4 py-5 text-lg ${mode === "completo" ? "max-w-5xl" : "max-w-[110rem]"}`}
    >
      {children}
    </div>
  );
}

function Nav() {
  const pathname = usePathname();
  const { mode, setMode } = usePanel();
  const visible = tabs.filter((t) => t.modes.includes(mode));

  return (
    <header className="bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-3 bg-forest px-4 py-2 text-white">
        <span className="font-display font-bold">VerTintas · Painel</span>
        <div className="ml-auto flex items-center gap-3">
          <div
            role="group"
            aria-label="Modo de exibição"
            className="flex overflow-hidden rounded-full border border-white/40"
          >
            {(["simples", "completo"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-11 px-4 font-bold capitalize ${mode === m ? "bg-white text-forest" : ""}`}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="min-h-11 rounded-full border border-white/40 px-4 text-sm"
            onClick={() => supabase?.auth.signOut()}
          >
            Sair
          </button>
        </div>
      </div>
      <div className="rosette-stripe" aria-hidden="true" />
      {visible.length > 1 && (
        <nav
          className="flex gap-1 overflow-x-auto border-b border-line px-3"
          aria-label="Seções do painel"
        >
          {visible.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={pathname === t.href ? "page" : undefined}
              className={`min-h-14 whitespace-nowrap border-b-4 px-4 py-4 font-bold ${
                pathname === t.href
                  ? "border-forest text-forest"
                  : "border-transparent text-ink-soft"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
