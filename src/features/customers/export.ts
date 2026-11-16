export type Contact = {
  name: string;
  phone: string | null;
  email: string | null;
  accepts_whatsapp: boolean;
  accepts_email: boolean;
};

/** Só entra no remarketing quem aceitou o canal; o canal sem aceite sai da linha. */
export function consentedContacts<T extends Contact>(rows: T[]) {
  return rows.flatMap((c) => {
    const whatsapp = c.accepts_whatsapp && c.phone ? c.phone : "";
    const email = c.accepts_email && c.email ? c.email : "";
    return whatsapp || email ? [{ name: c.name, whatsapp, email }] : [];
  });
}

// Planilhas executam células que começam com = + - @; o apóstrofo as mantém como texto.
const cell = (v: string) => {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[";\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

/** CSV com ";" e BOM, que o Excel em português abre com acentos corretos. */
export function contactsCsv(rows: Contact[]): string {
  const lines = consentedContacts(rows).map((c) =>
    [c.name, c.whatsapp, c.email].map(cell).join(";"),
  );
  return `﻿${["nome;whatsapp;email", ...lines].join("\r\n")}\r\n`;
}

/** Link do WhatsApp do cliente (números do Brasil, com DDD). */
export function whatsappTo(phone: string | null): string | undefined {
  const digits = (phone ?? "").replace(/\D/g, "");
  return /^\d{10,11}$/.test(digits) ? `https://wa.me/55${digits}` : undefined;
}
