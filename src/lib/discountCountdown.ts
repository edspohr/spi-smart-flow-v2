import type { OT } from '@/store/types';

export const DISCOUNT_WINDOW_DAYS = 30;
export const DISCOUNT_PERCENTAGE  = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type CountdownStatus = 'active' | 'urgent' | 'critical' | 'earned' | 'lost';

export type CountdownState = {
  status: CountdownStatus;
  msRemaining: number;        // negative if expired
  daysRemaining: number;      // ceil, can be negative
  hoursRemaining: number;     // total hours, ceil
  deadline: Date;
  discountAmount: number;     // currency amount the client saves
  label: string;              // human-readable Spanish label
};

/**
 * Computes the current countdown state for an OT. Pure function.
 * Pass Date.now() result so callers can re-render via setInterval.
 */
export function computeCountdown(ot: OT, now: number = Date.now()): CountdownState {
  const baseAmount     = (ot.amount || 0) + (ot.fees || 0);
  const discountAmount = baseAmount * (DISCOUNT_PERCENTAGE / 100);
  const createdAtMs    = new Date(ot.createdAt).getTime();
  const deadlineMs     = createdAtMs + DISCOUNT_WINDOW_DAYS * MS_PER_DAY;
  const msRemaining    = deadlineMs - now;
  const daysRemaining  = Math.ceil(msRemaining / MS_PER_DAY);
  const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));
  const deadline       = new Date(deadlineMs);

  // Resolved states first
  if (ot.discountStatus === 'earned') {
    return {
      status: 'earned',
      msRemaining: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
      deadline,
      discountAmount,
      label: `Descuento aplicado: ahorraste ${formatCurrency(discountAmount)}`,
    };
  }
  if (ot.discountStatus === 'lost' || (ot.stage === 'finalizado' && msRemaining <= 0)) {
    return {
      status: 'lost',
      msRemaining,
      daysRemaining,
      hoursRemaining,
      deadline,
      discountAmount: 0,
      label: 'Descuento no aplicado',
    };
  }

  // Active states based on time remaining
  if (msRemaining <= 0) {
    return {
      status: 'lost',
      msRemaining,
      daysRemaining,
      hoursRemaining,
      deadline,
      discountAmount: 0,
      label: `Descuento perdido — venció hace ${Math.abs(daysRemaining)} días`,
    };
  }
  if (hoursRemaining <= 24) {
    return {
      status: 'critical',
      msRemaining,
      daysRemaining,
      hoursRemaining,
      deadline,
      discountAmount,
      label: `Quedan ${hoursRemaining}h para conservar el ${DISCOUNT_PERCENTAGE}% (${formatCurrency(discountAmount)})`,
    };
  }
  if (daysRemaining <= 7) {
    return {
      status: 'urgent',
      msRemaining,
      daysRemaining,
      hoursRemaining,
      deadline,
      discountAmount,
      label: `Quedan ${daysRemaining} días para conservar el ${DISCOUNT_PERCENTAGE}% (${formatCurrency(discountAmount)})`,
    };
  }
  return {
    status: 'active',
    msRemaining,
    daysRemaining,
    hoursRemaining,
    deadline,
    discountAmount,
    label: `${daysRemaining} días para conservar el ${DISCOUNT_PERCENTAGE}% de descuento`,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}
