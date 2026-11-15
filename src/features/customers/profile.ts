"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { basePath } from "@/lib/config";
import { supabase } from "@/lib/supabase";

export type Profile = {
  name: string;
  phone: string | null;
  email: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  accepts_whatsapp: boolean;
  accepts_email: boolean;
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("customers")
    .select(
      "name, phone, email, cep, street, number, complement, district, city, state, accepts_whatsapp, accepts_email",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function saveProfile(userId: string, profile: Profile) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase
    .from("customers")
    .upsert({ user_id: userId, ...profile }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

/** Login sem senha: o cliente recebe um link por e-mail. */
export async function sendLoginLink(email: string) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${location.origin}${basePath}/conta/` },
  });
  if (error) throw new Error(error.message);
}

export const signOut = () => supabase?.auth.signOut();

type State = { ready: boolean; user?: User; profile?: Profile | null };

/** Sessão do cliente e perfil salvo; sem Supabase configurado, o site funciona como convidado. */
export function useProfile() {
  const [state, setState] = useState<State>({ ready: !supabase });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;

    async function load(user: User | undefined) {
      const profile = user ? await fetchProfile(user.id).catch(() => null) : null;
      if (active) setState({ ready: true, user, profile });
    }

    client.auth.getSession().then(({ data }) => load(data.session?.user));
    // Chamadas ao Supabase dentro do callback travam o cliente; por isso o setTimeout.
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => load(session?.user), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
