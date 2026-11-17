// Libera uma pessoa na equipe: cria o login no Supabase (se ainda não existir) e a coloca em `staff`.
// Só a equipe chama (JWT verificado pelo Supabase e conferido em `staff`). Usa a chave de serviço,
// que já existe no ambiente das Edge Functions.
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAddStaff, tempPassword } from "../_shared/staff.ts";

const env = (name: string) => Deno.env.get(name) ?? "";

const cors = {
  "Access-Control-Allow-Origin": env("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const jwt = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!jwt) return json({ error: "sem_permissao" }, 401);

  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: auth } = await admin.auth.getUser(jwt);
  if (!auth.user) return json({ error: "sem_permissao" }, 401);
  const { data: member } = await admin
    .from("staff")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!member) return json({ error: "sem_permissao" }, 403);

  const input = parseAddStaff(await req.json().catch(() => null));
  if (!input) return json({ error: "dados_invalidos" }, 400);

  const password = tempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.code !== "email_exists") {
      console.error("staff-admin createUser", error);
      return json({ error: "falha_ao_criar" }, 502);
    }
    // Já tem login (por exemplo, é cliente): só libera, pela função que confere a equipe.
    const caller = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { error: promote } = await caller.rpc("staff_add", {
      p_email: input.email,
      p_name: input.name,
    });
    if (promote) return json({ error: promote.message }, 400);
    return json({ created: false });
  }

  const { error: insert } = await admin
    .from("staff")
    .insert({ user_id: data.user.id, name: input.name });
  if (insert) {
    // Não deixa um login sem acesso, que confundiria uma nova tentativa.
    await admin.auth.admin.deleteUser(data.user.id);
    console.error("staff-admin insert", insert);
    return json({ error: "falha_ao_criar" }, 502);
  }
  return json({ created: true, password });
});
