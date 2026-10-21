const field = (id: string, value: string) =>
  `${id}${value.length.toString().padStart(2, "0")}${value}`;

// Campos do BRCode aceitam só ASCII e têm tamanho máximo.
const clean = (text: string, max: number) =>
  text
    .normalize("NFD")
    .replace(/[^\x20-\x7e]/g, "")
    .toUpperCase()
    .slice(0, max);

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

type PixInput = {
  key: string;
  name: string;
  city: string;
  amountCents: number;
  txid?: string;
};

/** Pix "copia e cola" estático com valor, conforme o manual de padrões do BR Code (Bacen). */
export function buildPixPayload({
  key,
  name,
  city,
  amountCents,
  txid,
}: PixInput): string {
  const body =
    field("00", "01") +
    field("26", field("00", "br.gov.bcb.pix") + field("01", key.trim())) +
    field("52", "0000") +
    field("53", "986") +
    field("54", (amountCents / 100).toFixed(2)) +
    field("58", "BR") +
    field("59", clean(name, 25)) +
    field("60", clean(city, 15)) +
    field("62", field("05", clean(txid ?? "", 25).replace(/[^A-Z0-9]/g, "") || "***")) +
    "6304";
  return body + crc16(body);
}
