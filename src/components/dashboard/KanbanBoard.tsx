/* eslint-disable react/prop-types */
import { useMemo } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

const COLUMNS = [
  { id: 'solicitud', title: 'Solicitud', color: 'border-t-amber-500', chip: 'bg-amber-100 text-amber-700' },
  { id: 'pago_adelanto', title: 'Pago Adelanto', color: 'border-t-sky-500', chip: 'bg-sky-100 text-sky-700' },
  { id: 'gestion', title: 'Gestión', color: 'border-t-indigo-500', chip: 'bg-indigo-100 text-indigo-700' },
  { id: 'pago_cierre', title: 'Pago Cierre', color: 'border-t-purple-500', chip: 'bg-purple-100 text-purple-700' },
  { id: 'finalizado', title: 'Finalizado', color: 'border-t-emerald-500', chip: 'bg-emerald-100 text-emerald-700' },
];

const STAGE_BORDER_COLORS = {
  solicitud: 'border-b-amber-500',
  pago_adelanto: 'border-b-sky-500',
  gestion: 'border-b-indigo-500',
  pago_cierre: 'border-b-purple-500',
  finalizado: 'border-b-emerald-500'
};

const DOT_COLORS = {
  solicitud: 'bg-amber-500',
  pago_adelanto: 'bg-sky-500',
  gestion: 'bg-indigo-500',
  pago_cierre: 'bg-purple-500',
  finalizado: 'bg-emerald-500'
};

export default function KanbanBoard({ userOts, onSelectOt }) {
  const { getTimeStatus } = useData();

  const otsByStage = useMemo(() => {
    const groups = COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: [] }), {});
    userOts.forEach(ot => {
      if (groups[ot.stage]) groups[ot.stage].push(ot);
    });
    return groups;
  }, [userOts]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-180px)] items-start">
      {COLUMNS.map(col => (
        <div key={col.id} className="min-w-[300px] w-[300px] bg-slate-50/80 border border-slate-200/60 rounded-2xl flex flex-col h-full overflow-hidden">
          {/* Column Header */}
          <div className={`px-4 py-3 border-t-4 ${col.color} bg-white flex justify-between items-center shrink-0 shadow-sm`}>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{col.title}</h3>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black", col.chip || "bg-slate-200 text-slate-600")}>
              {otsByStage[col.id].length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {otsByStage[col.id].map(ot => {
               const { discount, surcharge } = getTimeStatus(ot);
               
               return (
                <div 
                  key={ot.id}
                  onClick={() => onSelectOt(ot)}
                  className={cn(
                    "bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer active:scale-[0.99] group border-b-[3px]",
                    STAGE_BORDER_COLORS[ot.stage]
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", DOT_COLORS[ot.stage] || "bg-slate-400")} />
                    <h4 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">
                      {ot.title}
                    </h4>
                  </div>
                  
                  <div className="mb-3">
                    <span className="inline-block bg-slate-50 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-100">
                      {ot.serviceType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                      <Clock size={12} />
                      <span>{new Date(ot.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Urgency Badge */}
                    <div className={cn(
                      "text-[10px] py-0.5 px-2 rounded-full font-bold uppercase tracking-tight",
                      discount > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      surcharge > 0 ? "bg-rose-50 text-rose-600 border border-rose-100" :
                      "bg-slate-50 text-slate-500 border border-slate-100"
                    )}>
                      {discount > 0 ? "🎯 Descuento" : 
                       surcharge > 0 ? "⚠️ Recargo" : "✓ En plazo"}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {otsByStage[col.id].length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <span className="text-xl mb-1 mt-1 font-light">+</span>
                <span className="text-[10px] font-bold uppercase tracking-tight">Sin solicitudes</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
