import { useEffect, useState } from 'react';
import useOTStore from '../store/useOTStore';
import useDocumentStore from '../store/useDocumentStore';
import useAuthStore from '../store/useAuthStore';
import { OTStatusBadge } from '@/components/OTStatusBadge';
import TimelineStepper from '@/components/dashboard/TimelineStepper';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  LayoutDashboard,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { ots, loading } = useOTStore();
  const { documents } = useDocumentStore();
  const subscribeToCompanyOTs = useOTStore((s) => s.subscribeToCompanyOTs);
  const subscribeToClientDocuments = useDocumentStore((s) => s.subscribeToClientDocuments);
  const subscribeToCompanyVault = useDocumentStore((s) => s.subscribeToCompanyVault);
  
  const [expandedOTs, setExpandedOTs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.companyId) return;
    const unsubOTs   = subscribeToCompanyOTs(user.companyId);
    const unsubDocs  = subscribeToClientDocuments(user.uid);
    const unsubVault = subscribeToCompanyVault(user.companyId);
    return () => { unsubOTs(); unsubDocs(); unsubVault(); };
  }, [user, subscribeToCompanyOTs, subscribeToClientDocuments, subscribeToCompanyVault]);

  const sortedOTs = [...ots].sort((a, b) => {
    const aPending = documents.filter(d => 
      d.otId === a.id && (d.status === 'pending' || d.status === 'rejected')
    ).length;
    const bPending = documents.filter(d => 
      d.otId === b.id && (d.status === 'pending' || d.status === 'rejected')
    ).length;
    
    if (aPending > 0 && bPending === 0) return -1;
    if (bPending > 0 && aPending === 0) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const stats = {
    active: ots.filter(o => o.stage !== 'finalizado').length,
    pending: documents.filter(d => d.status === 'pending' || d.status === 'rejected').length,
    finalized: ots.filter(o => o.stage === 'finalizado').length
  };

  const getDocIcon = (status: string) => {
    switch (status) {
      case 'pending': 
        return <FileText className="h-4 w-4 text-slate-400" />;
      case 'uploaded':
      case 'validating_ai':
      case 'ocr_processed':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'validated':
      case 'vault_matched':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const toggleExpand = (otId: string) => {
    setExpandedOTs(prev => ({ ...prev, [otId]: !prev[otId] }));
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Skeleton className="h-32 w-full rounded-[2.5rem]" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header & Stats */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mis Solicitudes</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Gestiona tus trámites de propiedad intelectual.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Activas</p>
            <p className="text-2xl font-black text-slate-900">{stats.active}</p>
          </div>
          <div className={cn(
            "px-6 py-4 rounded-3xl border text-center",
            stats.pending > 0 ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"
          )}>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pendientes</p>
            <p className={cn("text-2xl font-black", stats.pending > 0 ? "text-rose-600" : "text-slate-900")}>
              {stats.pending}
            </p>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Finalizadas</p>
            <p className="text-2xl font-black text-slate-900">{stats.finalized}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {sortedOTs.map((ot) => {
          const otDocs = documents.filter(d => d.otId === ot.id);
          const hasPendingDocs = otDocs.some(d => d.status === 'pending' || d.status === 'rejected');
          const isNew = ot.updatedAt && (Date.now() - new Date(ot.updatedAt).getTime()) < 48 * 60 * 60 * 1000;
          const isExpanded = expandedOTs[ot.id];

          return (
            <div 
              key={ot.id}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-200/30"
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <OTStatusBadge stage={ot.stage} />
                      {hasPendingDocs && (
                        <Badge className="bg-rose-100 text-rose-700 border-rose-200 font-black uppercase tracking-widest text-[9px] animate-pulse">
                          Acción requerida
                        </Badge>
                      )}
                      {isNew && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-black uppercase tracking-widest text-[9px]">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{ot.brandName || ot.title}</h2>
                  </div>
                </div>

                <div className="max-w-3xl mx-auto mb-12">
                  <TimelineStepper currentStage={ot.stage} />
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => toggleExpand(ot.id)}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest group"
                  >
                    Ver documentos requeridos
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />}
                  </button>

                  {isExpanded && (
                    <div className="grid gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      {otDocs.map(doc => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-blue-100 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-xl shadow-sm">
                              {getDocIcon(doc.status)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                {doc.status === 'pending' ? 'Pendiente' : doc.status}
                              </p>
                            </div>
                          </div>
                          
                          {doc.status === 'rejected' && (doc as any).rejectionReason && (
                            <div className="flex items-center gap-1 text-rose-500 font-bold text-[10px]" title={(doc as any).rejectionReason}>
                              <AlertCircle className="h-4 w-4" />
                              Rechazado
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {hasPendingDocs && (
                    <div className="pt-4">
                      <Button 
                        onClick={() => navigate(`/client/ot/${ot.id}/completar`)}
                        className="w-full md:w-auto h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 group"
                      >
                        Completar documentación
                        <Check className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {ots.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <LayoutDashboard className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">No tienes solicitudes activas</h3>
            <p className="mt-2 text-slate-400 font-semibold max-w-xs mx-auto">
              Tus trámites aparecerán aquí tan pronto como sean iniciados por el equipo de SPI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
