"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buttonClass } from "@/components/button";
import { formatBRL } from "@/lib/format";
import { formatWhen } from "@/features/orders/order-ui";
import { usePanel } from "@/features/orders/panel-context";
import {
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
  type CustomerRow,
} from "./admin-api";
import { consentedContacts, contactsCsv, whatsappTo } from "./export";

const card = "space-y-2 rounded-card border border-line bg-white p-3 shadow-card";
const field = "mt-1 min-h-10 w-full rounded-xl border-2 border-line bg-white px-3";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function CustomersView() {
  const { notify } = usePanel();
  const [rows, setRows] = useState<CustomerRow[]>();
  const [query, setQuery] = useState("");
  const [onlyConsent, setOnlyConsent] = useState(false);
  const [editing, setEditing] = useState<string>();

  const load = useCallback(
    () =>
      fetchCustomers().then(setRows, () =>
        notify("Não foi possível carregar os clientes."),
      ),
    [notify],
  );
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    return (rows ?? []).filter(
      (c) =>
        (!onlyConsent || c.accepts_whatsapp || c.accepts_email) &&
        (!q || norm([c.name, c.phone, c.email].join(" ")).includes(q)),
    );
  }, [rows, query, onlyConsent]);

  const act = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      notify(success);
      setEditing(undefined);
      await load();
    } catch {
      notify("Não foi possível concluir. Tente de novo.");
    }
  };

  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([contactsCsv(rows ?? [])], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "contatos-com-consentimento.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const consented = consentedContacts(rows ?? []).length;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-forest">Clientes</h1>

      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 font-bold">
          Buscar
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome, WhatsApp ou e-mail"
            className={field}
          />
        </label>
        <label className="flex min-h-10 items-center gap-2">
          <input
            type="checkbox"
            checked={onlyConsent}
            onChange={(e) => setOnlyConsent(e.target.checked)}
            className="size-5"
          />
          Só quem aceita contato
        </label>
        <button
          className={`${buttonClass("outline")} min-h-10`}
          disabled={consented === 0}
          onClick={exportCsv}
        >
          Exportar contatos ({consented})
        </button>
      </div>

      {!rows ? (
        <p>Carregando…</p>
      ) : shown.length === 0 ? (
        <p className="text-ink-soft">Nenhum cliente encontrado.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <li key={c.id} className={card}>
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {c.name}
                    {c.has_account && (
                      <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs">
                        conta
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {[c.phone, c.email, [c.city, c.state].filter(Boolean).join("/")]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex gap-1.5 text-xs font-bold">
                  <Badge on={c.accepts_whatsapp}>WhatsApp</Badge>
                  <Badge on={c.accepts_email}>E-mail</Badge>
                </div>
              </div>
              <p className="text-sm">
                {c.orders_count} {c.orders_count === 1 ? "pedido" : "pedidos"} ·{" "}
                {formatBRL(c.total_cents)}
                {c.last_order_at && <> · última compra {formatWhen(c.last_order_at)}</>}
                {c.consent_at && (c.accepts_whatsapp || c.accepts_email) && (
                  <span className="text-ink-soft">
                    {" "}
                    · aceite em {formatWhen(c.consent_at)}
                  </span>
                )}
              </p>

              {editing === c.id ? (
                <EditForm
                  customer={c}
                  onCancel={() => setEditing(undefined)}
                  onSave={(patch) =>
                    act(() => updateCustomer(c.id, patch), "Cliente atualizado.")
                  }
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {whatsappTo(c.phone) && (
                    <a
                      href={whatsappTo(c.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${buttonClass("whatsapp")} min-h-10`}
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    className={`${buttonClass("outline")} min-h-10`}
                    onClick={() => setEditing(c.id)}
                  >
                    Editar
                  </button>
                  {(c.accepts_whatsapp || c.accepts_email) && (
                    <button
                      className={`${buttonClass("outline")} min-h-10`}
                      onClick={() => {
                        if (
                          confirm(
                            `Tirar o consentimento de ${c.name}? Ele deixa de receber ofertas.`,
                          )
                        )
                          act(
                            () =>
                              updateCustomer(c.id, {
                                accepts_whatsapp: false,
                                accepts_email: false,
                              }),
                            "Consentimento removido.",
                          );
                      }}
                    >
                      Tirar consentimento
                    </button>
                  )}
                  <button
                    className={`${buttonClass("outline")} min-h-10`}
                    onClick={() => {
                      if (
                        confirm(
                          `Excluir ${c.name} de vez? Os pedidos ficam, sem a ligação com o cliente.`,
                        )
                      )
                        act(() => deleteCustomer(c.id), "Cliente excluído.");
                    }}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Badge({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 ${on ? "bg-whatsapp text-white" : "bg-surface text-ink-soft line-through"}`}
    >
      {children}
    </span>
  );
}

function EditForm({
  customer,
  onSave,
  onCancel,
}: {
  customer: CustomerRow;
  onSave: (patch: { name: string; phone: string | null; email: string | null }) => void;
  onCancel: () => void;
}) {
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const text = (k: string) => String(d.get(k) ?? "").trim();
    onSave({
      name: text("name"),
      phone: text("phone").replace(/\D/g, "") || null,
      email: text("email") || null,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
      <label className="font-bold">
        Nome
        <input
          name="name"
          required
          minLength={3}
          defaultValue={customer.name}
          className={field}
        />
      </label>
      <label className="font-bold">
        WhatsApp
        <input
          name="phone"
          inputMode="tel"
          defaultValue={customer.phone ?? ""}
          className={field}
        />
      </label>
      <label className="font-bold">
        E-mail
        <input
          name="email"
          type="email"
          defaultValue={customer.email ?? ""}
          className={field}
        />
      </label>
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" className={`${buttonClass()} min-h-10`}>
          Salvar
        </button>
        <button
          type="button"
          className={`${buttonClass("outline")} min-h-10`}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
