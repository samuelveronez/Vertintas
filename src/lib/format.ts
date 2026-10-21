import { basePath } from "./config";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRL = (cents: number) => brl.format(cents / 100);

/** Caminho de arquivo em `public/` respeitando o basePath do GitHub Pages. */
export const asset = (path: string) => `${basePath}/${path}`;
