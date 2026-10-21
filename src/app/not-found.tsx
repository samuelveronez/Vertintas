import { ButtonLink } from "@/components/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-4xl font-bold text-forest">
        Página não encontrada
      </h1>
      <ButtonLink href="/produtos/" className="mt-6">
        Ver produtos
      </ButtonLink>
    </div>
  );
}
