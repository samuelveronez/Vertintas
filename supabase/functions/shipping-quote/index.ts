// Cotação de frete no Melhor Envio. Existe porque o token da conta não pode ir para o
// navegador (o site é estático). Autenticação OAuth: ver melhor-envio-auth e o ADR de frete.
import { normalizeOptions, parseQuoteRequest } from "../_shared/melhor-envio.ts";
import { accessToken, baseUrl, env, userAgent } from "../_shared/melhor-envio-oauth.ts";

const cors = {
  "Access-Control-Allow-Origin": env("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const request = parseQuoteRequest(await req.json().catch(() => null));
  if (!request) return json({ error: "invalid_request" }, 400);

  const token = await accessToken().catch((e) => {
    console.error("melhor envio token", e);
  });
  if (!token) return json({ error: "not_connected" }, 503);

  const res = await fetch(`${baseUrl()}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": userAgent(),
    },
    body: JSON.stringify({
      from: { postal_code: env("ME_FROM_CEP") },
      to: { postal_code: request.to },
      products: request.products,
    }),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("melhor envio", res.status, detail);
    // Status e mensagem do Melhor Envio não contêm segredos e aceleram o diagnóstico.
    return json({ error: "quote_unavailable", upstream: res.status, detail }, 502);
  }
  return json({ options: normalizeOptions(await res.json()) });
});
