import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/useAuthStore';
import useOTStore from '@/store/useOTStore';
import useDocumentStore from '@/store/useDocumentStore';
import useProcedureTypeStore from '@/store/useProcedureTypeStore';
import ClientProgressSummary from '@/components/ClientProgressSummary';
import OTDetailsModal from '@/components/OTDetailsModal';
import PowerOfAttorneySigningModal from '@/components/PowerOfAttorneySigningModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Fingerprint,
  FileText,
  DollarSign,
  Clock,
  ArrowRight,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import {
  buildClientActionInbox,
  type ClientActionItem,
  type DeadlineUrgency,
} from '@/lib/clientInbox';
import type { OT } from '@/store/types';

type GroupDef = {
  key: 'signPowers' | 'completeDocs' | 'paymentsPending' | 'paymentsInReview';
  title: string;
  subtitle: string;
  icon: typeof Fingerprint;
  accent: string;
  accentBar: string;
  ctaClass: string;
  ctaLabel: (item: ClientActionItem) => string;
};

const GROUPS: GroupDef[] = [
  {
    key: 'signPowers',
    title: 'Firmar Poderes',
    subtitle: 'Firmás digitalmente el poder simple para que SPI gestione tu trámite.',
    icon: Fingerprint,
    accent: 'text-purple-600',
    accentBar: 'bg-purple-500',
    ctaClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    ctaLabel: () => 'Firmar',
  },
  {
    key: 'completeDocs',
    title: 'Completar Documentación',
    subtitle: 'Subí archivos, completá campos o confirmá requisitos.',
    icon: FileText,
    accent: 'text-blue-600',
    accentBar: 'bg-blue-500',
    ctaClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    ctaLabel: (item) => {
      if (item.actionKind === 'upload') return 'Subir';
      if (item.actionKind === 'fill') return 'Completar';
      if (item.actionKind === 'confirm') return 'Confirmar';
      return 'Completar';
    },
  },
  {
    key: 'paymentsPending',
    title: 'Pagos Pendientes',
    subtitle: 'Revisá el detalle y completá el pago para avanzar.',
    icon: DollarSign,
    accent: 'text-amber-600',
    accentBar: 'bg-amber-500',
    ctaClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    ctaLabel: () => 'Ver detalle de pago',
  },
  {
    key: 'paymentsInReview',
    title: 'Pagos en Revisión',
    subtitle: 'SPI está validando tu comprobante de pago.',
    icon: Clock,
    accent: 'text-indigo-600',
    accentBar: 'bg-indigo-500',
    ctaClass: 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200',
    ctaLabel: () => 'Ver estado',
  },
];

const URGENCY_STYLES: Record<DeadlineUrgency, { pill: string; dot: string; label: (days: number) => string }> = {
  red: {
    pill: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: (d) => (d < 0 ? 'Vencido' : d === 0 ? 'Vence hoy' : d === 1 ? '1 día' : `${d} días`),
  },
  amber: {
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: (d) => `${d} días`,
  },
  green: {
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: (d) => `${d} días`,
  },
};

function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (isNaN(ts)) return null;
  return Math.ceil((ts - Date.now()) / 86_400_000);
}

const ClientInboxPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { ots, loading: otsLoading } = useOTStore();
  const { documents } = useDocumentStore();
  const subscribeToCompanyOTs = useOTStore((s) => s.subscribeToCompanyOTs);
  const subscribeToClientDocuments = useDocumentStore((s) => s.subscribeToClientDocuments);
  const { procedureTypes, subscribeToAll: subscribeToProcedureTypes } = useProcedureTypeStore();

  const [signing, setSigning] = useState<{ otId: string; requirementId: string; companyId: string } | null>(null);
  const [detailsModal, setDetailsModal] = useState<{
    ot: OT;
    defaultTab: 'overview' | 'documents' | 'history';
  } | null>(null);

  useEffect(() => {
    if (!user?.companyId) return;
    const u1 = subscribeToCompanyOTs(user.companyId);
    const u2 = subscribeToClientDocuments(user.uid);
    const u3 = subscribeToProcedureTypes();
    return () => { u1(); u2(); u3(); };
  }, [user, subscribeToCompanyOTs, subscribeToClientDocuments, subscribeToProcedureTypes]);

  const inbox = useMemo(
    () => buildClientActionInbox(ots, documents, procedureTypes),
    [ots, documents, procedureTypes],
  );

  const handleAction = (item: ClientActionItem) => {
    if (item.actionKind === 'sign' && item.requirement) {
      setSigning({
        otId: item.otId,
        requirementId: item.requirement.id,
        companyId: item.ot.companyId,
      });
      return;
    }
    if (item.actionKind === 'upload' || item.actionKind === 'fill' || item.actionKind === 'confirm') {
      navigate(`/client/ot/${item.otId}/completar-v2`);
      return;
    }
    if (item.actionKind === 'pay_pending' || item.actionKind === 'pay_review') {
      setDetailsModal({ ot: item.ot, defaultTab: 'overview' });
    }
  };

  const openOTOverview = (ot: OT) => {
    setDetailsModal({ ot, defaultTab: 'overview' });
  };

  if (otsLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4">
        <Skeleton className="h-32 w-full rounded-[2.5rem] bg-white border border-slate-100 shadow-sm" />
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const greeting = user?.displayName || user?.email?.split('@')[0] || '';
  const isAllClear = inbox.totalCount === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Hero */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Inbox className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Bandeja de Entrada
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {greeting && <span className="mr-2">Hola, {greeting}.</span>}
              {isAllClear
                ? 'Todas tus solicitudes están al día.'
                : `${inbox.totalCount} ${inbox.totalCount === 1 ? 'acción pendiente' : 'acciones pendientes'} en tus solicitudes activas.`}
            </p>
          </div>
        </div>
      </div>

      {/* All-clear state */}
      {isAllClear && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            No tenés acciones pendientes
          </h3>
          <p className="mt-2 text-slate-500 font-medium max-w-md mx-auto">
            Todas tus solicitudes están al día. Te avisaremos apenas haya algo por hacer.
          </p>
          <Link
            to="/client/ots"
            className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            Ver todas mis solicitudes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Action groups */}
      {!isAllClear && (
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const items = inbox[group.key];
            if (items.length === 0) return null;
            const Icon = group.icon;
            return (
              <section
                key={group.key}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="flex">
                  <div className={cn('w-1 shrink-0', group.accentBar)} />
                  <div className="flex-1 min-w-0">
                    {/* Group header */}
                    <header className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <Icon className={cn('h-5 w-5 shrink-0', group.accent)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-black text-slate-900 tracking-tight">
                            {group.title}
                          </h2>
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                            {items.length} {items.length === 1 ? 'pendiente' : 'pendientes'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {group.subtitle}
                        </p>
                      </div>
                    </header>

                    {/* Items */}
                    <ul className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const days = daysUntil(item.deadline);
                        const urgency = item.deadlineUrgency;
                        const urgencyStyle = urgency ? URGENCY_STYLES[urgency] : null;
                        return (
                          <li
                            key={item.id}
                            className="px-6 py-4 hover:bg-slate-50/60 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                  {item.otTitle}
                                </p>
                                {item.companyName && (
                                  <p className="text-xs text-slate-500 font-medium truncate">
                                    {item.companyName}
                                  </p>
                                )}
                                <p className="text-sm text-slate-700 font-medium mt-1">
                                  {item.actionLabel}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => openOTOverview(item.ot)}
                                  className="mt-1 text-xs font-bold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
                                >
                                  Ver orden de trabajo <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {urgencyStyle && days !== null && (
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                                      urgencyStyle.pill,
                                    )}
                                  >
                                    <span className={cn('h-1.5 w-1.5 rounded-full', urgencyStyle.dot)} />
                                    {urgencyStyle.label(days)}
                                  </span>
                                )}
                                <Button
                                  onClick={() => handleAction(item)}
                                  className={cn(
                                    'h-10 px-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-sm gap-2',
                                    group.ctaClass,
                                  )}
                                >
                                  {group.ctaLabel(item)}
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Progress summary */}
      <ClientProgressSummary ots={ots} documents={documents} />

      {/* Footer link */}
      <div className="flex justify-center">
        <Link
          to="/client/ots"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600"
        >
          Ver todas mis solicitudes <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Sign modal */}
      {signing && (
        <PowerOfAttorneySigningModal
          isOpen={!!signing}
          onClose={() => setSigning(null)}
          otId={signing.otId}
          requirementId={signing.requirementId}
          companyId={signing.companyId}
          onSuccess={() => setSigning(null)}
        />
      )}

      {/* Details modal */}
      {detailsModal && (
        <OTDetailsModal
          ot={detailsModal.ot}
          open={!!detailsModal}
          onOpenChange={(open) => { if (!open) setDetailsModal(null); }}
          defaultTab={detailsModal.defaultTab}
        />
      )}
    </div>
  );
};

export default ClientInboxPage;
