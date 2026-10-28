"use client";

import { useSyncExternalStore } from "react";
import type { ShippingChoice } from "./shipping";

const STORAGE_KEY = "vertintas-shipping";

let choice: ShippingChoice | undefined | null = null; // null = ainda não lido
const listeners = new Set<() => void>();

function read(): ShippingChoice | undefined {
  if (choice !== null) return choice;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    choice = raw ? (JSON.parse(raw) as ShippingChoice) : undefined;
  } catch {
    choice = undefined;
  }
  return choice;
}

export const useShippingChoice = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
    () => undefined,
  );

export function setShippingChoice(next: ShippingChoice | undefined) {
  choice = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Armazenamento bloqueado: a escolha vale só nesta sessão.
  }
  listeners.forEach((l) => l());
}
