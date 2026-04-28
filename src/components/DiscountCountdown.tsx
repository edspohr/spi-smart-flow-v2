import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import {
  computeCountdown,
  type CountdownState,
  type CountdownStatus,
} from '@/lib/discountCountdown';
import type { OT } from '@/store/types';
import { cn } from '@/lib/utils';

interface Props {
  ot: OT;
  variant?: 'compact' | 'banner';
  className?: string;
}

type StyleConfig = {
  bg: string;
  border: string;
  iconColor: string;
  textTitle: string;
  textBody: string;
  icon: typeof Clock;
  title: string;
};

const STYLES: Record<CountdownStatus, StyleConfig> = {
  active: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-700',
    textTitle: 'text-blue-900',
    textBody: 'text-blue-800',
    icon: Clock,
    title: 'Descuento del 10% disponible',
  },
  urgent: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-700',
    textTitle: 'text-amber-900',
    textBody: 'text-amber-800',
    icon: Clock,
    title: 'Descuento por vencer',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-700',
    textTitle: 'text-red-900',
    textBody: 'text-red-800',
    icon: Zap,
    title: '¡Última oportunidad!',
  },
  earned: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-700',
    textTitle: 'text-emerald-900',
    textBody: 'text-emerald-800',
    icon: CheckCircle2,
    title: 'Descuento aplicado',
  },
  lost: {
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    iconColor: 'text-slate-500',
    textTitle: 'text-slate-700',
    textBody: 'text-slate-600',
    icon: AlertCircle,
    title: 'Descuento no aplicado',
  },
};

export function DiscountCountdown({ ot, variant = 'compact', className }: Props) {
  const [state, setState] = useState<CountdownState>(() => computeCountdown(ot));

  useEffect(() => {
    // Don't tick if already resolved
    if (state.status === 'earned' || state.status === 'lost') return;
    // Tick every minute (perceptible at the hour boundary, cheap on render)
    const interval = setInterval(() => {
      setState(computeCountdown(ot));
    }, 60_000);
    return () => clearInterval(interval);
  }, [ot, state.status]);

  const styles = STYLES[state.status];
  const Icon = styles.icon;

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'rounded-2xl border p-4 flex items-center gap-3',
          styles.bg,
          styles.border,
          className,
        )}
      >
        <Icon className={cn('w-5 h-5 shrink-0', styles.iconColor)} />
        <div className="flex-1">
          <p className={cn('text-sm font-semibold', styles.textTitle)}>{styles.title}</p>
          <p className={cn('text-xs', styles.textBody)}>{state.label}</p>
        </div>
      </div>
    );
  }

  // compact variant — pill badge
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border',
        'text-[11px] font-semibold',
        styles.bg,
        styles.border,
        styles.textBody,
        state.status === 'critical' && 'animate-pulse',
        className,
      )}
    >
      <Icon className={cn('w-3 h-3 shrink-0', styles.iconColor)} />
      <span>{state.label}</span>
    </div>
  );
}

export default DiscountCountdown;
