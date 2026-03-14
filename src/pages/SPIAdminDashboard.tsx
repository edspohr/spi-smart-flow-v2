import { useEffect, useState } from "react";
import useOTStore from "../store/useOTStore";
import useDocumentStore from "../store/useDocumentStore";
import useAuthStore from "../store/useAuthStore";
import { 
  Search, 
  LayoutGrid, 
  List, 
  FileText,
  AlertCircle,
  ExternalLink,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { OTStatusBadge } from "@/components/OTStatusBadge";
import OTDetailsModal from "@/components/OTDetailsModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const SPIAdminDashboard = () => {
  const { user } = useAuthStore();
  const { ots, subscribeToAllOTs } = useOTStore();
  const { documents, subscribeToAllVaultDocuments } = useDocumentStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOT, setSelectedOT] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubOTs = subscribeToAllOTs();
    const unsubDocs = subscribeToAllVaultDocuments();
    return () => {
      unsubOTs();
      unsubDocs();
    };
  }, [subscribeToAllOTs, subscribeToAllVaultDocuments]);

  const filteredOTs = ots.filter(ot => 
    ot.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.companyId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingDocs = documents.filter(d => 
    d.status === 'uploaded' || d.status === 'validating_ai' || d.status === 'rejected'
  );

  const openOTDetails = (ot: any) => {
    setSelectedOT(ot);
    setIsModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Torre de Control SPI</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Visión Global de Operaciones</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Buscar por Marca, OT o Empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-slate-900/50 border-slate-800 text-white rounded-2xl focus:ring-blue-500 transition-all font-bold"
            />
          </div>
          <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-800 bg-slate-900/50 p-0 hover:bg-slate-800">
            <Filter className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
            <TabsTrigger value="kanban" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <LayoutGrid className="w-4 h-4 mr-2" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <List className="w-4 h-4 mr-2" /> Listado
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-rose-600 data-[state=active]:text-white">
              <AlertCircle className="w-4 h-4 mr-2" /> Revisión ({pendingDocs.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="mt-0 outline-none">
          <KanbanBoard ots={filteredOTs} onOTClick={openOTDetails} />
        </TabsContent>

        <TabsContent value="list" className="mt-0 outline-none">
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
            <ScrollArea className="h-[65vh]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-800">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operación (OT)</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Empresa</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Etapa Actual</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Último Cambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredOTs.map((ot) => (
                    <tr 
                      key={ot.id} 
                      onClick={() => openOTDetails(ot)}
                      className="group hover:bg-blue-600/5 transition-colors cursor-pointer"
                    >
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{ot.title || ot.brandName}</span>
                          <span className="text-[10px] font-bold text-slate-600 font-mono mt-1">ID: {ot.id.substring(0, 10)}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-700 font-black text-[9px] px-3 py-1">
                          {ot.companyId}
                        </Badge>
                      </td>
                      <td className="p-6 text-center">
                        <OTStatusBadge stage={ot.stage} dark />
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-bold text-slate-500">
                          {ot.updatedAt ? format(new Date(ot.updatedAt), "d MMM, HH:mm", { locale: es }) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-0 outline-none">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingDocs.map((doc) => (
              <div key={doc.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] group hover:border-rose-500/30 transition-all flex flex-col justify-between h-48">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <Badge className={cn(
                    "px-3 py-0.5 text-[8px] font-black uppercase tracking-widest",
                    doc.status === 'rejected' ? "bg-rose-500/20 text-rose-500" : "bg-blue-500/20 text-blue-500"
                  )}>
                    {doc.status}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-black text-slate-200 uppercase tracking-tight line-clamp-1">{doc.name}</h4>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{doc.otId}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <button 
                      onClick={() => window.open(doc.url, '_blank')}
                      className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:text-blue-400 transition-colors"
                   >
                     Ver Documento <ExternalLink className="w-3 h-3" />
                   </button>
                   <Button 
                      size="sm" 
                      onClick={() => openOTDetails(ots.find(o => o.id === doc.otId))}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-black text-[9px] uppercase tracking-widest px-4 h-8 rounded-lg"
                   >
                      Revisar OT
                   </Button>
                </div>
              </div>
            ))}
            {pendingDocs.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
                 <Check className="h-12 w-12 text-blue-500/20 mx-auto mb-4" />
                 <p className="text-slate-500 font-bold uppercase tracking-widest">No hay documentos pendientes</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedOT && (
        <OTDetailsModal 
          ot={selectedOT}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </div>
  );
};

export default SPIAdminDashboard;
