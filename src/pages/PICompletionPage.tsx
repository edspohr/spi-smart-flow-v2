import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import useOTStore from '../store/useOTStore';
import useDocumentStore from '../store/useDocumentStore';
import useAuthStore from '../store/useAuthStore';
import { logAction } from '@/lib/logAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ColorPicker from '@/components/ColorPicker';
import DocumentUpload from '@/components/DocumentUpload';
import PowerOfAttorneySigningModal from '@/components/PowerOfAttorneySigningModal';
import SignaturePad from '@/components/SignaturePad';
import { DiscountCountdown } from '@/components/DiscountCountdown';
import { uploadFile } from '@/lib/uploadFile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Palette,
  Camera,
  FileSignature,
  FileText,
  CreditCard,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import type { OT } from '@/store/types';

// ─── SOW placeholder text (TEMPORARY — see /docs/debt/DEBT-019) ─────────────

const SOW_TEXT = `STATEMENT OF WORK (SOW) — TÉRMINOS Y CONDICIONES DE SERVICIO

[ESTE ES UN TEXTO GENÉRICO TEMPORAL — SERÁ REEMPLAZADO POR EL SOW
FORMAL DE SPI AMERICAS UNA VEZ EL EQUIPO LEGAL LO PROVEA]

Por el presente documento, [NOMBRE_REPRESENTANTE], en calidad de
representante legal de [EMPRESA], en adelante "el Cliente", acepta
contratar los servicios profesionales de SERVICIOS DE PROPIEDAD
INDUSTRIAL S.A.S SPI S.A.S., en adelante "SPI", bajo los siguientes
términos:

1. ALCANCE DEL SERVICIO
SPI se compromete a prestar al Cliente los servicios de gestión y
asesoría en propiedad industrial e intelectual relacionados con la
Orden de Trabajo asociada a este SOW. Dichos servicios incluyen, sin
limitarse a, el trámite de registros de marcas, búsquedas de
antecedentes, oposiciones, renovaciones, y cualquier gestión
administrativa o judicial necesaria ante las autoridades competentes.

2. HONORARIOS Y FORMAS DE PAGO
Los honorarios profesionales y costos asociados al trámite serán los
acordados previamente entre las partes y reflejados en la presente
Orden de Trabajo. Los pagos se efectuarán según las condiciones
estipuladas en la misma OT.

3. CONFIDENCIALIDAD
SPI mantendrá en estricta confidencialidad toda la información,
documentación y datos suministrados por el Cliente, salvo que su
divulgación sea requerida por autoridad competente o necesaria para
la prestación del servicio.

4. PROTECCIÓN DE DATOS
El Cliente autoriza a SPI a almacenar, procesar y utilizar sus datos
personales y corporativos exclusivamente para fines relacionados con
la prestación de los servicios objeto de este SOW, en cumplimiento
de la Ley 1581 de 2012 (Colombia) y normativas equivalentes en los
países donde aplique.

5. PLAZOS Y RESPONSABILIDADES DEL CLIENTE
El Cliente se compromete a entregar oportunamente la documentación
e información necesarias para la correcta ejecución del trámite.
SPI no será responsable por demoras o resultados adversos derivados
de la entrega tardía o incompleta de información por parte del Cliente.

6. JURISDICCIÓN
Cualquier controversia derivada de la ejecución de este SOW se
resolverá conforme a la legislación colombiana, salvo que las partes
acuerden lo contrario.

──

STATEMENT OF WORK — TERMS AND CONDITIONS OF SERVICE

[THIS IS A TEMPORARY GENERIC TEXT — IT WILL BE REPLACED BY THE
FORMAL SPI AMERICAS SOW ONCE PROVIDED BY THE LEGAL TEAM]

By this document, [NAME], as legal representative of [COMPANY],
hereinafter "the Client", agrees to engage the professional services
of SERVICIOS DE PROPIEDAD INDUSTRIAL S.A.S SPI S.A.S., hereinafter
"SPI", under the following terms:

1. SCOPE OF SERVICE
SPI commits to providing the Client with intellectual and industrial
property management and advisory services related to the Work Order
associated with this SOW.

2. FEES AND PAYMENT TERMS
Professional fees and associated trademark costs will be those
previously agreed between the parties and reflected in this Work Order.

3. CONFIDENTIALITY
SPI will keep in strict confidentiality all information, documentation,
and data supplied by the Client, unless disclosure is required by
competent authority or necessary for the provision of the service.

4. DATA PROTECTION
The Client authorizes SPI to store, process, and use their personal
and corporate data exclusively for purposes related to the provision
of services under this SOW.

5. CLIENT TIMELINES AND RESPONSIBILITIES
The Client commits to timely delivery of the documentation and
information necessary for the correct execution of the procedure.

6. JURISDICTION
Any controversy arising from the execution of this SOW will be
resolved according to Colombian legislation, unless the parties
agree otherwise.`;

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  done,
  open,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  done: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border shadow-sm transition-all duration-200',
      done ? 'border-emerald-100' : 'border-slate-100',
    )}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-6 text-left"
      >
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', iconBg)}>
          {done
            ? <Check className={cn('h-5 w-5', iconColor)} />
            : <Icon className={cn('h-5 w-5', iconColor)} />}
        </div>
        <span className={cn('flex-1 font-black text-base tracking-tight', done ? 'text-emerald-700' : 'text-slate-900')}>
          {title}
        </span>
        {done && !open && (
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg mr-2">
            Completado
          </span>
        )}
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// ─── Vault reuse card ────────────────────────────────────────────────────────

function VaultCard({
  label,
  onUse,
  loading,
}: { label: string; onUse: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-black text-emerald-900 text-sm">{label} en Bóveda</p>
          <p className="text-xs text-emerald-700/70 font-medium">Documento vigente detectado. ¿Reutilizar?</p>
        </div>
      </div>
      <Button
        onClick={onUse}
        disabled={loading}
        className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shrink-0 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reutilizar'}
      </Button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const PICompletionPage = () => {
  const { otId } = useParams<{ otId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { ots } = useOTStore();
  const {
    documents,
    loading: docsLoading,
    subscribeToClientDocuments,
    subscribeToCompanyVault,
    checkVaultForReuse,
    linkVaultDocument,
  } = useDocumentStore();

  // OT
  const [ot, setOt] = useState<OT | null>(null);

  // Section collapse state
  const [open0, setOpen0] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);

  // Section completion state (sec0 is derived from `sowSigned` below)
  const [sec1Done, setSec1Done] = useState(false);
  const [sec2Done, setSec2Done] = useState(false);
  const [sec3Done, setSec3Done] = useState(false);
  const [sec4Done, setSec4Done] = useState(false);

  // Section 0 — SOW signing state
  const [sowAgreed, setSowAgreed] = useState(false);
  const [sowScrolled, setSowScrolled] = useState(false);
  const [savingSow, setSavingSow] = useState(false);

  const initDone = useRef(false);

  // Section 1 form
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [usesColors, setUsesColors] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [pantone, setPantone] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // Section 3 POA modal
  const [showPOAModal, setShowPOAModal] = useState(false);

  // Section 4 cédula
  const [includeCedula, setIncludeCedula] = useState(false);

  // Vault link loading
  const [savingVault, setSavingVault] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setIsUploadingLogo] = useState(false);
  const [, setIsUploadingCedula] = useState(false);

  // ── Subscriptions ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const u1 = subscribeToClientDocuments(user.uid);
    const u2 = user.companyId ? subscribeToCompanyVault(user.companyId) : () => {};
    return () => { u1(); u2(); };
  }, [user, subscribeToClientDocuments, subscribeToCompanyVault]);

  // ── OT load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const found = ots.find((o) => o.id === otId);
    if (found && !ot) setOt(found);
  }, [ots, otId, ot]);

  // ── Redirect OTs with procedureTypeId to new flow ─────────────────────────
  useEffect(() => {
    if (ot && ot.procedureTypeId) {
      navigate(`/client/ot/${ot.id}/completar-v2`, { replace: true });
    }
  }, [ot, navigate]);

  // ── One-time init (open/done from prior completion) ────────────────────────
  useEffect(() => {
    if (initDone.current || !ot || docsLoading) return;
    initDone.current = true;

    if (ot.brandName) setBrandName(ot.brandName);
    if (ot.description) setDescription(ot.description);
    if (ot.pantone) setPantone(ot.pantone);
    if (ot.colors?.length) {
      setColors(ot.colors);
      setUsesColors(true);
    }

    const lDoc = documents.find((d) => d.otId === otId && d.type === 'logo');
    const pDoc = documents.find((d) => d.otId === otId && d.type === 'poder_legal');
    const cDoc = documents.find((d) => d.otId === otId && d.type === 'cedula');
    const sDoc = documents.find(
      (d) => d.otId === otId && d.type === 'sow' &&
        ['uploaded', 'validated'].includes(d.status),
    );

    const s0 = !!sDoc;
    const s1 = !!(ot.brandName && ot.description);
    const s2 = !!lDoc;
    const s3 = !!pDoc;
    const s4 = !!cDoc;

    setSec1Done(s1);
    setSec2Done(s2);
    setSec3Done(s3);
    setSec4Done(s4);
    if (s4) setIncludeCedula(true);

    // Section 0 (SOW) is the gate — open it if not signed yet, otherwise
    // collapse and reveal the next pending section.
    setOpen0(!s0);
    setOpen1(s0 && !s1);
    setOpen2(s0 && s1 && !s2);
    setOpen3(s0 && s1 && s2 && !s3);
    setOpen4(false);
  }, [ot, docsLoading, documents, otId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const vaultPoder = checkVaultForReuse('poder_legal');
  const vaultCedula = checkVaultForReuse('cedula');

  const sowDoc = documents.find(
    (d) => d.otId === otId && d.type === 'sow' &&
      ['uploaded', 'validated'].includes(d.status),
  );
  const sowSigned = !!sowDoc;

  // Required sections — sec0 (SOW) gates everything else.
  const sec0 = sowSigned;
  const sec1 = sec0 && sec1Done;
  const sec2 = sec0 && sec2Done;
  const sec3 = sec0 && sec3Done;
  const done = [sec0, sec1, sec2, sec3].filter(Boolean).length;
  const canSubmit = sec1 && sec2 && sec3;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveBrand = async () => {
    if (!otId || savingBrand) return;
    setSavingBrand(true);
    try {
      await updateDoc(doc(db, 'ots', otId), {
        brandName:   brandName.trim(),
        description: description.trim(),
        colors:      usesColors ? colors : [],
        pantone:     usesColors ? pantone.trim() : '',
        updatedAt:   new Date().toISOString(),
      });
      setSec1Done(true);
      setOpen1(false);
      if (!sec2Done) setOpen2(true);
      toast.success('Información de marca guardada');
    } catch (err) {
      console.error('[Section 1] Save brand failed:', err);
      toast.error('Error al guardar');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleLogoUploaded = async (url: string) => {
    if (!otId || !user) return;
    setIsUploadingLogo(true);
    try {
      await addDoc(collection(db, 'documents'), {
        otId,
        clientId: user.uid,
        companyId: user.companyId || '',
        name: 'Logotipo',
        type: 'logo',
        status: 'uploaded',
        url,
        uploadedAt: new Date().toISOString(),
        isVaultEligible: false,
      });
      await logAction(user.uid, otId, 'Logotipo cargado por el cliente');
      setSec2Done(true);
      setOpen2(false);
      if (!sec3Done) setOpen3(true);
      toast.success('Logotipo guardado');
    } catch (err) {
      console.error('[Section 2] Logo upload failed:', err);
      toast.error('Error al guardar logotipo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleVaultLink = async (type: 'poder_legal' | 'cedula', vaultDoc: any) => {
    if (!otId || savingVault) return;
    setSavingVault(type);
    try {
      await linkVaultDocument(otId, vaultDoc);
      if (type === 'poder_legal') {
        setSec3Done(true);
        setOpen3(false);
        toast.success('Poder Legal vinculado desde Bóveda');
      } else {
        setSec4Done(true);
        setOpen4(false);
        toast.success('Cédula vinculada desde Bóveda');
      }
    } catch (err) {
      console.error('[Vault link] failed:', err);
      toast.error('Error al vincular documento');
    } finally {
      setSavingVault(null);
    }
  };

  const handleCedulaUploaded = async (url: string) => {
    if (!otId || !user) return;
    setIsUploadingCedula(true);
    try {
      await addDoc(collection(db, 'documents'), {
        otId,
        clientId: user.uid,
        companyId: user.companyId || '',
        name: 'Cédula de Identidad',
        type: 'cedula',
        status: 'uploaded',
        url,
        uploadedAt: new Date().toISOString(),
        isVaultEligible: true,
      });
      await logAction(user.uid, otId, 'Cédula de identidad cargada por el cliente');
      setSec4Done(true);
      setOpen4(false);
      toast.success('Cédula guardada');
    } catch (err) {
      console.error('[Section 4] Cedula upload failed:', err);
      toast.error('Error al guardar cédula');
    } finally {
      setIsUploadingCedula(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !otId || !user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await logAction(user.uid, otId, 'Documentación PI completada y enviada por el cliente');
      toast.success('¡Documentación enviada correctamente!');
      navigate('/client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSowSignature = async (dataUrl: string) => {
    if (!otId || !user || savingSow) return;
    setSavingSow(true);
    try {
      const res  = await fetch(dataUrl);
      const blob = await res.blob();
      const path = `sows/${user.companyId}/${otId}/sow_${Date.now()}.png`;
      const url  = await uploadFile(blob, path);

      await addDoc(collection(db, 'documents'), {
        otId,
        clientId:        user.uid,
        companyId:       user.companyId,
        name:            'Statement of Work (SOW)',
        type:            'sow',
        status:          'uploaded',
        url,
        isVaultEligible: false,
        uploadedAt:      new Date().toISOString(),
      });

      await updateDoc(doc(db, 'ots', otId), {
        sowSignedAt: new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      });

      await logAction(user.uid, otId, 'SOW firmado digitalmente por el cliente');
      toast.success('SOW firmado correctamente');

      setSowAgreed(false);
      setSowScrolled(false);
      setOpen0(false);
      if (!sec1Done) setOpen1(true);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al firmar SOW: ${err?.message ?? 'desconocido'}`);
    } finally {
      setSavingSow(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!ot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-32 animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/client')}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest mb-5 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Tablero
        </button>
        {ot.pipefyCardId && (
          <p className="text-[11px] font-mono font-semibold text-slate-500 tracking-wide">
            OT #{ot.pipefyCardId}
          </p>
        )}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Completar Solicitud PI</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Marca: <span className="text-blue-600 font-black">{ot.brandName || ot.title}</span>
        </p>
      </div>

      {/* Discount countdown banner */}
      <DiscountCountdown ot={ot} variant="banner" className="mb-6" />

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Progreso</span>
          <span className="text-xs font-black text-slate-900">{done} de 4 requeridos completados</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${(done / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">

        {/* ── Section 0: SOW (Statement of Work) ── */}
        <Section
          icon={Lock}
          iconBg={sec0 ? 'bg-emerald-50' : 'bg-slate-100'}
          iconColor={sec0 ? 'text-emerald-600' : 'text-slate-500'}
          title="0. Aceptación del Statement of Work (SOW)"
          done={sec0}
          open={open0}
          onToggle={() => setOpen0((v) => !v)}
        >
          {sec0 && sowDoc ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-black text-emerald-900 text-sm">SOW firmado</p>
                <p className="text-xs text-emerald-700/70 font-medium mt-0.5">
                  Firmado el {(() => {
                    try {
                      return format(new Date(sowDoc.uploadedAt), "dd/MM/yyyy", { locale: es });
                    } catch {
                      return '—';
                    }
                  })()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sowDoc.url && window.open(sowDoc.url, '_blank')}
                className="text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold uppercase tracking-widest"
              >
                <FileText className="h-4 w-4 mr-1" /> Ver documento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">
                Lee con atención los términos del SOW. Debes desplazarte hasta el final del
                texto para poder aceptar y firmar.
              </p>
              <div
                className="max-h-64 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                    setSowScrolled(true);
                  }
                }}
              >
                {SOW_TEXT}
              </div>

              <label className={cn(
                'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                sowScrolled ? 'cursor-pointer border-slate-200 bg-white hover:bg-slate-50' : 'cursor-not-allowed border-slate-100 bg-slate-50/50',
              )}>
                <input
                  type="checkbox"
                  disabled={!sowScrolled}
                  checked={sowAgreed}
                  onChange={(e) => setSowAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className={cn(
                  'text-sm font-medium',
                  sowScrolled ? 'text-slate-800' : 'text-slate-400',
                )}>
                  He leído y acepto los términos y condiciones del SOW
                  {!sowScrolled && (
                    <span className="block text-xs text-slate-400 font-normal mt-0.5">
                      Desplázate hasta el final del texto para habilitar esta casilla.
                    </span>
                  )}
                </span>
              </label>

              {sowAgreed && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Firma digital
                  </p>
                  {savingSow ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando firma...
                    </div>
                  ) : (
                    <SignaturePad
                      onSave={handleSowSignature}
                      onCancel={() => setSowAgreed(false)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Sections 1-4 are blocked until SOW is signed */}
        {!sec0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="text-sm font-medium text-amber-900">
              Debes aceptar y firmar el SOW antes de continuar con la
              documentación de la marca.
            </p>
          </div>
        )}

        <div className={cn(
          'space-y-4 transition-opacity duration-200',
          !sec0 && 'opacity-40 pointer-events-none',
        )}>

        {/* ── Section 1: Información de Marca ── */}
        <Section
          icon={Palette}
          iconBg={sec1Done ? 'bg-emerald-50' : 'bg-amber-50'}
          iconColor={sec1Done ? 'text-emerald-600' : 'text-amber-600'}
          title="1. Información de Marca"
          done={sec1Done}
          open={open1}
          onToggle={() => setOpen1((v) => !v)}
        >
          <div className="space-y-5">
            {/* Brand name */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Nombre comercial de la marca <span className="text-blue-600">*</span>
              </Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ej: FITBIOTIC"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Descripción de productos/servicios <span className="text-blue-600">*</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Suplementos nutricionales y probióticos..."
                rows={3}
                className="rounded-xl border-slate-200 bg-slate-50 font-medium"
              />
            </div>

            {/* Colors toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-slate-800">¿La marca usa colores?</p>
                <p className="text-xs text-slate-400 font-medium">Activa si el diseño tiene colores registrados</p>
              </div>
              <Switch checked={usesColors} onCheckedChange={setUsesColors} />
            </div>

            {/* Color picker + Pantone (conditional) */}
            {usesColors && (
              <>
                <ColorPicker colors={colors} onChange={setColors} />
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Color Pantone (Opcional)
                  </Label>
                  <Input
                    value={pantone}
                    onChange={(e) => setPantone(e.target.value)}
                    placeholder="ej. Pantone 286 C / 19-4052 Classic Blue"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleSaveBrand}
              disabled={savingBrand || !brandName.trim() || !description.trim()}
              className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {savingBrand
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Guardando...</>
                : 'Guardar y Continuar'}
            </Button>
          </div>
        </Section>

        {/* ── Section 2: Logotipo ── */}
        <Section
          icon={Camera}
          iconBg={sec2Done ? 'bg-emerald-50' : 'bg-blue-50'}
          iconColor={sec2Done ? 'text-emerald-600' : 'text-blue-600'}
          title="2. Logotipo de la Marca"
          done={sec2Done}
          open={open2}
          onToggle={() => setOpen2((v) => !v)}
        >
          <div className="space-y-4">
            {sec2Done ? (
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Check className="h-4 w-4" /> Logotipo cargado correctamente
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 font-medium">
                  Sube el archivo de logotipo en alta resolución. Formatos aceptados: PNG, JPG, SVG.
                </p>
                <DocumentUpload
                  documentLabel="Logotipo"
                  storagePath={`ots/${otId}/logo`}
                  onUploadComplete={handleLogoUploaded}
                  accept=".png,.jpg,.jpeg,.svg"
                />
              </>
            )}
          </div>
        </Section>

        {/* ── Section 3: Poder Simple ── */}
        <Section
          icon={FileSignature}
          iconBg={sec3Done ? 'bg-emerald-50' : 'bg-indigo-50'}
          iconColor={sec3Done ? 'text-emerald-600' : 'text-indigo-600'}
          title="3. Poder Simple"
          done={sec3Done}
          open={open3}
          onToggle={() => setOpen3((v) => !v)}
        >
          {sec3Done ? (
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Check className="h-4 w-4" /> Poder Simple gestionado correctamente
            </div>
          ) : (
            <div className="space-y-4">
              {vaultPoder && (
                <VaultCard
                  label="Poder Legal"
                  onUse={() => handleVaultLink('poder_legal', vaultPoder)}
                  loading={savingVault === 'poder_legal'}
                />
              )}
              {vaultPoder && (
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">
                    <span className="bg-white px-4">ó firmar uno nuevo</span>
                  </div>
                </div>
              )}
              <p className="text-sm text-slate-500 font-medium">
                Genera y firma digitalmente el Poder Simple requerido para gestionar tu marca.
                El documento se genera en español e inglés con validez de 5 años.
              </p>
              <Button
                onClick={() => setShowPOAModal(true)}
                className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs gap-2"
              >
                <FileSignature className="h-4 w-4" /> Firmar Poder Simple
              </Button>
            </div>
          )}
        </Section>

        {/* ── Section 4: Cédula (optional) ── */}
        <Section
          icon={CreditCard}
          iconBg={sec4Done ? 'bg-emerald-50' : 'bg-slate-100'}
          iconColor={sec4Done ? 'text-emerald-600' : 'text-slate-500'}
          title="4. Cédula de Identidad (opcional)"
          done={sec4Done}
          open={open4}
          onToggle={() => setOpen4((v) => !v)}
        >
          <div className="space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-bold text-slate-800">Adjuntar cédula de identidad</p>
                <p className="text-xs text-slate-400 font-medium">
                  Recomendado para agilizar la validación de identidad
                </p>
              </div>
              <Switch
                checked={includeCedula}
                onCheckedChange={(v) => {
                  setIncludeCedula(v);
                  if (!v) setSec4Done(false);
                }}
              />
            </div>

            {includeCedula && !sec4Done && (
              <>
                {vaultCedula && (
                  <>
                    <VaultCard
                      label="Cédula"
                      onUse={() => handleVaultLink('cedula', vaultCedula)}
                      loading={savingVault === 'cedula'}
                    />
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100" />
                      </div>
                      <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">
                        <span className="bg-white px-4">ó cargar nueva</span>
                      </div>
                    </div>
                  </>
                )}
                <DocumentUpload
                  documentLabel="Cédula de Identidad"
                  storagePath={`ots/${otId}/cedula`}
                  onUploadComplete={handleCedulaUploaded}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </>
            )}

            {sec4Done && (
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Check className="h-4 w-4" /> Cédula adjuntada correctamente
              </div>
            )}
          </div>
        </Section>
        </div>
      </div>

      {showPOAModal && ot && (
        <PowerOfAttorneySigningModal
          isOpen={showPOAModal}
          onClose={() => setShowPOAModal(false)}
          otId={ot.id}
          requirementId="poa-legacy"
          companyId={user?.companyId || ''}
          onSuccess={() => {
            setShowPOAModal(false);
            setSec3Done(true);
            setOpen3(false);
            toast.success('Poder Simple firmado y guardado correctamente');
          }}
        />
      )}

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-3xl mx-auto px-4 pb-6 pointer-events-auto" style={{ paddingLeft: 'calc(18rem + 1rem)' }}>
          <div className={cn(
            'bg-white border shadow-2xl shadow-slate-900/10 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-300',
            canSubmit ? 'border-blue-100' : 'border-slate-100',
          )}>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Secciones completadas
              </p>
              <p className={cn(
                'text-lg font-black tracking-tight',
                canSubmit ? 'text-blue-600' : 'text-slate-900',
              )}>
                {done}/4 obligatorias
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
              ) : canSubmit ? (
                <><Check className="h-4 w-4 mr-2" /> Enviar Documentación</>
              ) : (
                'Completar secciones requeridas'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PICompletionPage;
