// Liga a conta do Melhor Envio da loja (feito uma vez, por quem administra a conta).
// Rotas: GET /start?key=<ME_SETUP_KEY> → login no Melhor Envio · GET /callback (retorno do OAuth).
// Segredos: ME_CLIENT_ID, ME_CLIENT_SECRET, ME_SETUP_KEY, ME_ENV, ME_CONTACT_EMAIL.
import { signState, verifyState } from "../_shared/melhor-envio.ts";
import { baseUrl, connect, env } from "../_shared/melhor-envio-oauth.ts";

// Só o cálculo de frete por enquanto; gerar etiqueta exigirá reautorizar com mais escopos.
const SCOPES = "shipping-calculate";

const redirectUri = () =>
  `${env("SUPABASE_URL")}/functions/v1/melhor-envio-auth/callback`;
const text = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const route = url.pathname.split("/").pop();
  const secret = env("ME_SETUP_KEY");
  if (!secret) return text("ME_SETUP_KEY não configurada.", 500);

  if (route === "start") {
    if (url.searchParams.get("key") !== secret) return text("Não autorizado.", 401);
    const authorize = new URL(`${baseUrl()}/oauth/authorize`);
    authorize.search = new URLSearchParams({
      client_id: env("ME_CLIENT_ID"),
      redirect_uri: redirectUri(),
      response_type: "code",
      scope: SCOPES,
      state: await signState(secret),
    }).toString();
    return Response.redirect(authorize.toString(), 302);
  }

  if (route === "callback") {
    const code = url.searchParams.get("code");
    if (!code || !(await verifyState(secret, url.searchParams.get("state")))) {
      return text("Link inválido ou expirado. Comece de novo por /start.", 400);
    }
    try {
      await connect(code, redirectUri());
    } catch (e) {
      console.error("melhor envio connect", e);
      return text(`Não foi possível conectar: ${(e as Error).message}`, 502);
    }
    return text("Melhor Envio conectado. Pode fechar esta aba.");
  }

  return text("Não encontrado.", 404);
});
