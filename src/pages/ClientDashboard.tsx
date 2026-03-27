import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOTStore from '../store/useOTStore';
import useDocumentStore from '../store/useDocumentStore';
import useAuthStore from '../store/useAuthStore';
import useProcedureTypeStore from '../store/useProcedureTypeStore';
import { OTStatusBadge } from '@/components/OTStatusBadge';
import TimelineStepper from '@/components/dashboard/TimelineStepper';
import RequirementsChecklist from '@/components/RequirementsChecklist';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { cn, safeDate } from '@/lib/utils';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { ots, loading } = useOTStore();
  const { documents } = useDocumentStore();
  const subscribeToCompanyOTs = useOTStore((s) => s.subscribeToCompanyOTs);
  const subscribeToClientDocuments = useDocumentStore((s) => s.subscribeToClientDocuments);
  const subscribeToCompanyVault = useDocumentStore((s) => s.subscribeToCompanyVault);
  const { subscribeToAll: subscribeToProcedureTypes } = useProcedureTypeStore();

  const [expandedOTs, setExpandedOTs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.companyId) return;
    const u1 = subscribeToCompanyOTs(user.companyId);
    const u2 = subscribeToClientDocuments(user.uid);
    const u3 = subscribeToCompanyVault(user.companyId);
    const u4 = subscribeToProcedureTypes();
    return () => { u1(); u2(); u3(); u4(); };
  }, [user, subscribeToCompanyOTs, subscribeToClientDocuments, subscribeToCompanyVault, subscribeToProcedureTypes]);

  const sorted = [...ots].sort((a, b) => {
    const ap = documents.filter(d =>
      d.otId === a.id && (d.status === 'pending' || d.status === 'rejected')).length;
    const bp = documents.filter(d =>
      d.otId === b.id && (d.status === 'pending' || d.status === 'rejected')).length;
    if (ap > 0 && bp === 0) return -1;
    if (bp > 0 && ap === 0) return 1;
    return (safeDate(b.createdAt)?.getTime() || 0) - (safeDate(a.createdAt)?.getTime() || 0);
  });

  const stats = {
    active:    ots.filter(o => o.stage !== 'finalizado').length,
    pending:   documents.filter(d => d.status === 'pending' || d.status === 'rejected').length,
    finalized: ots.filter(o => o.stage === 'finalizado').length,
  };

  const getDocIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'uploaded':
      case 'validating_ai':
      case 'ocr_processed':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'validated':
      case 'vault_matched':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const toggleExpand = (otId: string) =>
    setExpandedOTs(prev => ({ ...prev, [otId]: !prev[otId] }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4">
        <Skeleton className="h-32 w-full rounded-[2.5rem] bg-white border border-slate-100 shadow-sm" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl bg-white border border-slate-100" />
          <Skeleton className="h-24 rounded-2xl bg-white border border-slate-100" />
          <Skeleton className="h-24 rounded-2xl bg-white border border-slate-100" />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Solicitudes</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Hola, {user?.displayName || user?.email?.split('@')[0]}
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Activas</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.active}</p>
        </div>
        <div className={cn(
          'rounded-2xl border shadow-sm p-6 text-center',
          stats.pending > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100',
        )}>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pendientes</p>
          <p className={cn(
            'text-3xl font-black mt-1',
            stats.pending > 0 ? 'text-red-600' : 'text-slate-900',
          )}>
            {stats.pending}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Finalizadas</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.finalized}</p>
        </div>
      </div>

      {/* OT cards */}
      <div className="grid gap-6">
        {sorted.map((ot) => {
          const otDocs = documents.filter(d => d.otId === ot.id);
          const hasPendingDocs = documents.some(d =>
            d.otId === ot.id && (d.status === 'pending' || d.status === 'rejected'));
          const isNew = !!ot.updatedAt &&
            (Date.now() - (safeDate(ot.updatedAt)?.getTime() || 0)) < 172800000;
          const isExpanded = !!expandedOTs[ot.id];

          return (
            <div
              key={ot.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
            >
              {/* ROW 1 — Title + badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">
                    {ot.brandName || ot.title}
                  </h3>
                  {ot.procedureTypeCode && (
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg">
                      {ot.procedureTypeCode} · {ot.procedureTypeName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <OTStatusBadge stage={ot.stage} />
                  {hasPendingDocs && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 animate-pulse text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-0.5">
                      Acción requerida
                    </Badge>
                  )}
                  {isNew && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-0.5">
                      Nuevo
                    </Badge>
                  )}
                </div>
              </div>

              {/* ROW 2 — Timeline */}
              <div className="pb-6">
                <TimelineStepper currentStage={ot.stage} />
              </div>

              {/* ROW 3 — Requirements checklist or doc list */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleExpand(ot.id)}
                  className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  {isExpanded ? (
                    <><ChevronUp className="h-4 w-4" /> Ocultar</>
                  ) : (
                    <>Ver documentos requeridos <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>

                {isExpanded && (
                  <div className="pt-1">
                    {ot.procedureTypeId ? (
                      <RequirementsChecklist ot={ot} />
                    ) : otDocs.length === 0 ? (
                      <p className="text-sm text-slate-400 font-medium py-2">
                        Documentos aún no asignados
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {otDocs.map(d => (
                          <div
                            key={d.id}
                            className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl"
                          >
                            <div className="mt-0.5 shrink-0">{getDocIcon(d.status)}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700">{d.name}</p>
                              {d.status === 'rejected' && (d as any).rejectionReason && (
                                <p className="text-xs text-red-500 font-medium mt-0.5">
                                  {(d as any).rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ROW 4 — CTA */}
              {hasPendingDocs && (
                <div className="pt-2">
                  <Button
                    onClick={() => navigate(`/client/ot/${ot.id}/completar`)}
                    className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-sm shadow-blue-500/20 gap-2"
                  >
                    Completar documentación <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {ots.length === 0 && (
          <div className="text-center py-32 bg-white rounded-2xl border border-slate-100">
            <FileText className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              No tienes solicitudes activas
            </h3>
            <p className="mt-2 text-slate-400 font-medium max-w-xs mx-auto">
              El equipo de SPI cargará tus trámites aquí una vez iniciado el proceso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
