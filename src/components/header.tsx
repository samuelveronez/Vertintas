import Link from "next/link";
import { CartLink } from "./cart-link";
import { Logo } from "./logo";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/95 shadow-card backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="VerTintas, página inicial">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-bold text-forest">
          <Link href="/#como-comprar" className="hidden hover:underline sm:inline">
            Como comprar
          </Link>
          <Link href="/produtos/" className="hover:underline">
            Produtos
          </Link>
          <CartLink />
        </nav>
      </div>
      <div className="rosette-stripe" aria-hidden="true" />
    </header>
  );
}
