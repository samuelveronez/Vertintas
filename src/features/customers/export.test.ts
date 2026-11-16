import { describe, expect, it } from "vitest";
import { consentedContacts, contactsCsv, whatsappTo } from "./export";

const base = { name: "Ana", phone: "83911112222", email: "ana@x.com" };

describe("consentedContacts", () => {
  it("exclui quem não aceitou nada e remove o canal sem aceite", () => {
    const rows = [
      { ...base, accepts_whatsapp: true, accepts_email: false },
      { ...base, name: "Bia", accepts_whatsapp: false, accepts_email: true },
      { ...base, name: "Cris", accepts_whatsapp: false, accepts_email: false },
    ];
    expect(consentedContacts(rows)).toEqual([
      { name: "Ana", whatsapp: "83911112222", email: "" },
      { name: "Bia", whatsapp: "", email: "ana@x.com" },
    ]);
  });

  it("ignora aceite de canal sem contato cadastrado", () => {
    expect(
      consentedContacts([
        { ...base, phone: null, accepts_whatsapp: true, accepts_email: false },
      ]),
    ).toEqual([]);
  });
});

describe("contactsCsv", () => {
  it("escapa aspas e ponto e vírgula e neutraliza fórmulas", () => {
    const csv = contactsCsv([
      { ...base, name: '=CMD("x");y', accepts_whatsapp: true, accepts_email: false },
    ]);
    expect(csv).toBe(`﻿nome;whatsapp;email\r\n"'=CMD(""x"");y";83911112222;\r\n`);
  });
});

describe("whatsappTo", () => {
  it("monta o link só para telefone válido", () => {
    expect(whatsappTo("(83) 98227-0860")).toBe("https://wa.me/5583982270860");
    expect(whatsappTo("123")).toBeUndefined();
    expect(whatsappTo(null)).toBeUndefined();
  });
});
