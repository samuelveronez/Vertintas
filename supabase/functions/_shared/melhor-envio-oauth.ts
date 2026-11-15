// Tokens do Melhor Envio: troca de código, renovação e leitura do token válido.
import { createClient } from "npm:@supabase/supabase-js@2";
import { needsRefresh } from "./melhor-envio.ts";

export const env = (name: string) => Deno.env.get(name) ?? "";

export const baseUrl = () =>
  env("ME_ENV") === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";

// Exigido pelo Melhor Envio: nome da aplicação e e-mail técnico.
export const userAgent = () => `VerTintas (${env("ME_CONTACT_EMAIL")})`;

export const admin = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${baseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent(),
    },
    body: new URLSearchParams({
      client_id: env("ME_CLIENT_ID"),
      client_secret: env("ME_CLIENT_SECRET"),
      ...params,
    }),
  });
  if (!res.ok)
    throw new Error(`token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.json();
}

const row = (t: TokenResponse) => ({
  id: 1,
  access_token: t.access_token,
  refresh_token: t.refresh_token,
  expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
});

export async function connect(code: string, redirectUri: string) {
  const t = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const { error } = await admin()
    .from("melhor_envio_connection")
    .upsert({ ...row(t), connected_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/** Token válido; o refresh token é de uso único, então o novo par é salvo na hora. */
export async function accessToken(): Promise<string | undefined> {
  const db = admin();
  const { data: c } = await db
    .from("melhor_envio_connection")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!c) return;
  if (!needsRefresh(c.expires_at)) return c.access_token;
  const t = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: c.refresh_token,
  });
  await db.from("melhor_envio_connection").update(row(t)).eq("id", 1);
  return t.access_token;
}
