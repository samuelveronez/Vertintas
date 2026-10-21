export const siteConfig = {
  name: "VerTintas",
  tagline: "Tintas artesanais direto da fábrica",
  city: "João Pessoa/PB",
  whatsapp: "5583982270860",
  whatsappDisplay: "(83) 98227-0860",
  instagram: "https://www.instagram.com/ver.tintas/",
  // Loja no Mercado Livre: só exibida de forma discreta, ver features/catalog.
  pix: {
    key: process.env.NEXT_PUBLIC_PIX_KEY ?? "",
    name: process.env.NEXT_PUBLIC_PIX_NAME ?? "VERTINTAS",
    city: process.env.NEXT_PUBLIC_PIX_CITY ?? "JOAO PESSOA",
  },
};

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
