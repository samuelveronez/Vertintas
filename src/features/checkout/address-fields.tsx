"use client";

import { useEffect, useState } from "react";
import { lookupCep } from "@/features/shipping/cep";
import { isCep, normalizeCep } from "@/features/shipping/shipping";

const input =
  "mt-1 min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 font-normal";

type Status = "idle" | "loading" | "notFound" | "error";

/**
 * Endereço em campos separados. Com o CEP vindo da cotação de frete ele fica travado,
 * porque o preço e o prazo valem para esse CEP; senão o cliente digita e buscamos o resto.
 */
export function AddressFields({
  quotedCep,
  errors,
}: {
  quotedCep?: string;
  errors: Record<string, string>;
}) {
  const [cep, setCep] = useState(quotedCep ?? "");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  // Resultado da última busca; "buscando" é derivado, para não setar estado direto no efeito.
  const [lookup, setLookup] = useState<{
    cep: string;
    status: "found" | "notFound" | "error";
  }>();
  const status: Status = !isCep(cep)
    ? "idle"
    : lookup?.cep !== cep
      ? "loading"
      : lookup.status === "found"
        ? "idle"
        : lookup.status;

  useEffect(() => {
    if (!isCep(cep)) return;
    let current = true;
    lookupCep(cep).then(
      (found) => {
        if (!current) return;
        if (!found) return setLookup({ cep, status: "notFound" });
        setStreet(found.street);
        setDistrict(found.district);
        setCity(found.city);
        setState(found.state);
        setLookup({ cep, status: "found" });
      },
      () => current && setLookup({ cep, status: "error" }),
    );
    return () => {
      current = false;
    };
  }, [cep]);

  const error = (name: string) =>
    errors[name] && (
      <span id={`${name}-error`} className="block text-sm font-normal text-promo">
        {errors[name]}
      </span>
    );

  return (
    <fieldset className="space-y-4">
      <legend className="font-bold">Endereço de entrega</legend>

      <label className="block font-bold">
        CEP
        <input
          name="cep"
          value={cep}
          onChange={(e) => setCep(normalizeCep(e.target.value).slice(0, 8))}
          readOnly={Boolean(quotedCep)}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={9}
          className={`${input} ${quotedCep ? "bg-surface" : ""}`}
          aria-describedby="cep-error"
        />
        {error("cep")}
        {status === "loading" && (
          <span className="block text-sm font-normal text-ink-soft">
            Buscando endereço…
          </span>
        )}
        {(status === "notFound" || status === "error") && (
          <span className="block text-sm font-normal text-ink-soft">
            {status === "notFound"
              ? "Não encontramos esse CEP."
              : "Não conseguimos buscar o endereço."}{" "}
            Preencha os campos abaixo.
          </span>
        )}
      </label>

      <label className="block font-bold">
        Rua
        <input
          name="street"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          autoComplete="address-line1"
          className={input}
          aria-describedby="street-error"
        />
        {error("street")}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block font-bold">
          Número
          <input
            name="number"
            autoComplete="address-line2"
            placeholder="Ex.: 120 ou S/N"
            className={input}
            aria-describedby="number-error"
          />
          {error("number")}
        </label>
        <label className="block font-bold">
          Complemento <span className="font-normal">(opcional)</span>
          <input name="complement" placeholder="Apto, bloco…" className={input} />
        </label>
      </div>

      <label className="block font-bold">
        Bairro
        <input
          name="district"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className={input}
          aria-describedby="district-error"
        />
        {error("district")}
      </label>

      <div className="grid grid-cols-[1fr_5rem] gap-3">
        <label className="block font-bold">
          Cidade
          <input
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
            className={input}
            aria-describedby="city-error"
          />
          {error("city")}
        </label>
        <label className="block font-bold">
          UF
          <input
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
            autoComplete="address-level1"
            maxLength={2}
            className={`${input} uppercase`}
            aria-describedby="state-error"
          />
          {error("state")}
        </label>
      </div>
    </fieldset>
  );
}
