import { useEffect, useState } from 'react';
import useProcedureTypeStore from '@/store/useProcedureTypeStore';
import type { OT, Document } from '@/store/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface Props {
  ots: OT[];
  documents: Document[];
}

const ClientProgressSummary = ({ ots, documents }: Props) => {
  const { procedureTypes } = useProcedureTypeStore();

  const activeOTs = ots.filter(o => o.stage !== 'finalizado');
  const finalizedCount = ots.filter(o => o.stage === 'finalizado').length;

  // Calculate totals across all active OTs
  let totalRequired = 0;
  let totalCompleted = 0;
  let pendingDocs = 0;

  activeOTs.forEach(ot => {
    if (ot.procedureTypeId) {
      const pt = procedureTypes.find(p => p.id === ot.procedureTypeId);
      if (pt) {
        const reqs = pt.requirements?.filter(r => r.isRequired) || [];
        const prog = ot.requirementsProgress || {};
        totalRequired += reqs.length;
        reqs.forEach(r => {
          const p = prog[r.id];
          const done = p?.completed || p?.signedAt || p?.documentUrl || (r.type === 'form_field' && p?.value);
          if (done) totalCompleted++;
          else pendingDocs++;
        });
      }
    } else {
      // Fallback: count pending/rejected documents
      const otPending = documents.filter(d =>
        d.otId === ot.id && (d.status === 'pending' || d.status === 'rejected')
      ).length;
      pendingDocs += otPending;
    }
  });

  const overallPct = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

  // Discount deadline
  const now = Date.now();
  let nextDiscountDeadline: string | null = null;
  let daysUntilDiscount: number | null = null;

  activeOTs.forEach(ot => {
    if (ot.discountDeadline) {
      const dl = new Date(ot.discountDeadline).getTime();
      if (dl > now) {
        if (!nextDiscountDeadline || dl < new Date(nextDiscountDeadline).getTime()) {
          nextDiscountDeadline = ot.discountDeadline;
          daysUntilDiscount = Math.ceil((dl - now) / 86400000);
        }
      }
    }
  });

  // SVG progress ring params
  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (overallPct / 100) * circumference;
  const ringColor = overallPct === 100 ? 'stroke-emerald-500' : 'stroke-blue-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="grid grid-cols-4 gap-6 items-center">
        {/* Progress Ring */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-20 h-20">
            <svg width={80} height={80} className="-rotate-90">
              <circle
                cx={40}
                cy={40}
                r={normalizedRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-slate-100"
              />
              <circle
                cx={40}
                cy={40}
                r={normalizedRadius}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn(ringColor, 'transition-all duration-700')}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-slate-900">{overallPct}%</span>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">
            Avance
          </span>
        </div>

        {/* Active OTs */}
        <div className="flex flex-col items-center text-center">
          <TrendingUp className="h-5 w-5 text-blue-500 mb-1" />
          <p className="text-2xl font-black text-slate-900">{activeOTs.length}</p>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Solicitudes activas
          </span>
          {finalizedCount > 0 && (
            <span className="text-[9px] font-bold text-emerald-600 mt-0.5">
              {finalizedCount} finalizada{finalizedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Pending docs */}
        <div className="flex flex-col items-center text-center">
          <FileText className={cn('h-5 w-5 mb-1', pendingDocs > 0 ? 'text-amber-500' : 'text-emerald-500')} />
          <p className={cn('text-2xl font-black', pendingDocs > 0 ? 'text-amber-600' : 'text-slate-900')}>
            {pendingDocs}
          </p>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {pendingDocs === 1 ? 'Documento pendiente' : 'Documentos pendientes'}
          </span>
        </div>

        {/* Discount countdown */}
        <div className="flex flex-col items-center text-center">
          {daysUntilDiscount != null ? (
            <>
              <Clock className={cn(
                'h-5 w-5 mb-1',
                daysUntilDiscount <= 2 ? 'text-rose-500' :
                daysUntilDiscount <= 5 ? 'text-amber-500' :
                'text-emerald-500',
              )} />
              <p className={cn(
                'text-2xl font-black',
                daysUntilDiscount <= 2 ? 'text-rose-600 animate-pulse' :
                daysUntilDiscount <= 5 ? 'text-amber-600' :
                'text-emerald-600',
              )}>
                {daysUntilDiscount}
              </p>
              <span className={cn(
                'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg',
                daysUntilDiscount <= 2 ? 'bg-rose-50 text-rose-600' :
                daysUntilDiscount <= 5 ? 'bg-amber-50 text-amber-600' :
                'text-slate-400',
              )}>
                {daysUntilDiscount === 1 ? 'Día para descuento' : 'Días para descuento'}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-slate-300 mb-1" />
              <p className="text-2xl font-black text-slate-300">—</p>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">
                Descuento
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProgressSummary;
