import { useEffect, useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText, Clock, AlertCircle, CheckCircle, 
  XCircle, History, Upload, Check, X,
  ExternalLink, BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import useDataStore, { OT, Document } from "../store/useDataStore";
import useAuthStore from "../store/useAuthStore";
import DocumentUpload from "./DocumentUpload";

interface OTDetailsModalProps {
  ot: OT | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OTDetailsModal = ({ ot, open, onOpenChange }: OTDetailsModalProps) => {
  const { documents, logs, subscribeToOTLogs, updateDocumentStatus } = useDataStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"docs" | "bitacora">("docs");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [uploadDoc, setUploadDoc] = useState<Document | null>(null);
  const [historyDoc, setHistoryDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (open && ot) {
      const unsubscribe = subscribeToOTLogs(ot.id);
      return () => unsubscribe();
    }
  }, [open, ot, subscribeToOTLogs]);

  if (!ot) return null;

  const handleApprove = async (doc: Document) => {
    await updateDocumentStatus(doc.id, "validated");
  };

  const openRejectDialog = (doc: Document) => {
    setSelectedDocId(doc.id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (selectedDocId && rejectionReason.trim()) {
      await updateDocumentStatus(selectedDocId, "rejected", rejectionReason);
      setRejectDialogOpen(false);
      setSelectedDocId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "validated":
        return { color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <CheckCircle className="w-7 h-7" />, label: "Validado" };
      case "rejected":
        return { color: "bg-rose-50 text-rose-700 border-rose-100", icon: <XCircle className="w-7 h-7" />, label: "Rechazado" };
      case "uploaded":
        return { color: "bg-blue-50 text-blue-700 border-blue-100", icon: <Upload className="w-7 h-7" />, label: "En Revisión" };
      case "validating_ai":
        return { color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: <BarChart3 className="w-7 h-7 animate-pulse" />, label: "Analizando IA" };
      default:
        return { color: "bg-slate-50 text-slate-500 border-slate-100", icon: <FileText className="w-7 h-7" />, label: "Pendiente" };
    }
  };

  const relevantDocs = documents.filter((d) => d.otId === ot.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 border-none shadow-2xl overflow-hidden rounded-3xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shrink-0" />
        
        {/* Header */}
        <div className="p-8 pb-4 border-b border-slate-100 bg-white/80 backdrop-blur-xl flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 px-3 py-1 font-black uppercase text-[10px] tracking-widest rounded-lg">
                OT-{ot.id.split('-')[1] || ot.id}
              </Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 px-3 py-1 font-black uppercase text-[10px] tracking-widest rounded-lg">
                {ot.serviceType}
              </Badge>
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
              {ot.title}
            </DialogTitle>
            <div className="flex items-center gap-6 mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Iniciado: {format(new Date(ot.createdAt), "d MMM, yyyy", { locale: es })}
              </span>
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-500" />
                Fecha Límite: {format(new Date(ot.deadline), "d MMM, yyyy", { locale: es })}
              </span>
            </div>
          </div>

          <div className="bg-slate-100 p-1.5 rounded-2xl flex text-xs font-bold uppercase tracking-widest">
            <button
              onClick={() => setActiveTab("docs")}
              className={cn(
                "px-6 py-2 rounded-xl transition-all duration-300",
                activeTab === "docs" ? "bg-white shadow-sm text-blue-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab("bitacora")}
              className={cn(
                "px-6 py-2 rounded-xl transition-all duration-300",
                activeTab === "bitacora" ? "bg-white shadow-sm text-blue-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Bitácora
            </button>
          </div>
        </div>

        <div className="flex-1 w-full overflow-hidden flex flex-col bg-slate-50/30">
          {activeTab === "docs" ? (
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-4">
                {relevantDocs.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center">
                    <History className="h-12 w-12 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No se han cargado documentos.</p>
                  </div>
                ) : (
                  relevantDocs.map((doc) => {
                    const config = getStatusConfig(doc.status);
                    return (
                      <div
                        key={doc.id}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105", config.color)}>
                            {config.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {doc.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Badge className={cn("px-2.5 py-0.5 text-[9px] uppercase font-black tracking-widest border shadow-none rounded-lg", config.color)}>
                                {config.label}
                              </Badge>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                {doc.type === 'sign' ? 'Requiere Firma' : 'Digital / PDF'}
                              </span>
                            </div>
                            {doc.status === "rejected" && (doc as any).rejectionReason && (
                              <div className="mt-3 text-[11px] text-rose-600 font-bold bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 flex items-start gap-2 max-w-sm">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Ref: {(doc as any).rejectionReason}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {doc.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-4 rounded-xl border-slate-100 hover:bg-slate-50 shadow-sm transition-all flex gap-2 font-bold text-xs"
                              onClick={() => window.open(doc.url, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Ver PDF
                            </Button>
                          )}

                          <button
                            onClick={() => setHistoryDoc(doc)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                            title="Ver Historial"
                          >
                            <History className="h-4 w-4" />
                          </button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 shadow-sm font-bold text-xs"
                            onClick={() => setUploadDoc(doc)}
                          >
                            Reemplazar
                          </Button>

                          {user?.role === "spi-admin" && (
                            <div className="flex items-center gap-2 pl-3 ml-3 border-l border-slate-100">
                              <button
                                onClick={() => handleApprove(doc)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                title="Aprobar"
                              >
                                <Check className="h-5 w-5 stroke-[3]" />
                              </button>
                              <button
                                onClick={() => openRejectDialog(doc)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                title="Rechazar"
                              >
                                <X className="h-5 w-5 stroke-[3]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-10 space-y-0 relative ml-8 border-l-2 border-slate-100">
                {logs && logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <div key={log.id} className="relative mb-8 last:mb-0 animate-fade-in group" style={{ animationDelay: `${idx * 50}ms` }}>
                      {/* Timeline Marker */}
                      <div className={cn(
                        "absolute -left-[45px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-2 ring-slate-100",
                        log.type === "system" ? "bg-slate-300" : "bg-blue-600"
                      )} />
                      
                      <div className="bg-white/5 group-hover:bg-white transition-all p-5 rounded-3xl border border-transparent group-hover:border-slate-100 group-hover:shadow-xl group-hover:shadow-slate-200/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <span className={cn("text-xs font-black uppercase tracking-widest", log.type === 'system' ? 'text-slate-400' : 'text-slate-900')}>
                               {log.userName || 'Sistema'}
                             </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            {format(new Date(log.timestamp), "d MMM | HH:mm", { locale: es })}
                          </span>
                        </div>
                        <div className={cn("text-sm leading-relaxed", log.type === "system" ? "text-slate-500 italic font-medium" : "text-slate-700 font-semibold")}>
                          {log.action}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <p className="text-slate-400 font-medium italic">Sin actividad registrada en este flujo.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>

      {/* Rejection Reason Modal */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-rose-900 flex items-center gap-2">
              <XCircle className="text-rose-600" /> Rechazar Documento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="reason" className="text-xs font-black uppercase text-slate-400 tracking-widest">Motivo del rechazo</Label>
              <Textarea
                id="reason"
                className="min-h-[120px] rounded-2xl bg-rose-50/30 border-rose-100 focus:ring-4 focus:ring-rose-100 transition-all text-sm py-4 px-5"
                placeholder="Ej: Documento borroso, firma no coincide..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-8 gap-3 sm:justify-start">
            <Button
              className="flex-1 rounded-2xl h-12 font-black uppercase text-xs tracking-widest bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200"
              onClick={confirmReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmar Rechazo
            </Button>
            <Button
              variant="outline"
              className="px-6 rounded-2xl h-12 font-black uppercase text-xs tracking-widest border-slate-100 hover:bg-slate-50"
              onClick={() => setRejectDialogOpen(false)}
            >
              Volver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload/Replace Dialog */}
      <Dialog open={!!uploadDoc} onOpenChange={(open) => !open && setUploadDoc(null)}>
        <DialogContent className="max-w-xl bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
             <DialogTitle className="text-xl font-black text-slate-900">
               Actualizar: {uploadDoc?.name}
             </DialogTitle>
          </div>
          <div className="p-8">
            {uploadDoc && (
              <DocumentUpload
                documentType={uploadDoc.type}
                documentLabel={uploadDoc.name}
                enableSigning={uploadDoc.type === "sign" || uploadDoc.name.toLowerCase().includes("poder")}
                templatePreviewUrl={uploadDoc.url || undefined}
                onUploadComplete={() => setUploadDoc(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Granular History Dialog */}
      <Dialog open={!!historyDoc} onOpenChange={(open) => !open && setHistoryDoc(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <History className="text-blue-600" /> Historial de Cambios
            </DialogTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{historyDoc?.name}</p>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-2 scrollbar-hide py-2">
            {logs
              .filter(log => log.metadata?.docId === historyDoc?.id || log.action.includes(historyDoc?.name || "###"))
              .map((log) => (
                <div key={log.id} className="relative pl-6 border-l-2 border-slate-100">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white shadow-sm" />
                  <p className="text-[10px] font-black text-slate-300 uppercase mb-1">
                    {format(new Date(log.timestamp), "dd MMM, HH:mm", { locale: es })}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{log.action}</p>
                  {log.userName && <p className="text-[10px] text-blue-600 font-black mt-1 uppercase tracking-tighter">Por: {log.userName}</p>}
                </div>
              ))}
            {logs.filter(l => l.metadata?.docId === historyDoc?.id || l.action.includes(historyDoc?.name || "###")).length === 0 && (
              <div className="py-10 text-center">
                <p className="text-slate-400 font-medium italic">Sin historial específico.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default OTDetailsModal;
