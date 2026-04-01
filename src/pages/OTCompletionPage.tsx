import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useOTStore from '../store/useOTStore';
import useDocumentStore from '../store/useDocumentStore';
import useProcedureTypeStore from '../store/useProcedureTypeStore';
import RequirementsChecklist from '@/components/RequirementsChecklist';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const OTCompletionPage = () => {
  const { otId } = useParams<{ otId: string }>();
  const navigate = useNavigate();

  const { ots, updateOTDetails } = useOTStore();
  const ot = ots.find(o => o.id === otId);

  const { procedureTypes, subscribeToAll } = useProcedureTypeStore();
  const procedureType = ot ? procedureTypes.find(p => p.id === ot.procedureTypeId) : undefined;

  const subscribeToCompanyVault = useDocumentStore(s => s.subscribeToCompanyVault);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAll();
    return () => unsub();
  }, [subscribeToAll]);

  useEffect(() => {
    if (!ot?.companyId) return;
    const unsub = subscribeToCompanyVault(ot.companyId);
    return () => unsub();
  }, [ot?.companyId, subscribeToCompanyVault]);

  if (!ot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const requirements = procedureType
    ? [...procedureType.requirements].sort((a, b) => a.order - b.order)
    : [];
  const requiredReqs = requirements.filter(r => r.isRequired);
  const completedRequired = requiredReqs.filter(req => {
    const p = (ot.requirementsProgress || {})[req.id];
    return (
      p?.completed ||
      p?.signedAt ||
      p?.documentUrl ||
      (req.type === 'form_field' && p?.value)
    );
  });
  const progressPct =
    requiredReqs.length === 0
      ? 0
      : Math.round((completedRequired.length / requiredReqs.length) * 100);
  const allDone =
    completedRequired.length === requiredReqs.length && requiredReqs.length > 0;

  const handleSubmit = async () => {
    if (!allDone || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateOTDetails(otId!, {
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      });
      toast.success('Documentación enviada correctamente');
      navigate('/client');
    } catch {
      toast.error('Error al enviar la documentación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-32 animate-fade-in">

      {/* Back button */}
      <button
        onClick={() => navigate('/client')}
        className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest mb-6"
      >
        ← Volver a mis solicitudes
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {ot.brandName || ot.title}
        </h1>
        {procedureType && (
          <p className="text-slate-500 mt-1 font-medium">{procedureType.name}</p>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Progreso de documentación
            </span>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              {completedRequired.length}/{requiredReqs.length} requisitos · {progressPct}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                allDone ? 'bg-emerald-500' : 'bg-blue-600',
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <RequirementsChecklist ot={ot} />
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 shadow-2xl">
        <div className="pl-72 px-10 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Estado de documentación
            </p>
            {allDone ? (
              <p className="text-sm font-black text-emerald-600">Lista para enviar ✓</p>
            ) : (
              <p className="text-sm font-black text-slate-900">
                {completedRequired.length} de {requiredReqs.length} obligatorios completados
              </p>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!allDone || isSubmitting}
            className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
            ) : allDone ? (
              <><Check className="h-4 w-4 mr-2" /> Enviar documentación</>
            ) : (
              'Completar requisitos pendientes'
            )}
          </Button>
        </div>
      </div>

    </div>
  );
};

export default OTCompletionPage;
