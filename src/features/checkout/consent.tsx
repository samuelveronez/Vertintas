import Link from "next/link";

/** Consentimento de contato (LGPD): nunca marcado por padrão, um aceite por canal. */
export function Consent({
  errors,
  defaults,
}: {
  errors: Record<string, string>;
  defaults?: { whatsapp?: boolean; email?: boolean };
}) {
  return (
    <fieldset className="space-y-2 rounded-xl bg-surface p-4">
      <legend className="px-1 font-bold">
        Novidades e promoções <span className="font-normal">(opcional)</span>
      </legend>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="acceptsWhatsapp"
          defaultChecked={defaults?.whatsapp}
          className="mt-1.5 size-5"
        />
        <span>Quero receber ofertas e lançamentos pelo WhatsApp</span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="acceptsEmail"
          defaultChecked={defaults?.email}
          className="mt-1.5 size-5"
        />
        <span>Quero receber ofertas e lançamentos por e-mail</span>
      </label>
      {errors.acceptsEmail && (
        <span className="block text-sm text-promo">{errors.acceptsEmail}</span>
      )}
      <p className="text-xs text-ink-soft">
        Você pode cancelar quando quiser. Veja a{" "}
        <Link href="/privacidade/" className="underline">
          política de privacidade
        </Link>
        .
      </p>
    </fieldset>
  );
}
