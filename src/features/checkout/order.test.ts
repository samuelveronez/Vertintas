import { describe, expect, it } from "vitest";
import {
  buildOrderMessage,
  customerPayload,
  customerSchema,
  formatAddress,
} from "./order";

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

describe("e-mail e consentimento", () => {
  const entrega = { ...base, delivery: "entrega", ...address };

  it("consentimento só é verdadeiro quando o checkbox vem marcado", () => {
    const r = customerSchema.parse({ ...entrega, acceptsWhatsapp: "on" });
    expect(r.acceptsWhatsapp).toBe(true);
    expect(r.acceptsEmail).toBe(false);
  });

  it("oferta por e-mail exige e-mail, e o e-mail precisa ser válido", () => {
    const sem = customerSchema.safeParse({ ...entrega, acceptsEmail: "on" });
    expect(sem.error?.issues.map((i) => i.path[0])).toEqual(["acceptsEmail"]);
    const ruim = customerSchema.safeParse({ ...entrega, email: "maria@" });
    expect(ruim.error?.issues.map((i) => i.path[0])).toEqual(["email"]);
    expect(
      customerSchema.safeParse({
        ...entrega,
        email: "maria@exemplo.com",
        acceptsEmail: "on",
      }).success,
    ).toBe(true);
  });

  it("monta o cliente para o banco; sem endereço na retirada", () => {
    const pickup = customerPayload(
      customerSchema.parse({ ...base, delivery: "retirada", acceptsWhatsapp: "on" }),
    );
    expect(pickup).toEqual({
      email: undefined,
      accepts_whatsapp: true,
      accepts_email: false,
    });
    const home = customerPayload(customerSchema.parse(entrega));
    expect(home).toMatchObject({ cep: "58000000", state: "PB", complement: "Apto 2" });
  });
});

describe("buildOrderMessage", () => {
  const pickup = customerSchema.parse({ ...base, delivery: "retirada" });

  it("é curta: código, total e pagamento, sem itens nem dados pessoais", () => {
    const msg = buildOrderMessage(pickup, 4200, "VT1", true);
    expect(msg).toContain("Pedido VT1");
    expect(msg).toContain("R$");
    expect(msg).toContain("Paguei o Pix");
    expect(msg).not.toContain("Maria");
    expect(msg.split("\n")).toHaveLength(4);
  });

  it("usa o modelo do painel e preserva variável desconhecida", () => {
    const msg = buildOrderMessage(
      pickup,
      4200,
      "VT1",
      false,
      undefined,
      "Oi! {pedido} de {nome} {x}",
    );
    expect(msg).toBe("Oi! VT1 de Maria Silva {x}");
  });
});
