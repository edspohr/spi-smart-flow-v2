import { useState, useEffect } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OTStatusBadge } from "./OTStatusBadge";
import {
  FileText,
  MessageSquare,
  Activity,
  Calendar,
  User,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  ChevronDown,
  Fingerprint,
} from "lucide-react";
import useOTStore from "../store/useOTStore";
import useDocumentStore from "../store/useDocumentStore";
import useAuthStore from "../store/useAuthStore";
import useProcedureTypeStore from "../store/useProcedureTypeStore";
import { logAction } from "../lib/logAction";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, safeDate } from "@/lib/utils";
import { toast } from "sonner";
import { OTStage, Log, DocumentVersion } from "../store/types";
import PaymentWidget from "./PaymentWidget";
import UploadComprobanteModal from "./UploadComprobanteModal";
import RejectComprobanteModal from "./RejectComprobanteModal";
import { ConfirmDialog } from "./ConfirmDialog";

interface OTDetailsModalProps {
  ot: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'overview' | 'documents' | 'history';
  scrollToRequirementId?: string;
}

const STAGE_ORDER: OTStage[] = [
  'solicitud', 'pago_adelanto', 'gestion', 'pago_cierre', 'finalizado',
];
const STAGE_LABELS: Record<OTStage, string> = {
  solicitud: 'Solicitud', pago_adelanto: 'Pago Inicial',
  gestion: 'En Gestión',  pago_cierre: 'Pago Final',
  finalizado: 'Finalizado',
};

const OTDetailsModal = ({ ot, open, onOpenChange, defaultTab = 'overview', scrollToRequirementId }: OTDetailsModalProps) => {
  const { updateOTStage, updateOTDetails } = useOTStore();
  const { documents, updateDocumentStatus, getDocumentVersions, reviewComprobantePago } = useDocumentStore();
  const { user } = useAuthStore();
  const { procedureTypes } = useProcedureTypeStore();
  const procedureType = procedureTypes.find((p) => p.id === ot.procedureTypeId);
  const [internalNotes, setInternalNotes] = useState(ot.internalNotes || "");
  const [internalNote, setInternalNote] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null); // docId
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [otLogs, setOtLogs] = useState<Log[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<string | null>(null); // docId
  const [versions, setVersions] = useState<Record<string, DocumentVersion[]>>({}); // docId → versions
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isApproving, setIsApproving] = useState<Record<string, boolean>>({});
  const [uploadComprobanteOpen, setUploadComprobanteOpen] = useState(false);
  const [rejectComprobanteDocId, setRejectComprobanteDocId] = useState<string | null>(null);
  const [approveComprobanteOpen, setApproveComprobanteOpen] = useState(false);
  const [approvingComprobante, setApprovingComprobante] = useState(false);

  const nextStage = (() => {
    const i = STAGE_ORDER.indexOf(ot.stage);
    return i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
  })();

  useEffect(() => {
    setInternalNotes(ot.internalNotes || "");
  }, [ot]);

  useEffect(() => {
    if (!open) {
      setOtLogs([]);
      setExpandedVersions(null);
      setVersions({});
      return;
    }
    const q = query(
      collection(db, 'logs'),
      where('otId', '==', ot.id),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setOtLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Log)));
    });
    return unsub;
  }, [open, ot.id]);

  useEffect(() => {
    if (!open || !scrollToRequirementId || defaultTab !== 'documents') return;
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-requirement-id="${scrollToRequirementId}"]`,
      );
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2', 'transition-shadow');
      const fadeTimer = setTimeout(() => {
        el.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2');
      }, 2000);
      (el as HTMLElement & { _spiFadeTimer?: number })._spiFadeTimer = fadeTimer as unknown as number;
    }, 150);
    return () => clearTimeout(timer);
  }, [open, scrollToRequirementId, defaultTab, ot.id]);

  const otDocuments = documents.filter((d) => d.otId === ot.id);

  const currentPaymentType: 'adelanto' | 'cierre' | null =
    ot.stage === 'pago_adelanto' ? 'adelanto' :
    ot.stage === 'pago_cierre' ? 'cierre' : null;

  const comprobantePagoDoc = (() => {
    if (!currentPaymentType) return undefined;
    const matches = otDocuments.filter(
      (d) => d.type === 'comprobante_pago' && d.paymentType === currentPaymentType,
    );
    if (matches.length === 0) return undefined;
    return matches.sort((a, b) => {
      const ta = Date.parse(a.uploadedAt || '') || 0;
      const tb = Date.parse(b.uploadedAt || '') || 0;
      return tb - ta;
    })[0];
  })();

  const handleApproveComprobante = async () => {
    if (!comprobantePagoDoc) return;
    setApprovingComprobante(true);
    try {
      await reviewComprobantePago(comprobantePagoDoc.id, { status: 'approved' });
      toast.success('Pago aprobado — OT avanzará automáticamente');
      setApproveComprobanteOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al aprobar el comprobante');
    } finally {
      setApprovingComprobante(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateOTDetails(ot.id, { internalNotes });
      toast.success("Notas guardadas correctamente");
    } catch (error) {
      toast.error("Error al guardar notas");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleApproveDoc = async (docId: string) => {
    setIsApproving(prev => ({ ...prev, [docId]: true }));
    try {
      await updateDocumentStatus(docId, 'validated');

      // Sync with requirementsProgress if this doc matches a requirement
      const approvedDoc = otDocuments.find(d => d.id === docId);
      if (approvedDoc && procedureType && ot.requirementsProgress) {
        const matchingReq = procedureType.requirements.find(req => {
          const prog = (ot.requirementsProgress || {})[req.id];
          return prog?.documentUrl === approvedDoc.url || req.id === approvedDoc.type;
        });
        if (matchingReq) {
          const { updateOTDetails } = useOTStore.getState();
          await updateOTDetails(ot.id, {
            [`requirementsProgress.${matchingReq.id}.completed`]: true,
          } as any);
        }
      }

      toast.success('Documento aprobado');
    } catch {
      toast.error('Error al aprobar el documento');
    } finally {
      setIsApproving(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleRejectDoc = async () => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      await updateDocumentStatus(rejectTarget, 'rejected', rejectReason || 'No cumple los requisitos');

      // Sync with requirementsProgress if this doc matches a requirement
      const rejectedDoc = otDocuments.find(d => d.id === rejectTarget);
      if (rejectedDoc && procedureType && ot.requirementsProgress) {
        const matchingReq = procedureType.requirements.find(req => {
          const prog = (ot.requirementsProgress || {})[req.id];
          return prog?.documentUrl === rejectedDoc.url || req.id === rejectedDoc.type;
        });
        if (matchingReq) {
          const { updateOTDetails } = useOTStore.getState();
          await updateOTDetails(ot.id, {
            [`requirementsProgress.${matchingReq.id}.completed`]: false,
            [`requirementsProgress.${matchingReq.id}.documentUrl`]: null,
          } as any);
        }
      }

      toast.info('Documento rechazado');
      setRejectTarget(null);
      setRejectReason("");
    } catch {
      toast.error('Error al rechazar el documento');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleToggleVersions = async (docId: string) => {
    if (expandedVersions === docId) {
      setExpandedVersions(null);
      return;
    }
    setExpandedVersions(docId);
    if (!versions[docId]) {
      try {
        const v = await getDocumentVersions(docId);
        setVersions((prev) => ({ ...prev, [docId]: v }));
      } catch {
        setVersions((prev) => ({ ...prev, [docId]: [] }));
      }
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] bg-white border-slate-200/60 p-0 overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="p-8 pb-0 flex flex-row justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <OTStatusBadge stage={ot.stage} size="sm" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OT: {ot.id.substring(0, 10)}</span>
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {ot.brandName || ot.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalle completo de la orden de trabajo seleccionada
            </DialogDescription>
          </div>

        </DialogHeader>

        <Tabs defaultValue={defaultTab} key={`${ot?.id}-${defaultTab}`} className="flex-1 flex flex-col mt-6 min-h-0">
          <TabsList className="px-8 bg-transparent border-b border-slate-100 h-14 gap-8 shrink-0">
            <TabsTrigger value="overview" className="bg-transparent text-slate-400 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 px-0 h-14 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all">Resumen</TabsTrigger>
            <TabsTrigger value="documents" className="bg-transparent text-slate-400 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 px-0 h-14 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all">Documentación ({otDocuments.length})</TabsTrigger>
            <TabsTrigger value="history" className="bg-transparent text-slate-400 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 px-0 h-14 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all">Historial</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0 p-8">
            <TabsContent value="overview" className="mt-0 space-y-8">
              {currentPaymentType && (
                <PaymentWidget
                  ot={ot}
                  comprobante={comprobantePagoDoc}
                  userRole={user?.role}
                  onUploadClick={() => setUploadComprobanteOpen(true)}
                  onApprove={() => setApproveComprobanteOpen(true)}
                  onReject={() => comprobantePagoDoc && setRejectComprobanteDocId(comprobantePagoDoc.id)}
                  approving={approvingComprobante}
                />
              )}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Client Info */}
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                       <User size={14} className="text-blue-600" /> Información del Cliente
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                        <span className="text-xs font-bold text-slate-500">Empresa</span>
                        <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Building2 size={14} className="text-slate-400" /> {ot.companyId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                        <span className="text-xs font-bold text-slate-500">Usuario ID</span>
                        <span className="text-xs font-mono font-bold text-slate-600">{ot.clientId}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                        <span className="text-xs font-bold text-slate-500">Apertura</span>
                        <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                           <Calendar size={14} className="text-slate-400" /> {(() => { const d = safeDate(ot.createdAt); return d ? format(d, "d MMMM, yyyy", { locale: es }) : 'N/A'; })()}
                        </span>
                      </div>
                      {ot.projectName && (
                        <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-500">Proyecto</span>
                          <span className="text-sm font-black text-slate-900">{ot.projectName}</span>
                        </div>
                      )}
                      {ot.procedureCountry && (
                        <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-500">País del Trámite</span>
                          <span className="text-sm font-black text-slate-900">{ot.procedureCountry}</span>
                        </div>
                      )}
                      {ot.contactLanguage && (
                        <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-500">Idioma</span>
                          <span className="text-sm font-black text-slate-900">
                            {ot.contactLanguage === 'es' ? 'Español' : ot.contactLanguage === 'en' ? 'English' : 'Português'}
                          </span>
                        </div>
                      )}
                      {ot.billingCurrency && (
                        <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-500">Moneda</span>
                          <span className="text-sm font-black text-slate-900">{ot.billingCurrency}</span>
                        </div>
                      )}
                      {ot.paymentTerms && (
                        <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-500">Términos de Pago</span>
                          <span className="text-sm font-black text-slate-900">{ot.paymentTerms}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                       <MessageSquare size={14} className="text-amber-600" /> Detalles Técnicos
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Clase</p>
                          <p className="text-sm font-black text-slate-900 uppercase">{ot.brandClass || "Pendiente"}</p>
                       </div>
                       <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Pantone</p>
                          <p className="text-sm font-black text-slate-900">{ot.pantone || "N/A"}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Internal Notes */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
                  <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                     <FileText size={14} className="text-teal-600" /> Notas Internas (Privado)
                  </h3>
                  <Textarea 
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Espacio para bitácora interna, seguimientos manuales o recordatorios del equipo SPI..."
                    className="flex-1 bg-white border-slate-200 text-slate-900 rounded-2xl resize-none p-6 font-medium text-sm focus:ring-teal-500/20 shadow-inner min-h-[120px]"
                  />
                  <Button 
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                  >
                    {isSavingNotes ? "Guardando..." : "Actualizar Bitácora Interna"}
                  </Button>
                </div>
              </div>
              {/* ── Financial summary ── */}
              {(ot.amount || ot.fees || ot.basicCharges || ot.officialFees) && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                    Resumen Financiero
                  </h3>
                  <div className="space-y-3">
                    {ot.amount != null && ot.amount > 0 && (
                      <div className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">Honorarios</span>
                        <span className="text-sm font-black text-slate-900">{ot.billingCurrency || '$'} {ot.amount.toLocaleString()}</span>
                      </div>
                    )}
                    {ot.basicCharges != null && ot.basicCharges > 0 && (
                      <div className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">Cargos Básicos</span>
                        <span className="text-sm font-black text-slate-900">{ot.billingCurrency || '$'} {ot.basicCharges.toLocaleString()}</span>
                      </div>
                    )}
                    {ot.officialFees != null && ot.officialFees > 0 && (
                      <div className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">Tasas Oficiales</span>
                        <span className="text-sm font-black text-slate-900">{ot.billingCurrency || '$'} {ot.officialFees.toLocaleString()}</span>
                      </div>
                    )}
                    {ot.fees != null && ot.fees > 0 && (
                      <div className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">Fees</span>
                        <span className="text-sm font-black text-slate-900">{ot.billingCurrency || '$'} {ot.fees.toLocaleString()}</span>
                      </div>
                    )}
                    {ot.discountPercentage != null && ot.discountPercentage > 0 && (
                      <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                        <span className="text-xs font-bold text-emerald-700">Descuento</span>
                        <span className="text-sm font-black text-emerald-700">{ot.discountPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* ── Requirements progress (if procedure type configured) ── */}
              {procedureType && ot.requirementsProgress && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Fingerprint size={14} className="text-purple-600" /> Requisitos del Trámite — {procedureType.name}
                  </h3>
                  <div className="space-y-2">
                    {[...(procedureType.requirements || [])].sort((a, b) => a.order - b.order).map((req) => {
                      const prog = (ot.requirementsProgress || {})[req.id];
                      const isCompleted = !!prog?.completed || !!prog?.signedAt || !!prog?.documentUrl || (req.type === 'form_field' && !!prog?.value);
                      return (
                        <div
                          key={req.id}
                          className={cn(
                            'flex items-center justify-between px-4 py-3 rounded-2xl border text-xs',
                            isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100',
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isCompleted
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              : <Clock className="h-4 w-4 text-slate-300 shrink-0" />}
                            <span className={cn('font-bold truncate', isCompleted ? 'text-emerald-700' : 'text-slate-600')}>
                              {req.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            {req.type === 'digital_signature' && isCompleted && (
                              <span className="text-[10px] font-bold text-emerald-700">
                                ✅ Poder firmado — {prog?.signedAt ? (() => { const d = safeDate(prog.signedAt); return d ? format(d, 'd/MM/yyyy', { locale: es }) : '—'; })() : '—'}
                                {' '}— vigencia hasta {prog?.expiresAt ? (() => { const d = safeDate(prog.expiresAt); return d ? format(d, 'd/MM/yyyy', { locale: es }) : '—'; })() : '—'}
                              </span>
                            )}
                            {prog?.documentUrl && (
                              <a
                                href={prog.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                              >
                                Ver documento <ExternalLink size={10} />
                              </a>
                            )}
                            {req.type === 'form_field' && prog?.value && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                                {prog.value}
                              </span>
                            )}
                            {!isCompleted && (
                              <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Pendiente</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {otDocuments.map((doc) => (
                   <div key={doc.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] group transition-all shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FileText size={24} />
                        </div>
                        <Badge className={cn(
                          "px-3 py-1 text-[8px] font-bold uppercase tracking-widest shadow-none",
                          doc.status === 'validated' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          doc.status === 'rejected' ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {doc.status}
                        </Badge>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-slate-800 mb-1 uppercase tracking-tight">{doc.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Tipo: {doc.type || "Desconocido"}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                          className="bg-white border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl hover:bg-slate-50 shadow-sm"
                        >
                          Visualizar <ExternalLink size={12} className="ml-1" />
                        </Button>

                        {doc.status !== 'validated' && (
                          <Button
                            size="sm"
                            disabled={isApproving[doc.id]}
                            onClick={() => handleApproveDoc(doc.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                          >
                            {isApproving[doc.id] ? "Aprobando..." : "Aprobar"} <CheckCircle2 size={12} className="ml-1" />
                          </Button>
                        )}

                        {doc.status !== 'rejected' && (
                          <Button
                            size="sm"
                            onClick={() => { setRejectTarget(doc.id); setRejectReason(""); }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl shadow-lg shadow-rose-500/20"
                          >
                            Rechazar <XCircle size={12} className="ml-1" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleVersions(doc.id)}
                          className="ml-auto text-slate-400 hover:text-slate-600 font-bold text-[9px] uppercase tracking-widest h-9 px-3 rounded-xl gap-1 transition-colors"
                        >
                          <History size={12} /> Versiones
                          <ChevronDown size={12} className={cn("transition-transform", expandedVersions === doc.id && "rotate-180")} />
                        </Button>
                      </div>

                      {/* Version history */}
                      {expandedVersions === doc.id && (
                        <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                          {(versions[doc.id] ?? []).length === 0 ? (
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center py-2">
                              Sin versiones anteriores
                            </p>
                          ) : (
                            (versions[doc.id] ?? []).map((v, i) => (
                              <div key={v.id} className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-black text-slate-300 uppercase">v{(versions[doc.id] ?? []).length - i}</span>
                                  <span className="text-xs font-bold text-slate-500">
                                    {(() => { const d = safeDate(v.replacedAt); return d ? format(d, "d MMM yyyy, HH:mm", { locale: es }) : '—'; })()}
                                  </span>
                                </div>
                                <button
                                  onClick={() => window.open(v.url, '_blank')}
                                  className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1 hover:text-blue-700 transition-colors"
                                >
                                  Ver <ExternalLink size={10} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                   </div>
                 ))}
                 {otDocuments.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                       <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Sin documentos cargados por ahora</p>
                    </div>
                 )}
               </div>

               {/* Documents from requirements flow (signed powers, etc.) */}
               {procedureType && ot.requirementsProgress && (() => {
                 const reqDocs = (procedureType.requirements || []).filter(req => {
                   const prog = (ot.requirementsProgress || {})[req.id];
                   if (!prog?.documentUrl) return false;
                   // Exclude if already shown in the main documents grid
                   const alreadyShown = otDocuments.some(d => d.url === prog.documentUrl);
                   return !alreadyShown;
                 });
                 if (reqDocs.length === 0) return null;
                 return (
                   <div className="mt-8">
                     <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                       <Fingerprint size={14} className="text-purple-600" /> Documentos del Trámite
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {reqDocs.map(req => {
                         const prog = (ot.requirementsProgress || {})[req.id];
                         return (
                           <div key={req.id} data-requirement-id={req.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] group transition-all shadow-sm hover:shadow-md">
                             <div className="flex justify-between items-start mb-4">
                               <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                 <Fingerprint size={24} />
                               </div>
                               <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-[8px] font-bold uppercase tracking-widest shadow-none">
                                 Completado
                               </Badge>
                             </div>
                             <h4 className="text-lg font-bold text-slate-800 mb-1 uppercase tracking-tight">{req.label}</h4>
                             {prog?.signerName && (
                               <p className="text-xs text-slate-500 mb-1">Firmado por: {prog.signerName}</p>
                             )}
                             {prog?.signedAt && (
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                 {(() => { const d = safeDate(prog.signedAt); return d ? format(d, "d 'de' MMMM, yyyy", { locale: es }) : '—'; })()}
                               </p>
                             )}
                             {prog?.expiresAt && (
                               <p className="text-[10px] font-bold text-emerald-600 mt-1">
                                 Vigente hasta: {(() => { const d = safeDate(prog.expiresAt); return d ? format(d, "d MMM yyyy", { locale: es }) : '—'; })()}
                               </p>
                             )}
                             <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => window.open(prog.documentUrl, "_blank")}
                                 className="bg-white border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl hover:bg-slate-50 shadow-sm"
                               >
                                 Ver Documento <ExternalLink size={12} className="ml-1" />
                               </Button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 );
               })()}

               {user?.role === 'spi-admin' && (
                 <div className="border-t border-slate-100 pt-6 mt-8 space-y-4">
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                     Nota rápida del equipo
                   </p>
                   <div className="flex gap-3 items-start">
                     <Textarea
                       value={internalNote}
                       onChange={e => setInternalNote(e.target.value)}
                       placeholder="Agregar nota interna del equipo..."
                       className="min-h-[80px] text-sm flex-1 bg-white border-slate-200 text-slate-900 rounded-2xl shadow-inner focus:ring-blue-500/20"
                     />
                     <Button
                       size="sm"
                       disabled={!internalNote.trim()}
                       onClick={async () => {
                         await logAction(user!.uid, ot.id,
                           `[NOTA INTERNA] ${internalNote.trim()}`);
                         setInternalNote('');
                         toast.success('Nota guardada');
                       }}
                       className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-6 h-12 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                     >
                       Guardar
                     </Button>
                   </div>
                 </div>
               )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
               <div className="space-y-4">
                 {otLogs.map((log) => (
                   <div key={log.id} className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{log.action}</p>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                             <User size={12} className="text-slate-300" /> {log.userId === 'system' || log.userId === 'pipefy' ? "Sistema" : "Admin"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                             <Clock size={12} className="text-slate-300" /> {log.timestamp ? (() => { const d = safeDate(log.timestamp); return d ? format(d, "d MMM, HH:mm", { locale: es }) : '—'; })() : '—'}
                          </span>
                        </div>
                      </div>
                   </div>
                 ))}
                 {otLogs.length === 0 && (
                   <div className="py-24 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-[2.5rem]">
                     <Activity className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                     <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Sin actividad registrada</p>
                   </div>
                 )}
               </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {user?.role === 'spi-admin' && (
          <DialogFooter className="px-8 py-6 border-t border-slate-100 bg-slate-50/50">
            <Button
              onClick={async () => {
                setIsAdvancing(true);
                try {
                  await updateOTStage(ot.id, nextStage!);
                  toast.success(`OT avanzada a ${STAGE_LABELS[nextStage!]}`);
                } finally {
                  setIsAdvancing(false);
                }
              }}
              disabled={!nextStage || isAdvancing}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isAdvancing ? "Procesando..." : nextStage ? `Avanzar a ${STAGE_LABELS[nextStage]} →` : 'OT Finalizada'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

    {/* Reject Document Dialog */}
    <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
      <DialogContent className="max-w-md rounded-[2.5rem] bg-white border-slate-200 text-slate-900 shadow-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Rechazar Documento</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-sm mt-2">
            Indica la razón del rechazo de forma clara. Esta notificación será enviada al cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Razón detallada</Label>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ej: El documento está vencido, la firma no coincide o es ilegible..."
            className="bg-slate-50 border-slate-200 text-slate-900 rounded-[1.5rem] resize-none min-h-[140px] font-medium p-4 focus:ring-rose-500/10 shadow-inner"
          />
        </div>
        <DialogFooter className="gap-3 sm:justify-end">
          <Button
            variant="ghost"
            disabled={isRejecting}
            onClick={() => { setRejectTarget(null); setRejectReason(""); }}
            className="rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 px-6 transition-all"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRejectDoc}
            disabled={isRejecting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-60"
          >
            {isRejecting ? 'Rechazando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {currentPaymentType && (
      <UploadComprobanteModal
        ot={ot}
        open={uploadComprobanteOpen}
        onOpenChange={setUploadComprobanteOpen}
      />
    )}

    <RejectComprobanteModal
      docId={rejectComprobanteDocId}
      open={!!rejectComprobanteDocId}
      onOpenChange={(open) => { if (!open) setRejectComprobanteDocId(null); }}
    />

    <ConfirmDialog
      open={approveComprobanteOpen}
      onOpenChange={setApproveComprobanteOpen}
      title="Aprobar comprobante de pago"
      description="¿Confirmás que el pago fue recibido y querés aprobar este comprobante? La OT avanzará automáticamente al siguiente stage."
      confirmLabel="Aprobar pago"
      confirmVariant="default"
      onConfirm={handleApproveComprobante}
      loading={approvingComprobante}
    />
    </>
  );
};

export default OTDetailsModal;
