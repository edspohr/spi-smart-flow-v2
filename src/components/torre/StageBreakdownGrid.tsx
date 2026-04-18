import { cn } from '@/lib/utils';
import type { StageMetric } from '@/lib/otasMetrics';
import { ACCENT_CARD, compactUSD } from './torreStyles';

interface Props {
  byStage: StageMetric[];
  onStageClick: (s: StageMetric) => void;
}

const StageBreakdownGrid = ({ byStage, onStageClick }: Props) => {
  return (
    <div>
      <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">
        Distribución por etapa
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {byStage.map((s) => {
          const accent = ACCENT_CARD[s.accentColor];
          return (
            <button
              key={s.stage}
              onClick={() => onStageClick(s)}
              disabled={s.count === 0}
              className={cn(
                'rounded-2xl border p-5 text-left transition-all',
                accent.border,
                accent.bg,
                'hover:border-blue-400/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
              )}
            >
              <p
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest',
                  accent.text,
                )}
              >
                {s.label}
              </p>
              <p className="text-3xl font-black text-white tracking-tight mt-2 tabular-nums">
                {compactUSD(s.usdTotal)}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {s.count} {s.count === 1 ? 'OT' : 'OTs'}
              </p>
              <div className="mt-4 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-700', accent.bar)}
                  style={{ width: `${Math.min(100, s.percentOfPipeline)}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1.5 tabular-nums">
                {s.percentOfPipeline.toFixed(1)}% del pipeline
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StageBreakdownGrid;
