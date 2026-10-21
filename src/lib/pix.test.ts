import { describe, expect, it } from "vitest";
import { buildPixPayload, crc16 } from "./pix";

describe("pix", () => {
  it("calcula o CRC16-CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("gera payload com valor, chave e CRC válido", () => {
    const payload = buildPixPayload({
      key: "teste@example.com",
      name: "Vertintas",
      city: "João Pessoa",
      amountCents: 2850,
    });
    expect(payload.startsWith("000201")).toBe(true);
    expect(payload).toContain("br.gov.bcb.pix0117teste@example.com");
    expect(payload).toContain("540528.50");
    expect(payload).toContain("5909VERTINTAS");
    expect(payload).toContain("6011JOAO PESSOA");
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });
});
