import { useEffect, useState } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { 
    Activity,  AlertTriangle, 
    Search, TrendingUp,
    ArrowUpRight, Filter, Download,
    ShieldCheck, Hexagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OTDetailsModal from '@/components/OTDetailsModal';
import ClientList from '@/components/admin/ClientList';

const COLORS = ['#10b981', '#3b82f6', '#475569', '#f43f5e'];

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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-2xl shadow-black/50 text-xs space-y-2">
                <p className="font-black text-slate-100 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                     <div key={index} className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                           <span className="text-slate-400 font-bold uppercase tracking-tighter">{entry.name}</span>
                        </div>
                        <span className="font-black text-slate-100">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const SPIAdminDashboard = () => {
    const { ots, subscribeToAllOTs } = useDataStore(); 
    const [selectedOT, setSelectedOT] = useState<OT | null>(null);
    const [activeTab, setActiveTab] = useState("solicitudes");
    
    useEffect(() => {
        const unsubscribe = subscribeToAllOTs();
        return () => unsubscribe();
    }, [subscribeToAllOTs]);

    const totalOTs = ots.length;
    const activeOTs = ots.filter(ot => ot.stage !== 'finalizado').length;
    const criticalOTs = ots.filter(ot => {
         const daysLeft = Math.ceil((new Date(ot.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
         return daysLeft < 2 && ot.stage !== 'finalizado';
    }).length;

    const efficiencyData = [
        { name: 'Lun', manual: 4, ai: 12 },
        { name: 'Mar', manual: 3, ai: 18 },
        { name: 'Mie', manual: 2, ai: 25 },
        { name: 'Jue', manual: 2, ai: 22 },
        { name: 'Vie', manual: 1, ai: 30 },
        { name: 'Sab', manual: 0, ai: 15 },
        { name: 'Dom', manual: 0, ai: 10 },
    ];

    const distributionData = [
        { name: 'PI', value: ots.filter(o => o.area === 'PI').length },
        { name: 'AR', value: ots.filter(o => o.area === 'AR').length },
    ];

    const documentStatusData = [
        { name: 'Validados', value: 45 },
        { name: 'Subidos', value: 30 },
        { name: 'Pendientes', value: 15 },
        { name: 'Rechazados', value: 10 },
    ];

    const getDeadlineBadge = (deadline: string) => {
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 2) return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">Vence Hoy</Badge>;
        if (days < 5) return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">{days}d faltan</Badge>;
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">A tiempo</Badge>;
    };

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-50 tracking-tight flex items-center gap-3">
                        Torre de Control <ShieldCheck className="text-blue-500 h-8 w-8" />
                    </h1>
                    <p className="text-slate-400 font-semibold mt-1">Supervisión corporativa en tiempo real de operaciones locales e internacionales.</p>
                </div>
                <div className="flex gap-4">
                     <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-bold transition-all shadow-sm">
                        <Download className="h-4 w-4 mr-2" /> Reporte Global
                     </Button>
                     <Button className="btn-primary rounded-2xl h-12 px-6 shadow-lg shadow-blue-900/40 font-bold transition-all border border-blue-500/50">
                        <Activity className="h-4 w-4 mr-2" /> Nueva Operación
                     </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-colors" style={{animationDelay: '0ms'}}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Trámites Totales</p>
                        <h3 className="text-4xl font-black text-slate-50">{totalOTs}</h3>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-2 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-500/20">
                            <ArrowUpRight className="h-3 w-3" /> +12% este mes
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:bg-blue-900/30 group-hover:border-blue-500/30 transition-all">
                        <Activity className="h-6 w-6 text-blue-400" />
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-colors" style={{animationDelay: '100ms'}}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gestiones Activas</p>
                        <h3 className="text-4xl font-black text-slate-50">{activeOTs}</h3>
                        <div className="flex items-center gap-1 text-blue-400 text-xs font-bold mt-2 bg-blue-500/10 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter border border-blue-500/20">
                            En proceso
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:bg-emerald-900/30 group-hover:border-emerald-500/30 transition-all">
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-colors" style={{animationDelay: '200ms'}}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Alertas Críticas</p>
                        <h3 className="text-4xl font-black text-slate-50">{criticalOTs}</h3>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-2 bg-amber-500/10 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter border border-amber-500/20">
                            Requiere Atención
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:bg-amber-900/30 group-hover:border-amber-500/30 transition-all shadow-amber-900/20">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-slate-900/80 p-1.5 rounded-2xl w-fit border border-slate-800">
                    <TabsTrigger value="solicitudes" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl text-slate-400 transition-all">
                        Operaciones
                    </TabsTrigger>
                    <TabsTrigger value="clientes" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-xl text-slate-400 transition-all">
                        Gestión Clientes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="solicitudes" className="space-y-8 animate-fade-in">
                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="rounded-[2.5rem] bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden relative">
                            <CardHeader className="pt-8 px-8 border-b border-slate-800/50 pb-6 mb-2">
                                <CardTitle className="text-lg font-black text-slate-100 uppercase tracking-tight">Eficiencia AI</CardTitle>
                                <CardDescription className="font-semibold text-slate-500">Automatización vs Manual</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px] p-6 pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={efficiencyData}>
                                        <defs>
                                            <linearGradient id="adminAi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="ai" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#adminAi)" />
                                        <Area type="monotone" dataKey="manual" stroke="#475569" strokeWidth={2} strokeDasharray="6 6" fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden relative">
                            <CardHeader className="pt-8 px-8 border-b border-slate-800/50 pb-6 mb-2">
                                <CardTitle className="text-lg font-black text-slate-100 uppercase tracking-tight">Carga por Área</CardTitle>
                                <CardDescription className="font-semibold text-slate-500">Propiedad Intelectual vs Regulatorio</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px] p-6 pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData} barSize={60}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} dy={10} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', radius: 16}} />
                                        <Bar dataKey="value" radius={[16, 16, 16, 16]}>
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.name === 'PI' ? '#3b82f6' : '#f59e0b'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden relative">
                            <CardHeader className="pt-8 px-8 border-b border-slate-800/50 pb-6 mb-2">
                                <CardTitle className="text-lg font-black text-slate-100 uppercase tracking-tight">Estado Documental</CardTitle>
                                <CardDescription className="font-semibold text-slate-500">Salud del Repositorio</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px] p-6 pt-0 flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                     <PieChart>
                                        <Pie data={documentStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={8}>
                                            {documentStatusData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                                    <span className="text-3xl font-black text-slate-100">85%</span>
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Salud</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Global OT Table */}
                    <Card className="rounded-[2.5rem] bg-slate-900/50 border border-slate-800 shadow-2xl overflow-hidden">
                         <CardHeader className="p-8 border-b border-slate-800/80 bg-slate-900/80">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-100 tracking-tight">Tablero Master Operativo</CardTitle>
                                    <CardDescription className="font-semibold text-slate-500">Control total del flujo transaccional y validaciones documentales</CardDescription>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-72">
                                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar trámite, ID o cliente..." 
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800 border-none rounded-2xl focus:ring-1 focus:ring-blue-500 transition-all font-semibold text-sm placeholder:text-slate-500 text-slate-200"
                                        />
                                    </div>
                                    <Button variant="outline" className="rounded-2xl h-11 border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 px-5 shadow-sm">
                                        <Filter className="h-4 w-4 mr-2" /> Filtros
                                    </Button>
                                </div>
                            </div>
                         </CardHeader>
                         <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                 <thead className="bg-slate-900/40 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                    <tr>
                                        <th className="px-8 py-5 text-left">Área & Referencia</th>
                                        <th className="px-8 py-5 text-left">Cliente / Empresa</th>
                                        <th className="px-8 py-5 text-left">Etapa Actual</th>
                                        <th className="px-8 py-5 text-center">Estado Deadline</th>
                                        <th className="px-8 py-5 text-right flex-shrink-0">Acción</th>
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-slate-800/60 transition-colors">
                                     {ots.map((ot, idx) => {
                                        const areaKey = ot.area || 'PI';
                                        const areaCfg = AREA_CONFIG[areaKey];

                                        return (
                                        <tr key={ot.id} className={cn(
                                          "group transition-all hover:bg-slate-800/40 cursor-pointer",
                                          idx % 2 === 0 ? "bg-slate-900/20" : "bg-transparent"
                                        )}
                                        onClick={() => setSelectedOT(ot)}
                                        >
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-4">
                                                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg", areaCfg.color)}>
                                                      {areaKey}
                                                   </div>
                                                   <div>
                                                      <span className="font-black text-slate-100 block group-hover:text-blue-400 transition-colors tracking-tight">
                                                        {ot.title}
                                                      </span>
                                                      <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                                                            {ot.serviceType}
                                                        </span>
                                                        <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                                                            OT-{ot.id.split('-')[1] || ot.id}
                                                        </span>
                                                      </div>
                                                   </div>
                                                 </div>
                                             </td>
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-xl ring-1 ring-slate-700 shadow-sm border-none">
                                                       <AvatarFallback className="bg-slate-800 text-slate-300 text-[10px] font-black">{ot.companyId?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-300">{ot.companyId}</span>
                                                 </div>
                                             </td>
                                             <td className="px-8 py-5">
                                                 <Badge className={cn("px-4 py-1.5 shadow-none rounded-xl text-[10px] font-black tracking-widest uppercase border", STAGE_CONFIG[ot.stage].badge)}>
                                                     {STAGE_CONFIG[ot.stage].label}
                                                 </Badge>
                                             </td>
                                             <td className="px-8 py-5 text-center">
                                                 {getDeadlineBadge(ot.deadline)}
                                             </td>
                                             <td className="px-8 py-5 text-right">
                                                 <Button 
                                                    variant="ghost" 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedOT(ot); }}
                                                    className="rounded-2xl hover:bg-blue-600/20 hover:text-blue-400 transition-all font-bold group/btn shadow-sm bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 text-slate-300"
                                                >
                                                     <Hexagon className="h-4 w-4 mr-2" /> Inspect
                                                 </Button>
                                             </td>
                                        </tr>
                                     )})}
                                 </tbody>
                            </table>
                         </div>
                    </Card>
                </TabsContent>

                <TabsContent value="clientes" className="animate-fade-in">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 text-slate-300">
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
