export type Variant = {
  id: string;
  /** Cor da tinta; ausente em produtos de cor única (base, verniz, kits). */
  color?: string;
  /** Tamanho ou nome do kit, como exibido ao cliente. */
  size: string;
  priceCents: number;
  /** Caminhos relativos a `public/` (use `asset()` para exibir). */
  images: string[];
  /** Anúncio equivalente no Mercado Livre; ausente quando o item só existe fora dele. */
  mlUrl?: string;
  /** Kits em que o cliente escolhe N cores entre as metálicas. */
  pickColors?: number;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  uses: string[];
  /** Foto do cartão, quando a primeira variante não é a melhor vitrine. */
  cover?: string;
  variants: Variant[];
};
