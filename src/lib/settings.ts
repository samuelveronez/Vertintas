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
