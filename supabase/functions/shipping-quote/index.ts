// Cotação de frete no Melhor Envio. Existe porque o token da conta não pode ir para o
// navegador (o site é estático). Secrets: ver docs/decisions/0002-frete-melhor-envio.md.
import { normalizeOptions, parseQuoteRequest } from "../_shared/melhor-envio.ts";

const env = (name: string) => Deno.env.get(name) ?? "";

const baseUrl =
  env("ME_ENV") === "production"
    ? "https://melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";

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

  const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${env("ME_TOKEN")}`,
      // Exigido pelo Melhor Envio: nome da aplicação e e-mail técnico.
      "User-Agent": `VerTintas (${env("ME_CONTACT_EMAIL")})`,
    },
    body: JSON.stringify({
      from: { postal_code: env("ME_FROM_CEP") },
      to: { postal_code: request.to },
      products: request.products,
    }),
  });

  if (!res.ok) {
    console.error("melhor envio", res.status, await res.text());
    return json({ error: "quote_unavailable" }, 502);
  }
  return json({ options: normalizeOptions(await res.json()) });
});
