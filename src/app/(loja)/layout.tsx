import { CartBar } from "@/components/cart-bar";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-14 md:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartBar />
    </div>
  );
}
