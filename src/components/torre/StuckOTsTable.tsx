import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STAGE_ACCENTS, type StuckOT } from '@/lib/otasMetrics';
import { ACCENT_CARD, formatNative, formatUSD } from './torreStyles';

interface Props {
  stuckOTs: StuckOT[];
  onOTClick: (otId: string) => void;
}

const StuckOTsTable = ({ stuckOTs, onOTClick }: Props) => {
  return (
    <div>
      <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        OTs frenadas (sin movimiento &gt; 7 días)
      </h2>

      {stuckOTs.length === 0 ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl py-14 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm font-black text-emerald-300">
            Ninguna OT frenada. Todo fluye.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-3 py-3 text-left">OT</th>
                <th className="px-3 py-3 text-left">Etapa</th>
                <th className="px-3 py-3 text-right">Monto nativo</th>
                <th className="px-3 py-3 text-right">USD equiv.</th>
                <th className="px-3 py-3 text-right">Días sin mover</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {stuckOTs.map(({ ot, daysStuck, usdEquivalent }) => {
                const stageKey = ot.stage as keyof typeof STAGE_ACCENTS;
                const accent = ACCENT_CARD[STAGE_ACCENTS[stageKey] || 'gray'];
                const currency = ot.billingCurrency || 'USD';
                return (
                  <tr
                    key={ot.id}
                    className="border-t border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-200 truncate max-w-[200px]">
                      {ot.companyName || ot.companyId || '—'}
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-slate-300 truncate max-w-[180px]">
                      {ot.brandName || ot.procedureTypeName || ot.title || '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                          accent.border,
                          accent.bg,
                          accent.text,
                        )}
                      >
                        {stageKey}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-bold text-slate-300 tabular-nums">
                      {formatNative(typeof ot.amount === 'number' ? ot.amount : 0, currency)}
                    </td>
                    <td className="px-3 py-3.5 text-right font-black text-white tabular-nums">
                      {formatUSD(usdEquivalent, 0)}
                    </td>
                    <td className="px-3 py-3.5 text-right font-black text-amber-300 tabular-nums">
                      {daysStuck}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOTClick(ot.id)}
                        className="rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 font-black text-xs"
                      >
                        Ver OT
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StuckOTsTable;
