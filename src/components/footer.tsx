import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="mt-16 bg-forest text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-bold">VerTintas</p>
          <p className="mt-2 text-sm">
            {siteConfig.tagline}. {siteConfig.city}.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold">Contato</p>
          <ul className="mt-2 space-y-1">
            <li>
              <a
                className="underline"
                href={whatsappLink("Olá! Vim pelo site da VerTintas.")}
              >
                WhatsApp {siteConfig.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                className="underline"
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram @ver.tintas
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-bold">Institucional</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link className="underline" href="/privacidade/">
                Política de privacidade
              </Link>
            </li>
            <li>Garantia de fábrica de 90 dias</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/20 px-4 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} VerTintas. Também vendemos no{" "}
        <a
          className="underline hover:text-white"
          href={
            process.env.NEXT_PUBLIC_ML_STORE_URL ||
            "https://lista.mercadolivre.com.br/_CustId_3542972289"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Mercado Livre
        </a>
        .
      </p>
    </footer>
  );
}
