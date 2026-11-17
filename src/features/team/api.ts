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
  dados_invalidos: "Confira o nome (2 a 80 letras) e o e-mail.",
  falha_ao_criar: "Não foi possível criar o login agora. Tente de novo.",
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

export type AddedStaff = { created: boolean; password?: string };

/** Cria o login (se ainda não existir) e libera a pessoa; a senha provisória vem uma única vez. */
export async function addStaff(email: string, name: string): Promise<AddedStaff> {
  const { data, error } = await db().functions.invoke<AddedStaff>("staff-admin", {
    body: { email, name },
  });
  if (error) {
    // O motivo vem no corpo da resposta da função.
    const body = await (error as { context?: Response }).context
      ?.json()
      .catch(() => undefined);
    throw new Error(body?.error ?? error.message);
  }
  return data as AddedStaff;
}
export const removeStaff = (userId: string) =>
  rpc<void>("staff_remove", { p_user_id: userId });
