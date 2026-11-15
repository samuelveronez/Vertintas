import { supabase } from "./supabase";

/** Retirada na fábrica; ligada por padrão e quando o banco não responde. */
export async function fetchPickupEnabled(): Promise<boolean> {
  if (!supabase) return true;
  const { data } = await supabase
    .from("public_settings")
    .select("value")
    .eq("key", "pickup_enabled")
    .maybeSingle();
  return data?.value !== false;
}

export async function savePickupEnabled(enabled: boolean) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase
    .from("public_settings")
    .upsert({ key: "pickup_enabled", value: enabled });
  if (error) throw new Error(error.message);
}

export type PixConfig = { key: string; name: string; city: string };

/** Pix da loja configurado no painel; `null` quando não há (usa o das variáveis de build). */
export async function fetchPixConfig(): Promise<PixConfig | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("public_settings")
    .select("value")
    .eq("key", "pix")
    .maybeSingle();
  const value = data?.value as Partial<PixConfig> | undefined;
  if (!value?.key) return null;
  return { key: value.key, name: value.name ?? "", city: value.city ?? "" };
}

export async function savePixConfig(config: PixConfig) {
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase
    .from("public_settings")
    .upsert({ key: "pix", value: config });
  if (error) throw new Error(error.message);
}
