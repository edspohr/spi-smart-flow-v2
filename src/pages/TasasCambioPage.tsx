import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  DollarSign,
  Pencil,
  RefreshCw,
  RotateCcw,
  Wrench,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { cn, safeDate } from '@/lib/utils';
import useExchangeRatesStore from '@/store/useExchangeRatesStore';
import useAuthStore from '@/store/useAuthStore';
import { seedProcedureTypes } from '@/lib/seedProcedureTypes';
import type { ExchangeRate, TrackedCurrency } from '@/store/types';

const TRACKED_CURRENCIES: TrackedCurrency[] = ['USD', 'CLP', 'COP', 'MXN', 'PEN', 'BRL', 'ARS'];

const FLAGS: Record<TrackedCurrency, string> = {
  USD: '🇺🇸',
  CLP: '🇨🇱',
  COP: '🇨🇴',
  MXN: '🇲🇽',
  PEN: '🇵🇪',
  BRL: '🇧🇷',
  ARS: '🇦🇷',
};

const NAMES: Record<TrackedCurrency, string> = {
  USD: 'Dólar Estadounidense',
  CLP: 'Peso Chileno',
  COP: 'Peso Colombiano',
  MXN: 'Peso Mexicano',
  PEN: 'Sol Peruano',
  BRL: 'Real Brasileño',
  ARS: 'Peso Argentino',
};

// Gen 2 Cloud Function URL pattern (same region + project used for deploys).
function triggerUrl(): string {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return `https://us-central1-${projectId}.cloudfunctions.net/triggerExchangeRatesRefresh`;
}

const OPEN_ER_API_URL = 'https://open.er-api.com/v6/latest/USD';

function formatRelative(raw: unknown): string {
  const d = safeDate(raw);
  if (!d) return '—';
  return formatDistanceToNow(d, { locale: es, addSuffix: true });
}

function RateCard({
  currency,
  rate,
  onEdit,
  onRestore,
  restoring,
}: {
  currency: TrackedCurrency;
  rate: ExchangeRate | undefined;
  onEdit: () => void;
  onRestore: () => void;
  restoring: boolean;
}) {
  const isManual = rate?.source === 'manual';
  const hasRate = !!rate;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>{FLAGS[currency]}</span>
          <div>
            <p className="text-lg font-black text-white tracking-tight leading-none">{currency}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {NAMES[currency]}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            'text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border',
            isManual
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          )}
        >
          {isManual ? 'Manual' : 'API'}
        </Badge>
      </div>

      <div className="space-y-1 mb-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Valor por USD
        </p>
        <p className="text-2xl font-black text-white tracking-tight">
          {hasRate ? rate!.perUSD.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '—'}
        </p>
        <p className="text-[10px] font-bold text-slate-500 mt-2">
          Actualizado {formatRelative(rate?.updatedAt)}
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-800 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
        >
          <Pencil className="h-3 w-3 mr-1.5" />
          Editar
        </Button>

        {isManual && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestore}
            disabled={restoring}
            className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
          >
            {restoring ? (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3 mr-1.5" />
            )}
            Restaurar desde API
          </Button>
        )}
      </div>
    </div>
  );
}

export default function TasasCambioPage() {
  const { rates, subscribeToRates, updateRate, restoreRateFromApi } = useExchangeRatesStore();
  const { user } = useAuthStore();

  const [editing, setEditing] = useState<TrackedCurrency | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restoringCurrency, setRestoringCurrency] = useState<string | null>(null);
  const [maintOpen, setMaintOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsub = subscribeToRates();
    return () => unsub();
  }, [subscribeToRates]);

  const lastUpdatedAt = Object.values(rates)
    .map((r) => safeDate((r as ExchangeRate).updatedAt))
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(triggerUrl(), { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const updated = (data.updated || []).length;
      const skipped = (data.skipped || []).length;
      const errors = (data.errors || []).length;

      if (errors > 0) {
        toast.error(`Refresh con errores (${errors}). Actualizadas: ${updated}, omitidas: ${skipped}.`);
      } else {
        toast.success(`Tasas actualizadas: ${updated}. Omitidas (manual): ${skipped}.`);
      }
    } catch (err: any) {
      toast.error(`Error al refrescar: ${err?.message || 'desconocido'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const openEdit = (currency: TrackedCurrency) => {
    const current = rates[currency];
    setEditing(currency);
    setEditValue(current ? String(current.perUSD) : '');
  };

  const closeEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleSaveManual = async () => {
    if (!editing || !user) return;
    const parsed = parseFloat(editValue);
    if (!isFinite(parsed) || parsed <= 0) {
      toast.error('Ingresa un valor numérico mayor a cero.');
      return;
    }
    setSaving(true);
    try {
      await updateRate(editing, parsed, user.uid);
      toast.success(`${editing} sobrescrita manualmente (${parsed}).`);
      closeEdit();
    } catch (err: any) {
      toast.error(`Error al guardar: ${err?.message || 'desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (currency: TrackedCurrency) => {
    setRestoringCurrency(currency);
    try {
      const res = await fetch(OPEN_ER_API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.result !== 'success' || !data.rates) {
        throw new Error(data['error-type'] || 'respuesta inválida');
      }
      const perUSD = currency === 'USD' ? 1 : data.rates[currency];
      if (typeof perUSD !== 'number' || !isFinite(perUSD) || perUSD <= 0) {
        throw new Error('tasa ausente en respuesta de API');
      }
      await restoreRateFromApi(currency, perUSD);
      toast.success(`${currency} restaurada desde API (${perUSD}).`);
    } catch (err: any) {
      toast.error(`Error al restaurar ${currency}: ${err?.message || 'desconocido'}`);
    } finally {
      setRestoringCurrency(null);
    }
  };

  const handleSeedProcedureTypes = async () => {
    setSeeding(true);
    try {
      const initialCount = await countProcedureTypes();
      await seedProcedureTypes();
      const finalCount = await countProcedureTypes();
      if (finalCount > initialCount) {
        toast.success(`Catálogo verificado — ${finalCount} tipos de actuación cargados.`);
      } else {
        toast.success('Catálogo ya inicializado.');
      }
    } catch (err: any) {
      toast.error(`Error al verificar catálogo: ${err?.message || 'desconocido'}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Tasas de Cambio</h1>
          </div>
          <p className="text-sm font-medium text-slate-400 max-w-2xl">
            Conversión a USD para métricas agregadas. Última actualización automática:{' '}
            <span className="text-slate-200 font-bold">{formatRelative(lastUpdatedAt)}</span>.
          </p>
        </div>
        <Button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest px-5 h-11 shadow-lg shadow-blue-900/30"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refrescar ahora
        </Button>
      </div>

      {/* Currency cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRACKED_CURRENCIES.map((currency) => (
          <RateCard
            key={currency}
            currency={currency}
            rate={rates[currency]}
            onEdit={() => openEdit(currency)}
            onRestore={() => handleRestore(currency)}
            restoring={restoringCurrency === currency}
          />
        ))}
      </div>

      {/* Maintenance operations */}
      <div className="mt-10 border border-slate-800 rounded-3xl overflow-hidden">
        <button
          onClick={() => setMaintOpen((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wrench className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Operaciones de mantenimiento
            </span>
          </div>
          {maintOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>
        {maintOpen && (
          <div className="p-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-slate-200">
                  Verificar catálogo de tipos de actuación
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Siembra los 9 tipos de actuación si la colección está vacía. Operación idempotente.
                </p>
              </div>
              <Button
                onClick={handleSeedProcedureTypes}
                disabled={seeding}
                variant="outline"
                className="shrink-0 rounded-xl bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-black uppercase tracking-widest"
              >
                {seeding ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : null}
                Verificar catálogo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Sobrescribir tasa {editing}
            </DialogTitle>
            <DialogDescription>
              El valor manual no será sobrescrito por la actualización automática diaria. Para volver a usar la API, elimina el override con "Restaurar desde API".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="perUSD">
              {editing} por 1 USD
            </Label>
            <Input
              id="perUSD"
              type="number"
              step="any"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Ej: 950.12"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveManual} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Guardar override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Lightweight size check — avoids re-running seed when catalog already populated
async function countProcedureTypes(): Promise<number> {
  const snap = await getDocs(collection(db, 'procedureTypes'));
  return snap.size;
}
