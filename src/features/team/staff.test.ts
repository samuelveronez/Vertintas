import { describe, expect, it } from "vitest";
import { parseAddStaff, tempPassword } from "../../../supabase/functions/_shared/staff";

describe("parseAddStaff", () => {
  it("normaliza o e-mail e apara o nome", () => {
    expect(parseAddStaff({ email: "  Carlos@Gmail.com ", name: " Carlos " })).toEqual({
      email: "carlos@gmail.com",
      name: "Carlos",
    });
  });

  it("rejeita e-mail inválido, nome curto e corpo errado", () => {
    expect(parseAddStaff({ email: "carlos@", name: "Carlos" })).toBeUndefined();
    expect(parseAddStaff({ email: "a@b.com", name: "C" })).toBeUndefined();
    expect(parseAddStaff({ email: "a@b.com" })).toBeUndefined();
    expect(parseAddStaff(null)).toBeUndefined();
  });
});

describe("tempPassword", () => {
  it("tem 12 caracteres legíveis e muda a cada chamada", () => {
    const a = tempPassword();
    expect(a).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
    expect(tempPassword()).not.toBe(a);
  });
});
