import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OTStage } from '@/store/types';

const STAGE_CONFIG: Record<OTStage, { label: string; color: string }> = {
  solicitud:    { label: 'Solicitud',    color: 'bg-amber-100 text-amber-800 border-amber-200' },
  pago_adelanto: { label: 'Pago Adelanto', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  gestion:      { label: 'En Gestión',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  pago_cierre:  { label: 'Pago Cierre',  color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  finalizado:   { label: 'Finalizado',   color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

interface OTStatusBadgeProps {
  stage: OTStage;
  dark?: boolean;
}

export const OTStatusBadge = ({ stage, dark }: OTStatusBadgeProps) => {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.solicitud;

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-0.5 text-[9px] uppercase font-black tracking-widest border transition-colors",
        dark
          ? `bg-slate-800/40 border-slate-700 text-white`
          : `${config.color} border-current/10`
      )}
    >
      {config.label}
    </Badge>
  );
};
