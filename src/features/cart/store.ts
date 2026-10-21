"use client";

import { useSyncExternalStore } from "react";
import { addLine, setQty, type CartLine } from "./cart";

const STORAGE_KEY = "vertintas-cart";
const EMPTY: CartLine[] = [];

let lines: CartLine[] | undefined;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (lines) return lines;
  try {
    lines = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartLine[];
  } catch {
    lines = [];
  }
  return lines;
}

function write(next: CartLine[]) {
  lines = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Armazenamento bloqueado: o carrinho vale só nesta sessão.
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export const cartActions = {
  add: (line: CartLine) => write(addLine(read(), line)),
  setQty: (key: string, qty: number) => write(setQty(read(), key, qty)),
  clear: () => write([]),
};
