/* eslint-disable react/prop-types */
import { useMemo } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

const COLUMNS = [
  { id: 'solicitud', title: 'Solicitud' },
  { id: 'pago_adelanto', title: 'Pago Adelanto', color: 'bg-blue-50 border-blue-200' },
  { id: 'gestion', title: 'Gestión Documentos', color: 'bg-orange-50 border-orange-200' },
  { id: 'pago_cierre', title: 'Pago Cierre', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'finalizado', title: 'Finalizado' },
];

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
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] items-start">
      {COLUMNS.map(col => (
        <div key={col.id} className="min-w-[280px] w-full max-w-[320px] bg-slate-100/50 rounded-xl p-3 border border-slate-200/60 flex flex-col h-full">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">{col.title}</h3>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {otsByStage[col.id].map(ot => {
               const { label, discount, surcharge } = getTimeStatus(ot);
               
               return (
                <div 
                  key={ot.id}
                  onClick={() => onSelectOt(ot)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-accent transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Status Strip */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    ot.stage === 'finalizado' ? 'bg-green-500' : 'bg-accent'
                  }`}></div>

                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-accent transition-colors">
                    {ot.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Clock size={12} />
                    <span>Creado: {new Date(ot.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Urgency Badge */}
                  {ot.stage !== 'finalizado' && (
                     <div className={`text-xs py-1 px-2 rounded-md font-medium inline-block mb-2 ${
                       discount > 0 ? 'bg-green-100 text-green-700' :
                       surcharge > 0 ? 'bg-red-100 text-red-700' : 
                       'bg-slate-100 text-slate-600'
                     }`}>
                       {discount > 0 ? `🔥 10% Descuento disponible` : 
                        surcharge > 0 ? `⚠️ Recargo aplicado` : label}
                     </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                     <span className="text-xs font-semibold text-slate-400">
                       ID: {ot.id.split('-')[1]}
                     </span>
                     <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                       Ver detalle →
                     </span>
                  </div>
                </div>
              );
            })}
            
            {otsByStage[col.id].length === 0 && (
              <div className="text-center py-8 text-slate-300 italic text-sm border-2 border-dashed border-slate-200 rounded-lg">
                Vacío
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
