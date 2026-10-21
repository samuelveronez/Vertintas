import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-forest">
        Política de privacidade
      </h1>
      <p>
        Este site não tem conta de usuário nem banco de dados. Coletamos o mínimo para
        atender o seu pedido: nome, WhatsApp e endereço de entrega (se você escolher
        entrega).
      </p>
      <h2 className="font-display text-2xl font-bold text-forest">
        Como usamos os dados
      </h2>
      <p>
        Os dados do formulário ficam apenas no seu navegador até você enviar o pedido pelo
        WhatsApp. A partir daí, a conversa fica com a VerTintas, que usa as informações
        somente para confirmar o pagamento, calcular o frete e entregar o pedido.
      </p>
      <h2 className="font-display text-2xl font-bold text-forest">Seus direitos</h2>
      <p>
        Você pode pedir a correção ou a exclusão dos seus dados a qualquer momento, pelo
        WhatsApp (LGPD, Lei 13.709/2018).
      </p>
      <h2 className="font-display text-2xl font-bold text-forest">Terceiros</h2>
      <p>
        O site é hospedado no GitHub Pages e usa fontes do Google Fonts. Links para
        WhatsApp, Instagram e Mercado Livre abrem serviços externos, com as políticas
        próprias de cada um.
      </p>
    </div>
  );
}
