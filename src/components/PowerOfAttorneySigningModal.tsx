import { useEffect, useRef, useState } from 'react';
import { db, storage } from '@/lib/firebase';
import {
  doc, getDoc, collection, query, where, getDocs, updateDoc, setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  Eraser,
  Fingerprint,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn, safeDate } from '@/lib/utils';
import { toast } from 'sonner';
import { generatePOAPdf } from '@/lib/generatePOAPdf';
import useAuthStore from '@/store/useAuthStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  otId: string;
  requirementId: string;
  companyId: string;
  onSuccess: (result: { documentUrl: string; expiresAt: string }) => void;
}

type Step = 1 | 2 | 3;

// ── Date helpers ──────────────────────────────────────────────────────────────

function addYears(d: Date, years: number): Date {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + years);
  return r;
}

function formatDMY(d: Date): string {
  return format(d, 'dd/MM/yyyy', { locale: es });
}

// ── Step indicators ────────────────────────────────────────────────────────────

function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-2">
      {([1, 2, 3] as Step[]).map((s) => (
        <div
          key={s}
          className={cn(
            'rounded-full transition-all duration-300',
            s === step
              ? 'w-6 h-2 bg-purple-500'
              : s < step
              ? 'w-2 h-2 bg-purple-300'
              : 'w-2 h-2 bg-slate-700',
          )}
        />
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

const PowerOfAttorneySigningModal = ({
  isOpen,
  onClose,
  otId,
  requirementId,
  companyId,
  onSuccess,
}: Props) => {
  const { user } = useAuthStore();
  const [step, setStep]               = useState<Step>(1);
  const [loadingData, setLoadingData] = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Step 1 form
  const [signerName,   setSignerName]   = useState('');
  const [companyName,  setCompanyName]  = useState('');
  const [domicile,     setDomicile]     = useState('');
  const [city,         setCity]         = useState('');
  const [country,      setCountry]      = useState('');

  // Step 2 signature
  const sigPadRef     = useRef<SignatureCanvas>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const MIN_STROKES = 3;

  const today     = new Date();
  const expiresAt = addYears(today, 5);

  // ── Load company + user data on open ────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !user) return;
    setStep(1);
    setError(null);
    setStrokeCount(0);

    setLoadingData(true);
    (async () => {
      try {
        const [companySnap, userSnap] = await Promise.all([
          getDoc(doc(db, 'companies', companyId)),
          getDoc(doc(db, 'users', user.uid)),
        ]);

        const company = companySnap.data() as any;
        const profile = userSnap.data() as any;

        setCompanyName(company?.name || '');
        setSignerName(profile?.name || profile?.displayName || user.displayName || '');
        const loc = [company?.city, company?.country].filter(Boolean).join(', ');
        setDomicile(loc);
        setCity(company?.city || '');
        setCountry(company?.country || '');
      } catch {
        // Non-fatal: user can fill fields manually
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isOpen, companyId, user]);

  // ── Step 1 → 2 ───────────────────────────────────────────────────────────────

  const canProceedStep1 =
    signerName.trim() && domicile.trim() && city.trim() && country.trim();

  // ── Step 2 helpers ───────────────────────────────────────────────────────────

  const clearSignature = () => {
    sigPadRef.current?.clear();
    setStrokeCount(0);
  };

  const handleStrokeBegin = () => setStrokeCount((n) => n + 1);

  // ── Step 2 → 3 (generate + upload) ──────────────────────────────────────────

  const handleConfirmSignature = async () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
    const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');

    setStep(3);
    setProcessing(true);
    setError(null);

    try {
      const signedAt   = new Date();
      const expiresAtD = addYears(signedAt, 5);
      const documentRef = crypto.randomUUID();

      // 1 — Generate PDF
      const pdfBytes = await generatePOAPdf({
        signerName: signerName.trim(),
        companyName: companyName.trim(),
        domicile:  domicile.trim(),
        city:      city.trim(),
        country:   country.trim(),
        signatureDataUrl,
        documentRef,
        signedAt,
        expiresAt: expiresAtD,
      });

      // 2 — Upload to Firebase Storage
      const pdfBlob    = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const storagePath = `signed-powers/${companyId}/${otId}/${requirementId}_${documentRef}.pdf`;
      const storageRef  = ref(storage, storagePath);
      const snapshot    = await uploadBytes(storageRef, pdfBlob);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // 3 — Update OT requirementsProgress
      await updateDoc(doc(db, 'ots', otId), {
        [`requirementsProgress.${requirementId}`]: {
          completed:   true,
          documentUrl: downloadUrl,
          signedAt:    signedAt.toISOString(),
          signerName:  signerName.trim(),
          expiresAt:   expiresAtD.toISOString(),
          documentRef,
        },
        updatedAt: new Date().toISOString(),
      });

      // 4 — Write to company vault
      await setDoc(doc(collection(db, 'companies', companyId, 'vault'), documentRef), {
        type:         'poder_simple',
        documentUrl:  downloadUrl,
        signedAt:     signedAt.toISOString(),
        signerName:   signerName.trim(),
        expiresAt:    expiresAtD.toISOString(),
        companyId,
        otId,
        requirementId,
        documentRef,
      });

      toast.success(
        `Poder firmado correctamente. El documento tiene vigencia hasta el ${formatDMY(expiresAtD)}.`,
        { duration: 6000 },
      );

      onSuccess({ documentUrl: downloadUrl, expiresAt: expiresAtD.toISOString() });
      onClose();
    } catch (err) {
      console.error('POA signing error:', err);
      const message = err instanceof Error && err.message
        ? `Error al generar el documento: ${err.message}`
        : 'Error al generar el documento. Intenta nuevamente.';
      setError(message);
      setProcessing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !processing && onClose()}>
      <DialogContent className="max-w-lg p-0 rounded-[2rem] bg-[#0B1121] border-slate-800 shadow-2xl shadow-black/60 gap-0">
        <DialogHeader className="px-8 pt-7 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Fingerprint className="h-5 w-5 text-purple-400" />
            </div>
            <DialogTitle className="text-lg font-black text-white tracking-tight">
              Firma de Poder Simple
            </DialogTitle>
          </div>
          <StepDots step={step} />
        </DialogHeader>

        <div className="px-8 pt-5 pb-7">

          {/* ── STEP 1: Datos del poderdante ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Paso 1 de 3 · Información del Poderdante
              </p>

              {loadingData && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Cargando datos de la empresa...
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Nombre del Representante Legal <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Nombre completo"
                    className="bg-slate-900 border-slate-700 text-white h-10 rounded-xl text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Empresa
                  </Label>
                  <Input
                    value={companyName}
                    readOnly
                    className="bg-slate-800/50 border-slate-700 text-slate-400 h-10 rounded-xl text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Domicilio de la empresa <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={domicile}
                    onChange={(e) => setDomicile(e.target.value)}
                    placeholder="Ciudad, País"
                    className="bg-slate-900 border-slate-700 text-white h-10 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Ciudad de firma <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ciudad"
                      className="bg-slate-900 border-slate-700 text-white h-10 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                      País <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="País"
                      className="bg-slate-900 border-slate-700 text-white h-10 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Validity notice */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
                <p className="text-[11px] text-purple-300 font-medium leading-relaxed">
                  Este poder tendrá vigencia de 5 años desde la fecha de firma
                  (hasta <span className="font-black">{formatDMY(expiresAt)}</span>).
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest gap-2 disabled:opacity-50"
              >
                Continuar a firma <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: Firma ── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Paso 2 de 3 · Firma Digital
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver
                </button>
              </div>

              <p className="text-sm font-bold text-slate-300">
                Firme en el recuadro a continuación
              </p>

              {/* Signature canvas */}
              <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner">
                <SignatureCanvas
                  ref={sigPadRef}
                  penColor="black"
                  canvasProps={{ className: 'w-full h-44 bg-white cursor-crosshair' }}
                  onBegin={handleStrokeBegin}
                />
              </div>

              {strokeCount > 0 && strokeCount < MIN_STROKES && (
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Siga firmando... ({strokeCount}/{MIN_STROKES} trazos mínimos)
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSignature}
                  disabled={strokeCount === 0}
                  className="h-9 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest gap-1.5 disabled:opacity-40"
                >
                  <Eraser className="h-3.5 w-3.5" /> Limpiar
                </Button>

                <Button
                  onClick={handleConfirmSignature}
                  disabled={strokeCount < MIN_STROKES}
                  className="flex-1 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest gap-2 disabled:opacity-40"
                >
                  Confirmar firma <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Processing ── */}
          {step === 3 && (
            <div className="py-8 flex flex-col items-center gap-5 animate-in fade-in duration-200">
              {error ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <p className="text-sm font-bold text-rose-400 text-center">{error}</p>
                  <Button
                    onClick={() => {
                      setStep(2);
                      setError(null);
                    }}
                    className="h-10 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Reintentar
                  </Button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                      <Loader2 className="h-7 w-7 text-purple-400 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-black text-white">Generando documento firmado...</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Paso 3 de 3
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PowerOfAttorneySigningModal;

// ── Vault check helper (exported for use in RequirementsChecklist) ─────────────

export interface VaultPower {
  documentRef: string;
  documentUrl: string;
  signedAt: string;
  expiresAt: string;
  signerName: string;
}

export async function checkVaultForActivePower(companyId: string): Promise<VaultPower | null> {
  const now = new Date().toISOString();
  const vaultRef = collection(db, 'companies', companyId, 'vault');
  const q = query(
    vaultRef,
    where('type', '==', 'poder_simple'),
    where('expiresAt', '>', now),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0].data();
  return {
    documentRef: d.documentRef,
    documentUrl: d.documentUrl,
    signedAt:    d.signedAt,
    expiresAt:   d.expiresAt,
    signerName:  d.signerName,
  };
}
