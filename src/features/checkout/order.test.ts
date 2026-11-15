import { describe, expect, it } from "vitest";
import { customerSchema, formatAddress } from "./order";

const base = { name: "Maria Silva", phone: "(83) 98227-0860", note: "" };
const address = {
  cep: "58000000",
  street: "Rua das Flores",
  number: "120",
  complement: "Apto 2",
  district: "Centro",
  city: "João Pessoa",
  state: "pb",
};

describe("customerSchema", () => {
  it("aceita retirada sem endereço", () => {
    expect(customerSchema.safeParse({ ...base, delivery: "retirada" }).success).toBe(
      true,
    );
  });

  it("exige cada campo do endereço na entrega, apontando o campo", () => {
    const r = customerSchema.safeParse({ ...base, delivery: "entrega" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual([
      "cep",
      "street",
      "number",
      "district",
      "city",
      "state",
    ]);
  });

  it("limpa o CEP e formata o endereço", () => {
    const r = customerSchema.parse({
      ...base,
      delivery: "entrega",
      ...address,
      cep: "58000-000",
    });
    expect(formatAddress(r)).toBe(
      "Rua das Flores, 120 - Apto 2, Centro - João Pessoa/PB, CEP 58000000",
    );
  });
});
