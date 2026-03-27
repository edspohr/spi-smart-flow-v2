import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convierte de forma segura un valor a Date.
 * Acepta: Firestore Timestamp (con .toDate()), string ISO, number, Date.
 * Devuelve null si el valor es inválido o nulo.
 */
export function safeDate(raw: unknown): Date | null {
  if (!raw) return null;
  if (typeof (raw as any).toDate === 'function') return (raw as any).toDate();
  const d = new Date(raw as any);
  return isNaN(d.getTime()) ? null : d;
}
