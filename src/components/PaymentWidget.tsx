import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Gift,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useExchangeRatesStore from '@/store/useExchangeRatesStore';
import type { Document, OT, UserRole } from '@/store/types';

interface PaymentWidgetProps {
  ot: OT;
  comprobante?: Document;
  userRole: UserRole | undefined;
  onUploadClick: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving?: boolean;
}

type Urgency = 'red' | 'amber' | 'green' | 'expired';

function urgencyFor(dateIso: string | undefined): Urgency | null {
  if (!dateIso) return null;
  const ts = Date.parse(dateIso);
  if (isNaN(ts)) return null;
  const days = Math.ceil((ts - Date.now()) / 86_400_000);
  if (days < 0) return 'expired';
  if (days < 2) return 'red';
  if (days <= 5) return 'amber';
  return 'green';
}

function daysUntil(dateIso: string): number {
  return Math.ceil((Date.parse(dateIso) - Date.now()) / 86_400_000);
}

function formatDate(dateIso: string): string {
  try {
    return format(new Date(dateIso), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return dateIso;
  }
}

function formatCurrency(amount: number, currency: string): string {
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

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const urgencyPillClasses: Record<Urgency, string> = {
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
};

function countdownText(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return 'Vence hoy';
  if (d < 0) return `Vencida hace ${Math.abs(d)} día${Math.abs(d) === 1 ? '' : 's'}`;
  return `Vence en ${d} día${d === 1 ? '' : 's'}`;
}

function discountCountdownText(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return 'Último día de descuento';
  if (d === 1) return '1 día para descuento';
  return `${d} días para descuento`;
}

const PaymentWidget = ({
  ot,
  comprobante,
  userRole,
  onUploadClick,
  onApprove,
  onReject,
  approving = false,
}: PaymentWidgetProps) => {
  const { convertToUSD } = useExchangeRatesStore();

  const isAdelanto = ot.stage === 'pago_adelanto';
  const stageLabel = isAdelanto ? 'Adelanto' : 'Cierre';

  const currency = ot.billingCurrency || 'USD';
  const amount = typeof ot.amount === 'number' ? ot.amount : 0;
  const usd = currency === 'USD' ? null : convertToUSD(amount, currency);

  const deadlineUrg = urgencyFor(ot.deadline);
  const discountUrg = urgencyFor(ot.discountDeadline);
  const showDiscount =
    !!ot.discountDeadline &&
    discountUrg !== null &&
    discountUrg !== 'expired';

  const isAdmin = userRole === 'spi-admin';
  const isClient = userRole === 'client';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* Section A — Amount */}
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
          Monto a pagar — {stageLabel}
        </p>
        <p className="text-4xl font-black text-slate-900 tracking-tight">
          {formatCurrency(amount, currency)}
        </p>
        {usd !== null && (
          <p className="text-sm font-semibold text-slate-500 mt-1">
            ≈ {formatUSD(usd)} USD
          </p>
        )}
      </div>

      {/* Section B — Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ot.deadline && deadlineUrg && (
          <div
            className={cn(
              'rounded-xl border p-4',
              urgencyPillClasses[deadlineUrg],
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Fecha límite
              </span>
            </div>
            <p className="font-black text-sm text-slate-900">
              {formatDate(ot.deadline)}
            </p>
            <p className="text-xs font-bold mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {countdownText(ot.deadline)}
            </p>
          </div>
        )}

        {showDiscount && ot.discountDeadline && (
          <div
            className={cn(
              'rounded-xl border p-4',
              discountUrg === 'red'
                ? urgencyPillClasses.amber
                : urgencyPillClasses[discountUrg ?? 'green'],
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Descuento pronto pago
              </span>
            </div>
            <p className="font-black text-sm text-slate-900">
              {formatDate(ot.discountDeadline)}
            </p>
            <p className="text-xs font-bold mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {discountCountdownText(ot.discountDeadline)}
            </p>
            {typeof ot.discountPercentage === 'number' && ot.discountPercentage > 0 && (
              <p className="text-xs font-black mt-2 text-amber-800">
                Ahorra {ot.discountPercentage}% pagando antes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section C — Comprobante */}
      {isClient && <ClientComprobanteSection
        comprobante={comprobante}
        onUploadClick={onUploadClick}
      />}

      {isAdmin && <AdminComprobanteSection
        comprobante={comprobante}
        onApprove={onApprove}
        onReject={onReject}
        approving={approving}
      />}
    </div>
  );
};

function ClientComprobanteSection({
  comprobante,
  onUploadClick,
}: {
  comprobante?: Document;
  onUploadClick: () => void;
}) {
  if (!comprobante) {
    return (
      <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 text-center">
        <p className="font-black text-slate-900 text-base mb-1">
          ¿Ya realizaste el pago?
        </p>
        <p className="text-xs font-semibold text-slate-500 mb-4">
          Subí tu comprobante para que SPI lo valide y avance tu trámite.
        </p>
        <Button
          onClick={onUploadClick}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-6"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir comprobante de pago
        </Button>
      </div>
    );
  }

  if (comprobante.status === 'pending_review') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-amber-700" />
          <span className="text-[10px] font-black uppercase text-amber-800 tracking-widest">
            Comprobante en revisión
          </span>
        </div>
        <ComprobanteMeta comprobante={comprobante} />
        <p className="text-xs font-semibold text-slate-600 mt-3">
          SPI está revisando tu comprobante. Te avisaremos cuando se apruebe.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUploadClick}
          className="mt-3 rounded-lg text-slate-600 font-bold text-xs"
        >
          Subir otro comprobante
        </Button>
      </div>
    );
  }

  if (comprobante.status === 'rejected') {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="h-4 w-4 text-rose-700" />
          <span className="text-[10px] font-black uppercase text-rose-800 tracking-widest">
            Comprobante rechazado
          </span>
        </div>
        <ComprobanteMeta comprobante={comprobante} />
        {comprobante.rejectionReason && (
          <p className="text-xs font-semibold text-rose-900 bg-white rounded-lg px-3 py-2 mt-3 border border-rose-100">
            <strong className="font-black">Motivo:</strong> {comprobante.rejectionReason}
          </p>
        )}
        <Button
          onClick={onUploadClick}
          className="mt-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir nuevo comprobante
        </Button>
      </div>
    );
  }

  if (comprobante.status === 'approved') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">
            Pago aprobado
          </span>
        </div>
        <ComprobanteMeta comprobante={comprobante} />
      </div>
    );
  }

  return null;
}

function AdminComprobanteSection({
  comprobante,
  onApprove,
  onReject,
  approving,
}: {
  comprobante?: Document;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}) {
  if (!comprobante) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-center">
        <p className="text-sm font-bold text-slate-500">
          Aún no se ha subido comprobante.
        </p>
      </div>
    );
  }

  const isImage = comprobante.mimeType?.startsWith('image/');
  const alreadyResolved =
    comprobante.status === 'approved' || comprobante.status === 'rejected';

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-slate-700" />
        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
          Comprobante subido por cliente
        </span>
      </div>

      {/* Preview */}
      {comprobante.url && (
        <div className="rounded-lg overflow-hidden border border-slate-200 bg-white mb-3">
          {isImage ? (
            <a href={comprobante.url} target="_blank" rel="noreferrer" className="block">
              <img
                src={comprobante.url}
                alt={comprobante.fileName || 'Comprobante'}
                className="max-h-64 w-full object-contain"
              />
            </a>
          ) : (
            <a
              href={comprobante.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <ImageIcon className="h-5 w-5 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700 truncate">
                {comprobante.fileName || 'Ver archivo'}
              </span>
            </a>
          )}
        </div>
      )}

      <ComprobanteMeta comprobante={comprobante} />

      {!alreadyResolved && (
        <div className="flex gap-2 mt-4">
          <Button
            onClick={onApprove}
            disabled={approving}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex-1"
          >
            {approving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aprobando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprobar pago
              </>
            )}
          </Button>
          <Button
            onClick={onReject}
            variant="ghost"
            disabled={approving}
            className="rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-black"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
        </div>
      )}

      {comprobante.status === 'approved' && (
        <p className="text-xs font-bold text-emerald-700 mt-3 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Pago aprobado
        </p>
      )}
      {comprobante.status === 'rejected' && (
        <div className="mt-3">
          <p className="text-xs font-bold text-rose-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Comprobante rechazado
          </p>
          {comprobante.rejectionReason && (
            <p className="text-xs text-slate-600 mt-1">
              Motivo: {comprobante.rejectionReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ComprobanteMeta({ comprobante }: { comprobante: Document }) {
  const uploadedAt = comprobante.uploadedAt
    ? format(new Date(comprobante.uploadedAt), "d 'de' MMMM, HH:mm", { locale: es })
    : null;
  const paidOn = comprobante.paymentDate
    ? format(new Date(comprobante.paymentDate), "d 'de' MMMM 'de' yyyy", { locale: es })
    : null;

  return (
    <div className="text-xs font-semibold text-slate-600 space-y-0.5">
      {comprobante.fileName && (
        <p className="truncate">
          <strong className="font-black text-slate-900">Archivo:</strong> {comprobante.fileName}
        </p>
      )}
      {typeof comprobante.amount === 'number' && comprobante.currency && (
        <p>
          <strong className="font-black text-slate-900">Monto declarado:</strong>{' '}
          {formatCurrency(comprobante.amount, comprobante.currency)}
        </p>
      )}
      {paidOn && (
        <p>
          <strong className="font-black text-slate-900">Fecha del pago:</strong> {paidOn}
        </p>
      )}
      {uploadedAt && (
        <p>
          <strong className="font-black text-slate-900">Subido:</strong> {uploadedAt}
        </p>
      )}
      {comprobante.receiptNote && (
        <p className="text-slate-500">
          <strong className="font-black text-slate-900">Nota:</strong> {comprobante.receiptNote}
        </p>
      )}
    </div>
  );
}

export default PaymentWidget;
