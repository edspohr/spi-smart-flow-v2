import { LayoutDashboard, TrendingUp, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatUSD } from './torreStyles';

interface Props {
  totalUsd: number;
  activeOTs: number;
  companies: number;
  lastRatesUpdate: Date | null;
}

const OtasKPICard = ({ totalUsd, activeOTs, companies, lastRatesUpdate }: Props) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Torre de Control
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Visibilidad consolidada del pipeline en USD.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Tasas actualizadas
          </p>
          <p className="text-xs font-bold text-slate-300 mt-1">
            {lastRatesUpdate
              ? `hace ${formatDistanceToNow(lastRatesUpdate, { locale: es })}`
              : 'sin registro'}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-950/40 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase text-blue-300 tracking-[0.3em]">
              Dinero en Pipeline
            </span>
            <span
              className="cursor-help"
              title="Suma de montos de todas las OTs no finalizadas, convertidas a USD con las tasas vigentes."
            >
              <Info className="h-3.5 w-3.5 text-slate-500" />
            </span>
          </div>
          <p className="text-6xl font-black text-white tracking-tight tabular-nums">
            {formatUSD(totalUsd, 0)}
          </p>
          <p className="text-sm font-bold text-slate-400 mt-2">
            {activeOTs} órdenes activas · {companies}{' '}
            {companies === 1 ? 'empresa' : 'empresas'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtasKPICard;
