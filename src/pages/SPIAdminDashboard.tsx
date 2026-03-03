import { useEffect, useState } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
    Search, Download,
    ShieldCheck, 
    ListFilter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OTDetailsModal from '@/components/OTDetailsModal';
import ClientList from '@/components/admin/ClientList';
import KanbanBoard from '@/components/dashboard/KanbanBoard';

const STAGE_CONFIG: Record<string, { label: string; badge: string }> = {
    solicitud: { label: 'Solicitud', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    pago_adelanto: { label: 'Pago Inicial', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    gestion: { label: 'En Gestión', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    pago_cierre: { label: 'Pago Final', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    finalizado: { label: 'Finalizado', badge: 'bg-slate-800 text-slate-300 border-slate-700' }
};

const AREA_CONFIG: Record<string, { badge: string; color: string; fill: string }> = {
    PI: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', color: 'bg-blue-900/40 text-blue-400 border border-blue-500/30', fill: '#3b82f6' },
    AR: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', color: 'bg-amber-900/40 text-amber-500 border border-amber-500/30', fill: '#f59e0b' }
};

const SPIAdminDashboard = () => {
    const { ots, subscribeToAllOTs } = useDataStore(); 
    const [selectedOT, setSelectedOT] = useState<OT | null>(null);
    const [activeTab, setActiveTab] = useState("kanban");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCompany, setFilterCompany] = useState("all");
    
    useEffect(() => {
        const unsubscribe = subscribeToAllOTs();
        return () => unsubscribe();
    }, [subscribeToAllOTs]);

    const getDeadlineBadge = (deadline: string) => {
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 2) return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">Vence Hoy</Badge>;
        if (days < 5) return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">{days}d faltan</Badge>;
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">A tiempo</Badge>;
    };

    const companies = Array.from(new Set(ots.map(ot => ot.companyId))).filter(Boolean);

    const filteredOTs = ots.filter(ot => {
        const matchesSearch = ot.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             ot.companyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             ot.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === "all" || ot.companyId === filterCompany;
        return matchesSearch && matchesCompany;
    });

    return (
        <div className="space-y-6 p-6 max-w-[1800px] mx-auto animate-fade-in h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-50 tracking-tight flex items-center gap-3">
                        Torre de Control <ShieldCheck className="text-blue-500 h-7 w-7" />
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Gestión unificada de operaciones de Propiedad Intelectual.</p>
                </div>
                <div className="flex gap-3">
                     <Button variant="outline" className="rounded-xl h-10 px-4 border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white font-bold transition-all">
                        <Download className="h-4 w-4 mr-2" /> Exportar
                     </Button>
                     <Button className="btn-primary rounded-xl h-10 px-4 shadow-lg shadow-blue-900/40 font-bold transition-all border border-blue-500/50">
                        Nueva Operación
                     </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex justify-between items-center shrink-0">
                    <TabsList className="bg-slate-900/80 p-1 rounded-xl w-fit border border-slate-800">
                        <TabsTrigger value="kanban" className="rounded-lg px-6 py-2 font-black data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 text-xs uppercase tracking-widest transition-all">
                            Kanban Global
                        </TabsTrigger>
                        <TabsTrigger value="solicitudes" className="rounded-lg px-6 py-2 font-black data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 text-xs uppercase tracking-widest transition-all">
                            Lista Maestra
                        </TabsTrigger>
                        <TabsTrigger value="clientes" className="rounded-lg px-6 py-2 font-black data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 text-xs uppercase tracking-widest transition-all">
                            Usuarios
                        </TabsTrigger>
                    </TabsList>

                    {activeTab !== "clientes" && (
                        <div className="flex gap-3 items-center">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
                                    className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-1 focus:ring-blue-500 transition-all font-semibold text-xs placeholder:text-slate-500 text-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <ListFilter className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <select 
                                    className="pl-9 pr-8 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-1 focus:ring-blue-500 transition-all font-bold text-xs text-slate-300 appearance-none min-w-[140px]"
                                    value={filterCompany}
                                    onChange={(e) => setFilterCompany(e.target.value)}
                                >
                                    <option value="all">Todas las Empresas</option>
                                    {companies.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="kanban" className="flex-1 min-h-0 m-0 outline-none">
                    <div className="h-full bg-slate-900/30 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto p-4">
                            <KanbanBoard userOts={filteredOTs} onSelectOt={setSelectedOT} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="solicitudes" className="flex-1 min-h-0 m-0 outline-none">
                    <Card className="h-full rounded-[2rem] bg-slate-900/30 border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                         <div className="flex-1 overflow-auto">
                            <table className="w-full border-collapse">
                                 <thead className="bg-slate-900/60 sticky top-0 z-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                    <tr>
                                        <th className="px-8 py-5 text-left">Referencia</th>
                                        <th className="px-8 py-5 text-left">Empresa</th>
                                        <th className="px-8 py-5 text-left">Etapa</th>
                                        <th className="px-8 py-5 text-center">Deadline</th>
                                        <th className="px-8 py-5 text-right">Detalles</th>
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-slate-800/40">
                                     {filteredOTs.map((ot, idx) => {
                                        const areaKey = ot.area || 'PI';
                                        const areaCfg = AREA_CONFIG[areaKey];

                                        return (
                                        <tr key={ot.id} className={cn(
                                          "group transition-all hover:bg-slate-800/40 cursor-pointer",
                                          idx % 2 === 0 ? "bg-slate-900/10" : "bg-transparent"
                                        )}
                                        onClick={() => setSelectedOT(ot)}
                                        >
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-4">
                                                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm", areaCfg.color)}>
                                                      {areaKey}
                                                   </div>
                                                   <div>
                                                      <span className="font-black text-slate-100 block group-hover:text-blue-400 transition-colors tracking-tight text-sm">
                                                        {ot.title}
                                                      </span>
                                                      <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                                                          OT-{ot.id.split('-')[1] || ot.id}
                                                      </span>
                                                   </div>
                                                 </div>
                                             </td>
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-3">
                                                    <Avatar className="h-7 w-7 rounded-lg border border-slate-700">
                                                       <AvatarFallback className="bg-slate-800 text-slate-400 text-[10px] font-black">{ot.companyId?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-300 text-sm">{ot.companyId}</span>
                                                 </div>
                                             </td>
                                             <td className="px-8 py-5">
                                                 <Badge className={cn("px-3 py-1 shadow-none rounded-lg text-[10px] font-black tracking-widest uppercase border", STAGE_CONFIG[ot.stage].badge)}>
                                                     {STAGE_CONFIG[ot.stage].label}
                                                 </Badge>
                                             </td>
                                             <td className="px-8 py-5 text-center">
                                                 {getDeadlineBadge(ot.deadline)}
                                             </td>
                                             <td className="px-8 py-5 text-right">
                                                 <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="rounded-lg hover:bg-blue-600/20 hover:text-blue-400 transition-all font-bold text-slate-400"
                                                >
                                                     Ver
                                                 </Button>
                                             </td>
                                         </tr>
                                     )})}
                                 </tbody>
                            </table>
                         </div>
                    </Card>
                </TabsContent>

                <TabsContent value="clientes" className="flex-1 min-h-0 m-0 outline-none">
                    <div className="h-full bg-slate-900/30 border border-slate-800 rounded-[2rem] p-8 overflow-auto">
                        <ClientList />
                    </div>
                </TabsContent>
            </Tabs>

            {selectedOT && (
                <OTDetailsModal 
                    open={!!selectedOT}
                    onOpenChange={(open) => !open && setSelectedOT(null)}
                    ot={selectedOT}
                />
            )}
        </div>
    );
};

export default SPIAdminDashboard;
