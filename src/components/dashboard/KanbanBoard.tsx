/* eslint-disable react/prop-types */
import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { differenceInDays } from 'date-fns';
import { OTStage } from '../../store/types';

const COLUMNS: { id: OTStage; title: string; color: string; chip: string }[] = [
  { id: 'solicitud',     title: 'Solicitud',     color: 'border-t-amber-500',   chip: 'bg-amber-100 text-amber-700' },
  { id: 'pago_adelanto', title: 'Pago Adelanto',  color: 'border-t-sky-500',     chip: 'bg-sky-100 text-sky-700' },
  { id: 'gestion',       title: 'En Gestión',     color: 'border-t-blue-500',    chip: 'bg-blue-100 text-blue-700' },
  { id: 'pago_cierre',   title: 'Pago Cierre',    color: 'border-t-indigo-500',  chip: 'bg-indigo-100 text-indigo-700' },
  { id: 'finalizado',    title: 'Finalizado',     color: 'border-t-emerald-500', chip: 'bg-emerald-100 text-emerald-700' },
];

const STAGE_BORDER_COLORS: Record<OTStage, string> = {
  solicitud:     'border-b-amber-500',
  pago_adelanto: 'border-b-sky-500',
  gestion:       'border-b-blue-500',
  pago_cierre:   'border-b-indigo-500',
  finalizado:    'border-b-emerald-500',
};

const DOT_COLORS: Record<OTStage, string> = {
  solicitud:     'bg-amber-500',
  pago_adelanto: 'bg-sky-500',
  gestion:       'bg-blue-500',
  pago_cierre:   'bg-indigo-500',
  finalizado:    'bg-emerald-500',
};

interface KanbanBoardProps {
  onOTClick: (ot: any) => void;
  ots: any[];
}

function getTimeStatus(ot: any) {
  const now = new Date();
  const start = new Date(ot.createdAt);
  const daysElapsed = differenceInDays(now, start);
  let discount = 0;
  let surcharge = 0;
  if (daysElapsed <= 30) discount = 10;
  else if (daysElapsed > 90) surcharge = 10;
  return { discount, surcharge, daysElapsed };
}

export function KanbanBoard({ ots, onOTClick }: KanbanBoardProps) {
  const otsByStage = useMemo(() => {
    const groups: Record<string, any[]> = COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: [] }), {});
    ots.forEach((ot: any) => {
      if (groups[ot.stage]) groups[ot.stage].push(ot);
    });
    return groups;
  }, [ots]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-220px)] items-start scrollbar-hide">
      {COLUMNS.map(col => (
        <div key={col.id} className="min-w-[280px] w-[280px] bg-slate-900/40 border border-slate-800 rounded-[2rem] flex flex-col h-full overflow-hidden backdrop-blur-sm">
          {/* Column Header */}
          <div className={`px-5 py-4 border-t-4 ${col.color} bg-slate-900/60 flex justify-between items-center shrink-0 border-b border-slate-800/50`}>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{col.title}</h3>
            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black leading-none", col.chip || "bg-slate-800 text-slate-500")}>
              {otsByStage[col.id].length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {otsByStage[col.id].map((ot: any) => {
               const { discount, surcharge } = getTimeStatus(ot);

               return (
                <div
                  key={ot.id}
                  onClick={() => onOTClick(ot)}
                  className={cn(
                    "bg-slate-900/60 p-4 rounded-[1.5rem] border border-slate-800/80 shadow-sm hover:shadow-blue-500/10 hover:border-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98] group border-b-[3px]",
                    STAGE_BORDER_COLORS[ot.stage as OTStage]
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]", DOT_COLORS[ot.stage as OTStage] || "bg-slate-400")} />
                    <h4 className="font-black text-white text-xs uppercase leading-tight tracking-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {ot.title || ot.brandName || 'Sin título'}
                    </h4>
                  </div>

                  <div className="mb-4">
                    <span className="inline-block bg-slate-800/50 text-slate-500 font-black text-[8px] uppercase px-2 py-1 rounded-lg border border-slate-700/50 tracking-widest">
                      {ot.serviceType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                      <Clock size={10} />
                      <span>{ot.createdAt ? new Date(ot.createdAt).toLocaleDateString() : '—'}</span>
                    </div>

                    <div className={cn(
                      "text-[8px] py-0.5 px-2 rounded-lg font-black uppercase tracking-widest",
                      discount > 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      surcharge > 0 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                      "bg-slate-800 text-slate-600 border border-slate-700"
                    )}>
                      {discount > 0 ? "Bono" :
                       surcharge > 0 ? "Recargo" : "En Fecha"}
                    </div>
                  </div>
                </div>
              );
            })}

            {otsByStage[col.id].length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 text-slate-700 border-2 border-dashed border-slate-800/50 rounded-2xl bg-slate-900/20">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Vacío</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
