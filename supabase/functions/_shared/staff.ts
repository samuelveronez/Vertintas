// Regras puras da liberação de equipe (sem APIs do Deno) para poder testar com o Vitest.

export type AddStaffInput = { email: string; name: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAddStaff(body: unknown): AddStaffInput | undefined {
  if (typeof body !== "object" || body === null) return;
  const { email, name } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof name !== "string") return;
  const e = email.trim().toLowerCase();
  const n = name.trim();
  if (!EMAIL.test(e) || e.length > 120 || n.length < 2 || n.length > 80) return;
  return { email: e, name: n };
}

// 32 símbolos, sem I/O/0/1, que se confundem ao ditar a senha; 32 divide 256, então não há viés.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Senha provisória de 12 caracteres (60 bits), mostrada uma única vez à equipe. */
export function tempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}
