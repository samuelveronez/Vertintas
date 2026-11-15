import { ButtonLink } from "@/components/button";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { products } from "@/features/catalog";
import { ProductCard } from "@/features/catalog/product-card";
import { asset } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";

const heroImage = "produtos/MLBU5370188322-2.webp";

const prices = [
  { size: "100 ml", price: "R$ 14" },
  { size: "250 ml", price: "R$ 28" },
  { size: "500 ml", price: "R$ 40" },
];

const steps = [
  ["1", "Escolha", "Navegue pelo catálogo e monte o carrinho com as cores e tamanhos."],
  [
    "2",
    "Pague com Pix",
    "Copie o código ou leia o QR Code. É rápido e sem taxa para você.",
  ],
  [
    "3",
    "Envie o comprovante",
    "Mande o pedido pelo WhatsApp. Confirmamos e combinamos o frete.",
  ],
];

const perks = [
  "Direto da fábrica",
  "Base água e não tóxica",
  "Pronta para uso",
  "Secagem rápida",
  "Garantia de 90 dias",
];

export default function Home() {
  return (
    <>
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-whatsapp">
              Tintas para artesanato direto da fábrica
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-forest md:text-5xl">
              As cores que dão vida à sua{" "}
              <span className="rounded-md bg-gold px-2 text-ink">peça</span>
            </h1>
            <p className="mt-4 text-lg text-ink-soft">
              Tinta PVA com super cobertura e acrílica metálica, feitas em João Pessoa/PB.
              Pedido simples, pagamento por Pix.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/produtos/">Ver produtos</ButtonLink>
              <ButtonLink
                href={whatsappLink("Olá! Vim pelo site da VerTintas e queria uma ajuda.")}
                variant="whatsapp"
                external
              >
                <WhatsAppIcon /> Peça pelo WhatsApp
              </ButtonLink>
            </div>
          </div>
          <div className="overflow-hidden rounded-card border border-line shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(heroImage)}
              alt="Frasco de tinta PVA amarela sobre uma bancada com pincéis"
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>
      </section>

      <ul className="bg-forest py-3 text-center text-sm font-bold text-white">
        <li className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-1 px-4">
          {perks.map((p) => (
            <span key={p}>✓ {p}</span>
          ))}
        </li>
      </ul>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-3xl font-bold text-forest">Nossa linha</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-surface py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-forest">
              Quanto mais tinta, menos você paga
            </h2>
            <p className="mt-3 text-ink-soft">
              Tinta PVA fosca em 28 cores. Quanto maior o frasco, menor o preço por ml.
            </p>
            <ButtonLink href="/produtos/tinta-pva/" className="mt-6">
              Escolher cores
            </ButtonLink>
          </div>
          <table className="w-full overflow-hidden rounded-card border border-line bg-white text-left shadow-card">
            <caption className="sr-only">Preços da tinta PVA</caption>
            <thead className="bg-forest text-white">
              <tr>
                <th className="p-4">Frasco</th>
                <th className="p-4 text-right">Preço</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.size} className="border-t border-line">
                  <td className="p-4 font-bold">{p.size}</td>
                  <td className="p-4 text-right font-display text-xl font-bold">
                    {p.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="como-comprar" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        <h2 className="font-display text-3xl font-bold text-forest">Como comprar</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map(([n, title, text]) => (
            <li key={n} className="rounded-card border border-line bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold font-bold text-ink">
                {n}
              </span>
              <h3 className="mt-3 font-display text-xl font-bold text-forest">{title}</h3>
              <p className="mt-1 text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-4 mb-4 rounded-card bg-forest px-6 py-12 text-center text-white md:mx-auto md:max-w-6xl">
        <h2 className="font-display text-3xl font-bold">
          Ficou com dúvida sobre cor ou quantidade?
        </h2>
        <p className="mt-2">Chame no WhatsApp que a gente ajuda a escolher.</p>
        <ButtonLink
          href={whatsappLink("Olá! Vim pelo site da VerTintas e queria uma ajuda.")}
          variant="whatsapp"
          external
          className="mt-6 border-2 border-white"
        >
          <WhatsAppIcon /> Peça agora pelo WhatsApp
        </ButtonLink>
      </section>
    </>
  );
}
