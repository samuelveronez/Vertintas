import { z } from "zod";
import { normalizeCep } from "./shipping";

export type CepAddress = {
  street: string;
  district: string;
  city: string;
  state: string;
};

const viaCepSchema = z.object({
  logradouro: z.string().default(""),
  bairro: z.string().default(""),
  localidade: z.string().default(""),
  uf: z.string().default(""),
  erro: z.unknown().optional(),
});

/** Resposta do ViaCEP → endereço; CEP inexistente volta `{"erro": true}`. */
export function parseViaCep(raw: unknown): CepAddress | undefined {
  const r = viaCepSchema.safeParse(raw);
  if (!r.success || r.data.erro) return;
  return {
    street: r.data.logradouro,
    district: r.data.bairro,
    city: r.data.localidade,
    state: r.data.uf,
  };
}

/** Preenche rua, bairro e cidade; CEPs genéricos de cidade pequena vêm sem rua e bairro. */
export async function lookupCep(cep: string): Promise<CepAddress | undefined> {
  const res = await fetch(`https://viacep.com.br/ws/${normalizeCep(cep)}/json/`);
  if (!res.ok) throw new Error(`viacep ${res.status}`);
  return parseViaCep(await res.json());
}
