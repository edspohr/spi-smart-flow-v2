import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OTStage } from '@/store/types';

const CONFIG: Record<OTStage, { label: string; cls: string }> = {
  solicitud:     { label: 'Solicitud',    cls: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-900/5' },
  pago_adelanto: { label: 'Pago Inicial', cls: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-900/5' },
  gestion:       { label: 'En Gestión',   cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-900/5' },
  pago_cierre:   { label: 'Pago Final',   cls: 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm shadow-purple-900/5' },
  finalizado:    { label: 'Finalizado',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-900/5' },
};

export function OTStatusBadge({
  stage,
  size = 'md',
  dark: _dark,
}: {
  stage: OTStage;
  size?: 'sm' | 'md';
  /** @deprecated kept for backward compatibility, has no effect */
  dark?: boolean;
}) {
  const c = CONFIG[stage] ?? CONFIG.solicitud;
  return (
    <Badge
      className={cn(
        'border font-black uppercase tracking-widest rounded-xl',
        size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-3 py-1',
        c.cls,
      )}
    >
      {c.label}
    </Badge>
  );
}
