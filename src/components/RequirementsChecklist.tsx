import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useProcedureTypeStore from '@/store/useProcedureTypeStore';
import type { OT, Requirement } from '@/store/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Circle,
  FileText,
  Fingerprint,
  Type,
  CheckSquare,
  Upload,
  PenLine,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { cn, safeDate } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PowerOfAttorneySigningModal, { checkVaultForActivePower, type VaultPower } from './PowerOfAttorneySigningModal';

interface RequirementsChecklistProps {
  ot: OT;
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Progreso de documentación
        </span>
        <span className={cn(
          'text-[10px] font-black uppercase tracking-widest',
          pct === 100 ? 'text-emerald-600' : 'text-slate-500',
        )}>
          {value}/{total} · {pct}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : 'bg-blue-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Single requirement row ─────────────────────────────────────────────────────

interface RowProps {
  req:           Requirement;
  progress:      any;
  otId:          string;
  companyId:     string;
  onToggle:      (reqId: string, completed: boolean) => void;
  onFieldSave:   (reqId: string, value: string) => void;
  onOpenSigning: (reqId: string) => void;
  onUseVault:    (reqId: string, vaultPower: VaultPower) => void;
}

function RequirementRow({
  req, progress, companyId,
  onToggle, onFieldSave, onOpenSigning, onUseVault,
}: RowProps) {
  const [fieldValue,   setFieldValue]   = useState(progress?.value || '');
  const [vaultPower,   setVaultPower]   = useState<VaultPower | null>(null);
  const [vaultChecked, setVaultChecked] = useState(false);
  const [showVaultBar, setShowVaultBar] = useState(false);
  const [usingVault,   setUsingVault]   = useState(false);

  const isCompleted = !!progress?.completed || !!progress?.signedAt || !!progress?.documentUrl;

  // Check vault only once for digital_signature requirements
  useEffect(() => {
    if (req.type !== 'digital_signature' || isCompleted || vaultChecked || !companyId) return;
    setVaultChecked(true);
    checkVaultForActivePower(companyId).then((found) => {
      if (found) {
        setVaultPower(found);
        setShowVaultBar(true);
      }
    });
  }, [req.type, isCompleted, vaultChecked, companyId]);

  const handleUseVault = async () => {
    if (!vaultPower) return;
    setUsingVault(true);
    try {
      onUseVault(req.id, vaultPower);
    } finally {
      setUsingVault(false);
    }
  };

  const iconEl = (() => {
    switch (req.type) {
      case 'digital_signature':     return <Fingerprint className="h-4 w-4 text-purple-500" />;
      case 'document_upload':       return <FileText    className="h-4 w-4 text-blue-500" />;
      case 'form_field':            return <Type        className="h-4 w-4 text-amber-500" />;
      case 'checkbox_confirmation': return <CheckSquare className="h-4 w-4 text-emerald-500" />;
    }
  })();

  return (
    <div className={cn(
      'p-4 rounded-2xl border transition-all',
      isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-slate-200',
    )}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {isCompleted
            ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            : <Circle       className="h-5 w-5 text-slate-300" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {iconEl}
            <p className={cn(
              'text-sm font-bold leading-snug',
              isCompleted ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-slate-800',
            )}>
              {req.label}
            </p>
            {req.isRequired && !isCompleted && (
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider shrink-0">*Req.</span>
            )}
          </div>

          {req.description && !isCompleted && (
            <p className="text-xs text-slate-400 font-medium mb-2">{req.description}</p>
          )}

          {/* ── checkbox_confirmation ── */}
          {req.type === 'checkbox_confirmation' && !isCompleted && (
            <Button
              size="sm"
              onClick={() => onToggle(req.id, true)}
              className="h-8 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider mt-1"
            >
              Confirmar
            </Button>
          )}

          {/* ── form_field — pending ── */}
          {req.type === 'form_field' && !isCompleted && (
            <div className="flex gap-2 mt-2">
              <Input
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder={req.placeholder || ''}
                className="h-8 text-xs bg-slate-50 border-slate-200 rounded-xl flex-1"
                onBlur={() => { if (fieldValue.trim()) onFieldSave(req.id, fieldValue.trim()); }}
              />
              <Button
                size="sm"
                onClick={() => { if (fieldValue.trim()) onFieldSave(req.id, fieldValue.trim()); }}
                disabled={!fieldValue.trim()}
                className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider"
              >
                Guardar
              </Button>
            </div>
          )}

          {/* ── form_field — done ── */}
          {req.type === 'form_field' && isCompleted && (
            <p className="text-xs font-bold text-emerald-700 mt-1 bg-emerald-100 rounded-lg px-2 py-1 inline-block">
              {progress?.value}
            </p>
          )}

          {/* ── document_upload — pending ── */}
          {req.type === 'document_upload' && !isCompleted && (
            <div className="flex items-center gap-2 mt-2">
              <Upload className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400">
                {req.acceptedFormats?.join(', ') || 'PDF'} · Sube el documento en la sección Completar Solicitud
              </span>
            </div>
          )}

          {/* ── digital_signature — Smart Vault alert ── */}
          {req.type === 'digital_signature' && !isCompleted && showVaultBar && vaultPower && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-xs font-bold text-emerald-800 leading-snug">
                  Esta empresa ya tiene un poder vigente, firmado el{' '}
                  {(() => { const d = safeDate(vaultPower.signedAt); return d ? format(d, 'd MMM yyyy', { locale: es }) : 'N/D'; })()}
                  {' '}con vigencia hasta{' '}
                  {(() => { const d = safeDate(vaultPower.expiresAt); return d ? format(d, 'd MMM yyyy', { locale: es }) : 'N/D'; })()}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleUseVault}
                  disabled={usingVault}
                  className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider"
                >
                  {usingVault ? 'Aplicando...' : 'Usar poder existente'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowVaultBar(false)}
                  className="h-7 px-3 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-[10px] font-black uppercase tracking-wider"
                >
                  Firmar nuevo poder
                </Button>
              </div>
            </div>
          )}

          {/* ── digital_signature — sign button (no vault or vault dismissed) ── */}
          {req.type === 'digital_signature' && !isCompleted && !showVaultBar && (
            <Button
              size="sm"
              onClick={() => onOpenSigning(req.id)}
              className="mt-2 h-8 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider gap-2"
            >
              <PenLine className="h-3.5 w-3.5" /> Firmar Poder
            </Button>
          )}

          {/* ── digital_signature — completed summary ── */}
          {req.type === 'digital_signature' && isCompleted && (
            <div className="mt-1 space-y-1">
              {progress?.signerName && (
                <p className="text-xs font-bold text-emerald-700">
                  Firmado por {progress.signerName}
                </p>
              )}
              {progress?.expiresAt && (
                <p className="text-[10px] font-bold text-emerald-600">
                  {(() => { const d = safeDate(progress.expiresAt); return d ? `Vigencia hasta ${format(d, 'd MMM yyyy', { locale: es })}` : ''; })()}
                </p>
              )}
              {progress?.documentUrl && (
                <a
                  href={progress.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest mt-0.5"
                >
                  Ver documento <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const RequirementsChecklist = ({ ot }: RequirementsChecklistProps) => {
  const { procedureTypes } = useProcedureTypeStore();
  const procedureType = procedureTypes.find((p) => p.id === ot.procedureTypeId);

  const [signingReqId, setSigningReqId] = useState<string | null>(null);

  if (!procedureType) return null;

  const requirements = [...(procedureType.requirements || [])].sort((a, b) => a.order - b.order);
  const progress     = ot.requirementsProgress || {};

  const completedRequired = requirements.filter((r) => {
    if (!r.isRequired) return false;
    const p = progress[r.id];
    return !!p?.completed || !!p?.signedAt || !!p?.documentUrl || (r.type === 'form_field' && !!p?.value);
  }).length;

  const totalRequired = requirements.filter((r) => r.isRequired).length;

  // ── Firestore update helpers ─────────────────────────────────────────────────

  const updateProgress = async (reqId: string, data: Record<string, any>) => {
    try {
      await updateDoc(doc(db, 'ots', ot.id), {
        [`requirementsProgress.${reqId}`]: data,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleToggle = (reqId: string, completed: boolean) => {
    updateProgress(reqId, { completed });
    if (completed) toast.success('Confirmado');
  };

  const handleFieldSave = (reqId: string, value: string) => {
    updateProgress(reqId, { completed: true, value });
    toast.success('Guardado');
  };

  const handleUseVault = async (reqId: string, vaultPower: VaultPower) => {
    await updateProgress(reqId, {
      completed:   true,
      documentUrl: vaultPower.documentUrl,
      signedAt:    vaultPower.signedAt,
      signerName:  vaultPower.signerName,
      expiresAt:   vaultPower.expiresAt,
      documentRef: vaultPower.documentRef,
    });
    toast.success('Poder existente vinculado correctamente');
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={completedRequired} total={totalRequired} />

      <div className="space-y-2">
        {requirements.map((req) => (
          <RequirementRow
            key={req.id}
            req={req}
            progress={progress[req.id]}
            otId={ot.id}
            companyId={ot.companyId}
            onToggle={handleToggle}
            onFieldSave={handleFieldSave}
            onOpenSigning={(reqId) => setSigningReqId(reqId)}
            onUseVault={handleUseVault}
          />
        ))}
      </div>

      {/* POA Signing Modal */}
      {signingReqId && (
        <PowerOfAttorneySigningModal
          isOpen
          onClose={() => setSigningReqId(null)}
          otId={ot.id}
          requirementId={signingReqId}
          companyId={ot.companyId}
          onSuccess={() => setSigningReqId(null)}
        />
      )}
    </div>
  );
};

export default RequirementsChecklist;
