import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import useOTStore from '../store/useOTStore';
import useDocumentStore from '../store/useDocumentStore';
import useAuthStore from '../store/useAuthStore';
import { uploadFile } from '@/lib/uploadFile';
import { analyzeDocument } from '@/lib/gemini';
import { logAction } from '@/lib/logAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import DocumentUpload from '@/components/DocumentUpload';
import SignaturePad from '@/components/SignaturePad';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Palette,
  Camera,
  FileSignature,
  CreditCard,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';
import type { OT } from '@/store/types';

const POA_TEXT = `PODER SIMPLE PARA REGISTRO DE MARCA / SIMPLE POWER OF ATTORNEY FOR TRADEMARK REGISTRATION

Yo, el/la suscrito/a (el "Poderdante" / the "Principal"), por medio del presente instrumento otorgo Poder Especial, amplio y suficiente a la firma SPI Americas Ltda. (en adelante, el "Apoderado" / hereinafter the "Attorney"), para que en mi nombre y representación actúe en todos los trámites relacionados con el registro de marca ante el Instituto Nacional de Propiedad Industrial (INAPI) de la República de Chile.

I, the undersigned (the "Principal"), by means of this instrument, grant Special, ample and sufficient Power of Attorney to the firm SPI Americas Ltda. (hereinafter the "Attorney"), to act in my name and on my behalf in all proceedings related to trademark registration before the National Institute of Industrial Property (INAPI) of the Republic of Chile.

FACULTADES OTORGADAS / POWERS GRANTED:

1. Presentar solicitudes de registro de marcas comerciales, de servicio, colectivas o de certificación / File applications for registration of trademarks, service marks, collective marks or certification marks.

2. Responder requerimientos, observaciones y notificaciones formuladas por INAPI / Respond to requirements, observations and notifications issued by INAPI.

3. Interponer recursos administrativos y oposiciones en nombre del Poderdante / File administrative appeals and oppositions on behalf of the Principal.

4. Solicitar renovaciones, modificaciones, traspasos y cualquier otro acto relativo a los registros obtenidos / Request renewals, modifications, transfers and any other act related to registrations obtained.

5. Firmar documentos, escrituras y formularios necesarios para la obtención y mantenimiento del registro / Sign documents, deeds and forms necessary for obtaining and maintaining the registration.

6. Designar abogados y agentes de marcas en caso de que el trámite lo requiera / Appoint attorneys and trademark agents if the proceeding so requires.

VIGENCIA / VALIDITY:
Este Poder tiene vigencia por un período de DOS (2) años contados desde la fecha de su otorgamiento, o hasta la conclusión de todos los trámites para los que fue conferido, lo que ocurra primero.

This Power of Attorney is valid for a period of TWO (2) years from the date of its granting, or until the conclusion of all proceedings for which it was conferred, whichever occurs first.

El Poderdante declara que todos los datos proporcionados son fidedignos y que actúa en conformidad con la legislación vigente de la República de Chile.

The Principal declares that all information provided is accurate and that they act in accordance with the current legislation of the Republic of Chile.

Al firmar digitalmente este documento, el Poderdante acepta todos los términos y condiciones aquí establecidos / By digitally signing this document, the Principal accepts all terms and conditions set forth herein.`;

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
  const updateOTDetails = useOTStore((s) => s.updateOTDetails);
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
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);

  // Section completion state
  const [sec1Done, setSec1Done] = useState(false);
  const [sec2Done, setSec2Done] = useState(false);
  const [sec3Done, setSec3Done] = useState(false);
  const [sec4Done, setSec4Done] = useState(false);

  const initDone = useRef(false);

  // Section 1 form
  const [usesColors, setUsesColors] = useState(false);
  const [pantone, setPantone] = useState('');
  const [brandClass, setBrandClass] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // Section 3 POA
  const [poaScrolled, setPoaScrolled] = useState(false);
  const [poaAccepted, setPoaAccepted] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

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

  // ── One-time init (open/done from prior completion) ────────────────────────
  useEffect(() => {
    if (initDone.current || !ot || docsLoading) return;
    initDone.current = true;

    if (ot.pantone) setPantone(ot.pantone);
    if ((ot as any).brandClass) setBrandClass((ot as any).brandClass);
    if (ot.colors?.length) setUsesColors(true);

    const lDoc = documents.find((d) => d.otId === otId && d.type === 'logo');
    const pDoc = documents.find((d) => d.otId === otId && d.type === 'poder_legal');
    const cDoc = documents.find((d) => d.otId === otId && d.type === 'cedula');

    const s1 = !!(ot.pantone || (ot as any).brandClass);
    const s2 = !!lDoc;
    const s3 = !!pDoc;
    const s4 = !!cDoc;

    setSec1Done(s1);
    setSec2Done(s2);
    setSec3Done(s3);
    setSec4Done(s4);
    if (s4) setIncludeCedula(true);

    setOpen1(!s1);
    setOpen2(s1 && !s2);
    setOpen3(s1 && s2 && !s3);
    setOpen4(false);
  }, [ot, docsLoading, documents, otId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const vaultPoder = checkVaultForReuse('poder_legal');
  const vaultCedula = checkVaultForReuse('cedula');
  const done = [sec1Done, sec2Done, sec3Done].filter(Boolean).length;
  const canSubmit = sec1Done && sec2Done && sec3Done;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveBrand = async () => {
    if (!otId || savingBrand) return;
    setSavingBrand(true);
    try {
      await updateOTDetails(otId, {
        pantone: usesColors && pantone ? pantone : undefined,
        colors: usesColors ? [pantone || 'Sin especificar'] : [],
        ...({ brandClass } as any),
      });
      setSec1Done(true);
      setOpen1(false);
      if (!sec2Done) setOpen2(true);
      toast.success('Información de marca guardada');
    } catch {
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
    } catch {
      toast.error('Error al guardar logotipo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handlePoaScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setPoaScrolled(true);
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    if (!otId || !user || savingSignature) return;
    setSavingSignature(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'poder_simple.png', { type: 'image/png' });

      const url = await uploadFile(file, `ots/${otId}/poder_simple_${Date.now()}.png`);

      const docRef = await addDoc(collection(db, 'documents'), {
        otId,
        clientId: user.uid,
        companyId: user.companyId || '',
        name: 'Poder Simple',
        type: 'poder_legal',
        status: 'validating_ai',
        url,
        uploadedAt: new Date().toISOString(),
        isVaultEligible: true,
      });

      // Fire-and-forget OCR; Cloud Function auto-approves if confidence > 0.85
      analyzeDocument(file, docRef.id, otId).catch((err) =>
        console.error('OCR error on poder:', err)
      );

      await updateOTDetails(otId, { signatureUrl: url } as any);
      await logAction(user.uid, otId, 'Poder simple firmado digitalmente por el cliente');

      setSec3Done(true);
      setShowSignPad(false);
      setOpen3(false);
      toast.success('Firma registrada correctamente');
    } catch {
      toast.error('Error al guardar la firma');
    } finally {
      setSavingSignature(false);
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
    } catch {
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
    } catch {
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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Completar Solicitud PI</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Marca: <span className="text-blue-600 font-black">{ot.brandName || ot.title}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Progreso</span>
          <span className="text-xs font-black text-slate-900">{done}/3 secciones obligatorias</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${(done / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">

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
            {/* Colors toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-slate-800">¿La marca usa colores específicos?</p>
                <p className="text-xs text-slate-400 font-medium">Activa si el diseño tiene colores registrados</p>
              </div>
              <Switch checked={usesColors} onCheckedChange={setUsesColors} />
            </div>

            {/* Pantone (conditional) */}
            {usesColors && (
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
            )}

            {/* Brand class */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Clase de Marca <span className="text-blue-600">*</span>
              </Label>
              <Input
                value={brandClass}
                onChange={(e) => setBrandClass(e.target.value)}
                placeholder="ej. Clase 35 — Publicidad y gestión empresarial"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
              />
            </div>

            <Button
              onClick={handleSaveBrand}
              disabled={savingBrand || !brandClass.trim()}
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
              <Check className="h-4 w-4" /> Poder Simple gestionado
            </div>
          ) : (
            <div className="space-y-5">
              {/* Vault reuse */}
              {vaultPoder && (
                <>
                  <VaultCard
                    label="Poder Legal"
                    onUse={() => handleVaultLink('poder_legal', vaultPoder)}
                    loading={savingVault === 'poder_legal'}
                  />
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">
                      <span className="bg-white px-4">ó firmar uno nuevo</span>
                    </div>
                  </div>
                </>
              )}

              {/* POA text + signing flow */}
              {!showSignPad ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ScrollText className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                      Lee el poder simple completo antes de firmar
                    </p>
                  </div>

                  {/* Scrollable POA */}
                  <div
                    onScroll={handlePoaScroll}
                    className="h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap scroll-smooth"
                  >
                    {POA_TEXT}
                  </div>

                  {!poaScrolled && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      ↓ Desplázate hasta el final para aceptar
                    </p>
                  )}

                  {/* Acceptance checkbox */}
                  <label className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                    poaScrolled
                      ? 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                      : 'border-slate-100 opacity-50 pointer-events-none',
                  )}>
                    <input
                      type="checkbox"
                      checked={poaAccepted}
                      onChange={(e) => setPoaAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      He leído y acepto los términos del Poder Simple. Entiendo que mi firma digital
                      tiene validez legal ante INAPI. / I have read and accept the terms of the
                      Power of Attorney. I understand that my digital signature has legal validity
                      before INAPI.
                    </span>
                  </label>

                  <Button
                    onClick={() => setShowSignPad(true)}
                    disabled={!poaAccepted}
                    className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                    Continuar a Firma Digital
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-700">
                    Firma dentro del recuadro usando el ratón o tu dedo.
                  </p>
                  {savingSignature ? (
                    <div className="flex items-center justify-center py-10 gap-3 text-indigo-600 font-bold text-sm">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Registrando firma y procesando documento...
                    </div>
                  ) : (
                    <SignaturePad
                      onSave={handleSignatureSave}
                      onCancel={() => setShowSignPad(false)}
                    />
                  )}
                </div>
              )}
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
                {done}/3 obligatorias
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
