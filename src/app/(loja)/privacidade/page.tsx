import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-forest">
        Política de privacidade
      </h1>
      <p>
        Coletamos o mínimo para atender o seu pedido: nome, WhatsApp, endereço de entrega
        (se você escolher entrega) e, se quiser informar, o e-mail.
      </p>
      <h2 className="font-display text-2xl font-bold text-forest">
        Como usamos os dados
      </h2>
      <p>
        Usamos os dados para confirmar o pagamento, calcular o frete, entregar o pedido e
        falar com você sobre ele. Guardamos o seu cadastro (nome, contato, endereço e
        histórico de pedidos) para facilitar as próximas compras e atender você.
      </p>
      <p>
        Se você marcar a opção, também enviamos novidades, lançamentos e promoções pelo
        WhatsApp ou pelo e-mail, conforme o canal que escolher. Isso é opcional e nunca
        vem marcado por padrão. Você pode cancelar quando quiser, pela página Minha conta
        ou pedindo pelo WhatsApp.
      </p>
      <p>
        Quem cria conta entra com um link enviado por e-mail, sem senha, e pode editar ou
        apagar os dados salvos.
      </p>
      <h2 className="font-display text-2xl font-bold text-forest">Seus direitos</h2>
      <p>
        Você pode pedir a correção ou a exclusão dos seus dados a qualquer momento, pelo
        WhatsApp (LGPD, Lei 13.709/2018).
      </p>
      <h2 className="font-display text-2xl font-bold text-forest">Terceiros</h2>
      <p>
        O site é hospedado no GitHub Pages e usa fontes do Google Fonts. Os dados de
        pedidos e clientes ficam no Supabase. Ao informar o CEP, ele é consultado no
        ViaCEP para preencher o endereço. Os cálculos de frete usam o Melhor Envio. Links
        para WhatsApp, Instagram e Mercado Livre abrem serviços externos, com as políticas
        próprias de cada um.
      </p>
    </div>
  );
}
