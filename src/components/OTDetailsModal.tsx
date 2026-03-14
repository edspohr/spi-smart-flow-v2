import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowRight
} from "lucide-react";
import useOTStore from "../store/useOTStore";
import useDocumentStore from "../store/useDocumentStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OTStage, DocumentStatus } from "../store/types";

interface OTDetailsModalProps {
  ot: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OTDetailsModal = ({ ot, open, onOpenChange }: OTDetailsModalProps) => {
  const { updateOTStage, updateOTDetails, loading: otLoading } = useOTStore();
  const { documents, updateDocumentStatus } = useDocumentStore();
  const [internalNotes, setInternalNotes] = useState(ot.internalNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    setInternalNotes(ot.internalNotes || "");
  }, [ot]);

  const otDocuments = documents.filter((d) => d.otId === ot.id);

  const handleAdvanceStage = async () => {
    const stages: OTStage[] = [
      "solicitud_recibida",
      "pago_pendiente",
      "en_validacion",
      "preparacion_documentos",
      "presentacion_entidad",
      "en_analisis_entidad",
      "concedida",
      "finalizada"
    ];
    const currentIndex = stages.indexOf(ot.stage);
    if (currentIndex < stages.length - 1) {
      await updateOTStage(ot.id, stages[currentIndex + 1]);
      toast.success(`Etapa avanzada a: ${stages[currentIndex + 1]}`);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateOTDetails(ot.id, { internalNotes } as any);
      toast.success("Notas guardadas correctamente");
    } catch (error) {
      toast.error("Error al guardar notas");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDocAction = async (docId: string, status: DocumentStatus) => {
    let reason = "";
    if (status === 'rejected') {
      reason = prompt("Razón del rechazo:") || "No cumple los requisitos";
    }
    await updateDocumentStatus(docId, status, reason);
    toast.info(`Documento ${status === 'validated' ? 'Aprobado' : 'Rechazado'}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] bg-[#0B1121] border-slate-800 p-0 overflow-hidden flex flex-col rounded-[2.5rem]">
        <DialogHeader className="p-8 pb-0 flex flex-row justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <OTStatusBadge stage={ot.stage} dark />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OT: {ot.id.substring(0, 10)}</span>
            </div>
            <DialogTitle className="text-3xl font-black text-white tracking-tight uppercase">
              {ot.brandName || ot.title}
            </DialogTitle>
          </div>
          
          <div className="flex gap-3">
             <Button 
                onClick={handleAdvanceStage} 
                disabled={otLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest h-12 px-6 rounded-2xl shadow-lg shadow-blue-500/20 group"
             >
               Avanzar Etapa <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
             </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col mt-6">
          <TabsList className="px-8 bg-transparent border-b border-slate-800 h-12 gap-8">
            <TabsTrigger value="overview" className="bg-transparent text-slate-500 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 px-0 h-12 rounded-none text-[10px] font-black uppercase tracking-widest">Resumen</TabsTrigger>
            <TabsTrigger value="documents" className="bg-transparent text-slate-500 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 px-0 h-12 rounded-none text-[10px] font-black uppercase tracking-widest">Documentación ({otDocuments.length})</TabsTrigger>
            <TabsTrigger value="history" className="bg-transparent text-slate-500 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 px-0 h-12 rounded-none text-[10px] font-black uppercase tracking-widest">Historial</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-8">
            <TabsContent value="overview" className="mt-0 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Client Info */}
                <div className="space-y-6">
                  <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                       <User size={14} className="text-blue-500" /> Información del Cliente
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-2xl">
                        <span className="text-xs font-bold text-slate-400">Empresa</span>
                        <span className="text-sm font-black text-white flex items-center gap-2">
                          <Building2 size={14} className="text-slate-500" /> {ot.companyId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-2xl">
                        <span className="text-xs font-bold text-slate-400">Usuario ID</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{ot.clientId}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-2xl">
                        <span className="text-xs font-bold text-slate-400">Fecha Apertura</span>
                        <span className="text-sm font-black text-white flex items-center gap-2">
                           <Calendar size={14} className="text-slate-500" /> {ot.createdAt ? format(new Date(ot.createdAt), "d MMMM, yyyy", { locale: es }) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                       <MessageSquare size={14} className="text-amber-500" /> Detalles Técnicos
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-800/20 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Clase</p>
                          <p className="text-sm font-black text-white uppercase">{ot.brandClass || "Pendiente"}</p>
                       </div>
                       <div className="bg-slate-800/20 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Pantone</p>
                          <p className="text-sm font-black text-white">{ot.pantone || "N/A"}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Internal Notes */}
                <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800 flex flex-col h-full">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                     <FileText size={14} className="text-emerald-500" /> Notas Internas (Privado)
                  </h3>
                  <Textarea 
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Espacio para bitácora interna, seguimientos manuales o recordatorios del equipo SPI..."
                    className="flex-1 bg-slate-800/30 border-slate-700 text-white rounded-2xl resize-none p-4 font-medium text-sm focus:ring-emerald-500"
                  />
                  <Button 
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest h-12 rounded-xl"
                  >
                    {isSavingNotes ? "Guardando..." : "Actualizar Bitácora Interna"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {otDocuments.map((doc) => (
                   <div key={doc.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <FileText size={24} />
                        </div>
                        <Badge className={cn(
                          "px-3 py-1 text-[8px] font-black uppercase tracking-widest",
                          doc.status === 'validated' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          doc.status === 'rejected' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {doc.status}
                        </Badge>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-lg font-black text-white mb-1 uppercase tracking-tight">{doc.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Tipo: {doc.type || "Desconocido"}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                          className="bg-slate-800 border-slate-700 text-white font-black text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl hover:bg-slate-700"
                        >
                          Visualizar <ExternalLink size={12} className="ml-1" />
                        </Button>
                        
                        {doc.status !== 'validated' && (
                          <Button 
                            size="sm"
                            onClick={() => handleDocAction(doc.id, 'validated')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl"
                          >
                            Aprobar <CheckCircle2 size={12} className="ml-1" />
                          </Button>
                        )}
                        
                        {doc.status !== 'rejected' && (
                          <Button 
                             size="sm"
                             onClick={() => handleDocAction(doc.id, 'rejected')}
                             className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-widest h-9 px-4 rounded-xl"
                          >
                            Rechazar <XCircle size={12} className="ml-1" />
                          </Button>
                        )}
                      </div>
                   </div>
                 ))}
                 {otDocuments.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                       <Clock className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sin documentos cargados por ahora</p>
                    </div>
                 )}
               </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
               <div className="space-y-4">
                 {ot.logs?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log: any, i: number) => (
                   <div key={i} className="flex gap-4 items-start bg-slate-900/40 p-5 rounded-2xl border border-slate-800/50">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">{log.action}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                             <User size={10} /> {log.userId === 'admin' ? "SPI Admin" : "Sistema"}
                          </span>
                          <span className="text-[10px] font-black text-slate-600 flex items-center gap-1">
                             <Clock size={10} /> {format(new Date(log.timestamp), "d MMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default OTDetailsModal;
