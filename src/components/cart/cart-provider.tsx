"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import type { CartLine } from "@/lib/cart/types";
import { MAX_B2C_QUANTITY } from "@/lib/constants";

const STORAGE_KEY = "loom-and-lore:cart:v1";

interface CartSnapshot {
  lines: CartLine[];
  hydrated: boolean;
}

interface CartContextValue {
  lines: CartLine[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  addLine: (line: CartLine) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_SNAPSHOT: CartSnapshot = { lines: [], hydrated: false };

let snapshot: CartSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return (
    (line.kind === "product" || line.kind === "combo") &&
    typeof line.key === "string" &&
    typeof line.name === "string" &&
    typeof line.unitPrice === "number" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

function readStoredLines() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : [];
  } catch {
    return [];
  }
}

function hydrate() {
  if (snapshot.hydrated) return;
  snapshot = { lines: readStoredLines(), hydrated: true };
  for (const listener of listeners) listener();
}

function commit(lines: CartLine[]) {
  snapshot = { lines, hydrated: true };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage may be unavailable in private browsing.
  }
  for (const listener of listeners) listener();
}

function directProductQuantity(lines: CartLine[], productId: string, exceptKey?: string) {
  return lines.reduce((total, line) => {
    if (
      line.kind === "product" &&
      line.productId === productId &&
      line.key !== exceptKey
    ) {
      return total + line.quantity;
    }
    return total;
  }, 0);
}

function allowedQuantity(line: CartLine, lines: CartLine[]) {
  let max = Math.max(0, line.maxQuantity);

  if (line.kind === "product" && line.buyerType === "b2c") {
    const otherQuantity = directProductQuantity(lines, line.productId, line.key);
    max = Math.min(max, Math.max(0, MAX_B2C_QUANTITY - otherQuantity));
  }

  if (line.kind === "combo" && line.buyerType === "b2c") {
    max = Math.min(max, MAX_B2C_QUANTITY);
  }

  return max;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { lines, hydrated } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    hydrate();
  }, []);

  const addLine = useCallback((line: CartLine) => {
    const previous = snapshot.lines;
    const existingIndex = previous.findIndex((item) => item.key === line.key);
    const existing = existingIndex >= 0 ? previous[existingIndex] : null;
    const max = allowedQuantity(existing ?? line, previous);

    if (max <= 0) {
      toast.error("This piece is not available in the quantity you requested.");
      return;
    }

    const proposed = (existing?.quantity ?? 0) + line.quantity;
    const nextQuantity = Math.min(proposed, max);
    const nextLine = { ...line, quantity: nextQuantity };

    commit(
      existingIndex >= 0
        ? previous.map((item, index) => (index === existingIndex ? nextLine : item))
        : [...previous, nextLine],
    );

    if (nextQuantity < line.minQuantity) {
      toast.error(`Minimum order quantity is ${line.minQuantity}.`);
      return;
    }

    if (proposed > max) {
      toast.warning(
        line.buyerType === "b2c"
          ? `You can order up to ${MAX_B2C_QUANTITY} units of this product.`
          : "Only the available stock was added.",
      );
      return;
    }

    toast.success("Added to your bag.");
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    const previous = snapshot.lines;
    const line = previous.find((item) => item.key === key);
    if (!line) return;

    if (quantity <= 0 && line.minQuantity <= 1) {
      commit(previous.filter((item) => item.key !== key));
      return;
    }

    const max = allowedQuantity(line, previous);
    const nextQuantity = Math.max(
      Math.min(line.minQuantity, max),
      Math.min(max, quantity),
    );

    if (quantity < line.minQuantity) {
      toast.error(`Minimum order quantity is ${line.minQuantity}.`);
      return;
    }

    if (quantity > max) {
      toast.error(
        line.buyerType === "b2c"
          ? `You can order up to ${MAX_B2C_QUANTITY} of this product.`
          : "Only the available stock can be added.",
      );
    }

    commit(
      previous.map((item) =>
        item.key === key ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    commit(snapshot.lines.filter((line) => line.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    snapshot = { lines: [], hydrated: true };
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
    for (const listener of listeners) listener();
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = lines.reduce(
      (total, line) => total + line.unitPrice * line.quantity,
      0,
    );

    return {
      lines,
      hydrated,
      itemCount,
      subtotal,
      addLine,
      updateQuantity,
      removeLine,
      clearCart,
    };
  }, [addLine, clearCart, hydrated, lines, removeLine, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
