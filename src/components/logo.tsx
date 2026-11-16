import Image from "next/image";
import logo from "@/assets/logo.jpg";

// Import estático: o Next aplica o basePath do GitHub Pages ao caminho da imagem.
export function Logo() {
  return <Image src={logo} alt="VerTintas, tintas artesanais" priority className="h-16 w-auto" />;
}
