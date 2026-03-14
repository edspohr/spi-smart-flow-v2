import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OTStage } from '@/store/types';

const STAGE_CONFIG: Record<OTStage, { label: string; color: string }> = {
  solicitud_recibida:     { label: 'Solicitud',    color: 'bg-amber-100 text-amber-800 border-amber-200' },
  pago_pendiente:         { label: 'Pago Pend.',   color: 'bg-sky-100 text-sky-800 border-sky-200' },
  en_validacion:          { label: 'Validación',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  preparacion_documentos: { label: 'Prep. Doc',    color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  presentacion_entidad:   { label: 'Presentación', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  en_analisis_entidad:    { label: 'En Análisis',  color: 'bg-orange-100 text-orange-800 border-orange-200' },
  concedida:              { label: 'Concedida',    color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  finalizada:             { label: 'Finalizada',   color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

interface OTStatusBadgeProps {
  stage: OTStage;
  dark?: boolean;
}

export const OTStatusBadge = ({ stage, dark }: OTStatusBadgeProps) => {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.solicitud_recibida;
  
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
