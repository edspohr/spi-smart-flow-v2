import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OTStage } from '@/store/types';

const CONFIG: Record<OTStage, { label: string; cls: string }> = {
  solicitud:     { label: 'Solicitud',    cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  pago_adelanto: { label: 'Pago Inicial', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  gestion:       { label: 'En Gestión',   cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  pago_cierre:   { label: 'Pago Final',   cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  finalizado:    { label: 'Finalizado',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
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
        'border font-black uppercase tracking-widest rounded-lg',
        size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-3 py-1',
        c.cls,
      )}
    >
      {c.label}
    </Badge>
  );
}
