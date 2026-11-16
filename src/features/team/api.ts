import { supabase } from "@/lib/supabase";

export type StaffMember = {
  user_id: string;
  name: string;
  email: string;
  added_at: string;
};

function db() {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

const messages: Record<string, string> = {
  usuario_nao_encontrado:
    "Esse e-mail ainda não tem login. Crie o usuário em Supabase → Authentication → Users.",
  nao_pode_remover_a_si_mesmo: "Você não pode remover o seu próprio acesso.",
  nome_invalido: "Informe o nome (de 2 a 80 letras).",
  sem_permissao: "Você não tem permissão para isso.",
};

/** Traduz o erro do banco; o que não for conhecido sobe como veio. */
export const teamError = (e: unknown) =>
  messages[(e as Error).message] ?? "Não foi possível concluir. Tente de novo.";

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const fetchStaff = () => rpc<StaffMember[]>("staff_list");
export const addStaff = (email: string, name: string) =>
  rpc<void>("staff_add", { p_email: email, p_name: name });
export const removeStaff = (userId: string) =>
  rpc<void>("staff_remove", { p_user_id: userId });
