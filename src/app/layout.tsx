import type { Metadata } from "next";
import { Nunito, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: {
    default: "VerTintas | Tintas artesanais direto da fábrica",
    template: "%s | VerTintas",
  },
  description:
    "Tintas PVA, acrílica metálica, base, verniz e kits para artesanato. Direto da fábrica em João Pessoa/PB. Pague com Pix e peça pelo WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
