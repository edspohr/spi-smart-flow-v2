import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OT } from '@/store/types';
import {
  STAGE_LABELS,
  type StageAccentColor,
  STAGE_ACCENTS,
} from '@/lib/otasMetrics';

type ModalFilter =
  | { kind: 'stage'; stage: string; label: string }
  | { kind: 'client'; companyId: string; companyName: string }
  | { kind: 'stuck' };

interface StageOTsModalProps {
  open: boolean;
  onClose: () => void;
  filter: ModalFilter;
  ots: OT[];
  convertToUSD: (amount: number, currency: string) => number | null;
  onOTClick: (otId: string) => void;
}

const ACCENT_CLASSES: Record<StageAccentColor, string> = {
  slate: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  gray: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function formatUSD(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: decimals,
  }).format(amount);
}

function formatNative(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('es-CO')}`;
  }
}

function daysSinceMoved(ot: OT): number {
  const raw = ot.updatedAt || ot.createdAt;
  if (!raw) return 0;
  const ts = Date.parse(raw);
  if (isNaN(ts)) return 0;
  return Math.max(0, Math.ceil((Date.now() - ts) / 86_400_000));
}

function otTitle(ot: OT): string {
  return ot.brandName || ot.procedureTypeName || ot.title || ot.id.slice(0, 8);
}

function titleFor(filter: ModalFilter): string {
  switch (filter.kind) {
    case 'stage':
      return `Etapa: ${filter.label}`;
    case 'client':
      return filter.companyName;
    case 'stuck':
      return 'OTs frenadas';
  }
}

function subtitleFor(filter: ModalFilter, count: number): string {
  const suffix = count === 1 ? 'OT' : 'OTs';
  switch (filter.kind) {
    case 'stage':
      return `${count} ${suffix} en esta etapa, ordenadas por USD desc.`;
    case 'client':
      return `${count} ${suffix} abiertas de este cliente.`;
    case 'stuck':
      return `${count} ${suffix} sin movimiento en más de 7 días.`;
  }
}

const StageOTsModal = ({
  open,
  onClose,
  filter,
  ots,
  convertToUSD,
  onOTClick,
}: StageOTsModalProps) => {
  const rows = ots
    .map((ot) => {
      const currency = ot.billingCurrency || 'USD';
      const native = typeof ot.amount === 'number' ? ot.amount : 0;
      const usd =
        currency === 'USD'
          ? native
          : convertToUSD(native, currency) ?? native;
      return {
        ot,
        currency,
        native,
        usd,
        days: daysSinceMoved(ot),
      };
    })
    .sort((a, b) => b.usd - a.usd);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl bg-[#0B1121] border-slate-800 text-slate-100 rounded-[2rem] p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-800">
          <DialogTitle className="text-2xl font-black text-white tracking-tight">
            {titleFor(filter)}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium text-sm">
            {subtitleFor(filter, rows.length)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {rows.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 mb-4">
                <Inbox className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm font-black text-slate-400">No hay OTs para mostrar</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0B1121] z-10">
                <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <th className="px-6 py-3 text-left">Cliente</th>
                  <th className="px-3 py-3 text-left">OT</th>
                  {filter.kind !== 'stage' && (
                    <th className="px-3 py-3 text-left">Etapa</th>
                  )}
                  <th className="px-3 py-3 text-right">Monto nativo</th>
                  <th className="px-3 py-3 text-right">USD equiv.</th>
                  <th className="px-3 py-3 text-right">Días</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ ot, currency, native, usd, days }) => {
                  const stageKey = ot.stage as keyof typeof STAGE_LABELS;
                  const accent = STAGE_ACCENTS[stageKey] || 'gray';
                  return (
                    <tr
                      key={ot.id}
                      className="border-t border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-200 truncate max-w-[220px]">
                        {ot.companyName || ot.companyId || '—'}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-slate-300 truncate max-w-[180px]">
                        {otTitle(ot)}
                      </td>
                      {filter.kind !== 'stage' && (
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                              ACCENT_CLASSES[accent],
                            )}
                          >
                            {STAGE_LABELS[stageKey] || ot.stage}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-3.5 text-right font-bold text-slate-300 tabular-nums">
                        {formatNative(native, currency)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-black text-white tabular-nums">
                        {formatUSD(usd)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-slate-400 tabular-nums">
                        {days}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onOTClick(ot.id);
                            onClose();
                          }}
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
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default StageOTsModal;
