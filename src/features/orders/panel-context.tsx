"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { fetchOrders, fetchStock } from "./api";
import type { Order, StockMap } from "./types";

export type Mode = "simples" | "completo";

const MODE_KEY = "vt-painel-modo";
const modeListeners = new Set<() => void>();

// O aparelho lembra o último modo escolhido (o pai fica no Simples, a irmã no Completo).
function readMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === "completo" ? "completo" : "simples";
  } catch {
    return "simples";
  }
}

function setStoredMode(mode: Mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Sem armazenamento (modo privado): a escolha vale só até recarregar.
  }
  modeListeners.forEach((l) => l());
}

const subscribeMode = (cb: () => void) => {
  modeListeners.add(cb);
  return () => void modeListeners.delete(cb);
};

type Toast = { message: string; undo?: () => Promise<void> };

type PanelData = {
  orders: Order[];
  stock: StockMap;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mode: Mode;
  setMode: (m: Mode) => void;
  notify: (message: string, undo?: () => Promise<void>) => void;
  /** Executa uma ação, atualiza os dados e mostra o erro em português se falhar. */
  run: (
    action: () => Promise<unknown>,
    success: string,
    undo?: () => Promise<void>,
  ) => Promise<void>;
};

export type Run = PanelData["run"];

const Ctx = createContext<PanelData | null>(null);

export const usePanel = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePanel fora do PanelProvider");
  return ctx;
};

const REFRESH_MS = 60_000;

export function PanelProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stock, setStock] = useState<StockMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "simples" as Mode);

  const refresh = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([fetchOrders(), fetchStock()]);
      setOrders(o);
      setStock(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.undo ? 9000 : 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback(
    (message: string, undo?: () => Promise<void>) => setToast({ message, undo }),
    [],
  );

  const run = useCallback<PanelData["run"]>(
    async (action, success, undo) => {
      try {
        await action();
        notify(
          success,
          undo &&
            (async () => {
              await undo();
              await refresh();
            }),
        );
      } catch (e) {
        notify(`Não deu certo: ${e instanceof Error ? e.message : "erro desconhecido"}`);
      }
      await refresh();
    },
    [notify, refresh],
  );

  const value = useMemo(
    () => ({
      orders,
      stock,
      loading,
      error,
      refresh,
      mode,
      setMode: setStoredMode,
      notify,
      run,
    }),
    [orders, stock, loading, error, refresh, mode, notify, run],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-4 rounded-2xl bg-ink px-4 py-3 text-white"
        >
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              className="min-h-11 rounded-full bg-gold px-4 font-bold text-ink"
              onClick={async () => {
                const undo = toast.undo;
                setToast(null);
                await undo?.();
              }}
            >
              Desfazer
            </button>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}
