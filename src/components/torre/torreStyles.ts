import type { StageAccentColor } from '@/lib/otasMetrics';

export const ACCENT_CARD: Record<
  StageAccentColor,
  { border: string; bg: string; text: string; bar: string }
> = {
  slate: {
    border: 'border-slate-600/30',
    bg: 'bg-slate-500/5',
    text: 'text-slate-200',
    bar: 'bg-slate-400',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    text: 'text-amber-300',
    bar: 'bg-amber-400',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    text: 'text-blue-300',
    bar: 'bg-blue-400',
  },
  indigo: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/5',
    text: 'text-indigo-300',
    bar: 'bg-indigo-400',
  },
  gray: {
    border: 'border-slate-700/30',
    bg: 'bg-slate-900/40',
    text: 'text-slate-400',
    bar: 'bg-slate-500',
  },
};

export function formatUSD(amount: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function compactUSD(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return formatUSD(amount, 0);
}

export function formatNative(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('es-CO')}`;
  }
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
