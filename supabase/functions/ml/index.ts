// Integração com o Mercado Livre (fase 1: somente leitura de pedidos).
// Rotas: POST / {action: "connect" | "sync"} (login da equipe) · GET /callback (OAuth) · POST /webhook (ML).
// Segredos: ML_APP_ID, ML_CLIENT_SECRET, PANEL_URL (ex.: https://…/painel/canais/).
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente das Edge Functions.
import { createClient } from "npm:@supabase/supabase-js@2";

const ML_API = "https://api.mercadolibre.com";
const ML_AUTH = "https://auth.mercadolivre.com.br/authorization";

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Variável ${k} não configurada`);
  return v;
};

const admin = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
const redirectUri = () => `${env("SUPABASE_URL")}/functions/v1/ml/callback`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

type Db = ReturnType<typeof admin>;

/** Quem chama precisa estar logado e na tabela `staff`. */
async function requireStaff(db: Db, req: Request) {
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!jwt) return false;
  const { data } = await db.auth.getUser(jwt);
  if (!data.user) return false;
  const { data: row } = await db
    .from("staff")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return Boolean(row);
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch(`${ML_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: env("ML_APP_ID"),
      client_secret: env("ML_CLIENT_SECRET"),
      ...params,
    }),
  });
  if (!res.ok) throw new Error(`ML token: ${res.status}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: number;
  };
}

const tokenRow = (t: Awaited<ReturnType<typeof tokenRequest>>) => ({
  ml_user_id: t.user_id,
  access_token: t.access_token,
  refresh_token: t.refresh_token,
  expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
});

/** Token válido; o refresh token do ML é de uso único, então o novo par é salvo na hora. */
async function accessToken(db: Db) {
  const { data: c } = await db.from("ml_connection").select("*").eq("id", 1).maybeSingle();
  if (!c?.refresh_token) throw new Error("Mercado Livre não conectado");
  if (c.access_token && new Date(c.expires_at).getTime() - Date.now() > 60_000) {
    return { token: c.access_token as string, userId: c.ml_user_id as number };
  }
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: c.refresh_token });
  await db.from("ml_connection").update(tokenRow(t)).eq("id", 1);
  return { token: t.access_token, userId: t.user_id };
}

async function mlGet(path: string, token: string) {
  const res = await fetch(`${ML_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`ML ${path}: ${res.status}`);
  return await res.json();
}

// deno-lint-ignore no-explicit-any
type MlOrder = any;

function mapStatus(ml: string) {
  if (ml === "paid") return "to_make";
  if (ml === "cancelled") return "cancelled";
  return "pending_payment";
}

const PROGRESSED = ["to_pack", "ready_to_ship", "shipped", "delivered"];

async function importOrder(db: Db, token: string, order: MlOrder) {
  const ref = String(order.id);
  const status = mapStatus(order.status);
  const { data: existing } = await db
    .from("orders")
    .select("id, status")
    .eq("channel", "ml")
    .eq("external_ref", ref)
    .maybeSingle();

  if (existing) {
    // Não volta um pedido que a equipe já avançou; só aplica pagamento tardio e cancelamento.
    const next =
      status === "cancelled" ? "cancelled" : PROGRESSED.includes(existing.status) ? null : status;
    if (next && next !== existing.status) {
      await db
        .from("orders")
        .update({ status: next, paid_at: next === "to_make" ? new Date().toISOString() : null })
        .eq("id", existing.id);
    }
    return;
  }

  // Cidade de destino vem do envio; falhar aqui não impede de registrar o pedido.
  let destination = "";
  let shipping = "";
  if (order.shipping?.id) {
    try {
      const s = await mlGet(`/shipments/${order.shipping.id}`, token);
      const a = s.receiver_address;
      destination = [a?.city?.name, a?.state?.name].filter(Boolean).join(" / ");
      shipping = "Mercado Envios (etiqueta no Mercado Livre)";
    } catch {
      shipping = "Mercado Envios";
    }
  }

  const buyer = order.buyer ?? {};
  const name = [buyer.first_name, buyer.last_name].filter(Boolean).join(" ") || buyer.nickname || "Cliente ML";
  const { data: row, error } = await db
    .from("orders")
    .insert({
      channel: "ml",
      external_ref: ref,
      customer_name: name,
      destination,
      shipping,
      status,
      paid_at: status === "to_make" ? new Date().toISOString() : null,
      ordered_at: order.date_created,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const items = (order.order_items ?? []).map((i: MlOrder) => ({
    order_id: row.id,
    // O SKU do catálogo do site é o id do anúncio; sem correspondência o item fica só com o título.
    variant_id: [i.item?.user_product_id, i.item?.seller_sku, i.item?.seller_custom_field].find(Boolean) ?? null,
    name: String(i.item?.title ?? "Item do Mercado Livre"),
    qty: i.quantity,
    unit_price_cents: Math.round(Number(i.unit_price) * 100),
  }));
  if (items.length) await db.from("order_items").insert(items);
}

async function sync(db: Db) {
  const { token, userId } = await accessToken(db);
  const res = await mlGet(`/orders/search?seller=${userId}&sort=date_desc&limit=50`, token);
  for (const order of (res.results ?? []).reverse()) await importOrder(db, token, order);
  await db.from("ml_connection").update({ last_sync_at: new Date().toISOString() }).eq("id", 1);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const route = url.pathname.split("/").pop();
  const db = admin();

  try {
    if (route === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const { data: c } = await db.from("ml_connection").select("oauth_state").eq("id", 1).maybeSingle();
      if (!code || !state || state !== c?.oauth_state) return new Response("Pedido inválido", { status: 400 });
      const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri() });
      await db
        .from("ml_connection")
        .update({ ...tokenRow(t), oauth_state: null, connected_at: new Date().toISOString() })
        .eq("id", 1);
      await sync(db);
      return Response.redirect(env("PANEL_URL"), 302);
    }

    if (route === "webhook") {
      // O ML não assina a notificação: só usamos o aviso para buscar o pedido com o nosso token.
      const note = await req.json();
      const { token, userId } = await accessToken(db);
      if (note.topic === "orders_v2" && String(note.user_id) === String(userId) && /^\/orders\/\d+$/.test(note.resource)) {
        await importOrder(db, token, await mlGet(note.resource, token));
      }
      return json({ ok: true });
    }

    const { action } = await req.json();
    if (action === "connect") {
      if (!(await requireStaff(db, req))) return json({ error: "Sem permissão" }, 403);
      const state = crypto.randomUUID();
      await db.from("ml_connection").upsert({ id: 1, oauth_state: state });
      const auth = new URL(ML_AUTH);
      auth.search = new URLSearchParams({
        response_type: "code",
        client_id: env("ML_APP_ID"),
        redirect_uri: redirectUri(),
        state,
      }).toString();
      return json({ url: auth.toString() });
    }
    if (action === "sync") {
      if (!(await requireStaff(db, req))) return json({ error: "Sem permissão" }, 403);
      await sync(db);
      return json({ ok: true });
    }
    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error(e);
    // O webhook responde 200 mesmo com erro para o ML não reenviar em loop; o sync periódico recupera.
    return route === "webhook" ? json({ ok: false }) : json({ error: (e as Error).message }, 500);
  }
});
