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
    Eye, Search, TrendingUp,
    ArrowUpRight, Filter, Download,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OTDetailsModal from '@/components/OTDetailsModal';
import ClientList from '@/components/admin/ClientList';

const COLORS = ['#059669', '#2563eb', '#cbd5e1', '#e11d48'];

const STAGE_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
    solicitud: { label: 'Solicitud', color: 'bg-amber-100/50', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    pago_adelanto: { label: 'Pago Inicial', color: 'bg-sky-100/50', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
    gestion: { label: 'En Gestión', color: 'bg-indigo-100/50', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    pago_cierre: { label: 'Pago Final', color: 'bg-purple-100/50', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
    finalizado: { label: 'Finalizado', color: 'bg-emerald-100/50', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-100 shadow-2xl text-xs space-y-2">
                <p className="font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                     <div key={index} className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                           <span className="text-slate-500 font-bold uppercase tracking-tighter">{entry.name}</span>
                        </div>
                        <span className="font-black text-slate-900">{entry.value}</span>
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
        { name: 'Solicitud', value: ots.filter(o => o.stage === 'solicitud').length },
        { name: 'Gestión', value: ots.filter(o => o.stage === 'gestion').length },
        { name: 'Finalizado', value: ots.filter(o => o.stage === 'finalizado').length },
    ];

    const documentStatusData = [
        { name: 'Validados', value: 45 },
        { name: 'Subidos', value: 30 },
        { name: 'Pendientes', value: 15 },
        { name: 'Rechazados', value: 10 },
    ];

    const getDeadlineBadge = (deadline: string) => {
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 2) return <Badge className="bg-rose-50 text-rose-700 border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-tighter">Vence Hoy</Badge>;
        if (days < 5) return <Badge className="bg-amber-50 text-amber-700 border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-tighter">{days}d faltan</Badge>;
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-tighter">A tiempo</Badge>;
    };

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Torre de Control <ShieldCheck className="text-blue-600 h-8 w-8" />
                    </h1>
                    <p className="text-slate-400 font-semibold mt-1">Supervisión en tiempo real de trámites y validaciones AI.</p>
                </div>
                <div className="flex gap-4">
                     <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 hover:bg-slate-50 font-bold transition-all shadow-sm">
                        <Download className="h-4 w-4 mr-2" /> Reporte Global
                     </Button>
                     <Button className="btn-primary rounded-2xl h-12 px-6 shadow-lg shadow-blue-500/20 font-bold transition-all">
                        <Activity className="h-4 w-4 mr-2" /> Nueva Operación
                     </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card p-6 flex items-center justify-between animate-fade-scale" style={{animationDelay: '0ms'}}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trámites Totales</p>
                        <h3 className="text-4xl font-black text-slate-900">{totalOTs}</h3>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            <ArrowUpRight className="h-3 w-3" /> +12% este mes
                        </div>
                    </div>
                    <div className="icon-badge bg-blue-50 text-blue-600">
                        <Activity className="h-6 w-6" />
                    </div>
                </div>

                <div className="stat-card p-6 flex items-center justify-between animate-fade-scale" style={{animationDelay: '100ms'}}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestiones Activas</p>
                        <h3 className="text-4xl font-black text-slate-900">{activeOTs}</h3>
                        <div className="flex items-center gap-1 text-blue-600 text-xs font-bold mt-2 bg-blue-50 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            En curso
                        </div>
                    </div>
                    <div className="icon-badge bg-emerald-50 text-emerald-600">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>

                <div className="stat-card p-6 flex items-center justify-between animate-fade-scale" style={{animationDelay: '200ms'}}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alertas Críticas</p>
                        <h3 className="text-4xl font-black text-slate-900">{criticalOTs}</h3>
                        <div className="flex items-center gap-1 text-rose-600 text-xs font-bold mt-2 bg-rose-50 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Requiere Atención
                        </div>
                    </div>
                    <div className="icon-badge bg-rose-50 text-rose-600 shadow-rose-200/50">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl w-fit">
                    <TabsTrigger value="solicitudes" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 transition-all">
                        Operaciones
                    </TabsTrigger>
                    <TabsTrigger value="clientes" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-700 transition-all">
                        Gestión Clientes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="solicitudes" className="space-y-8 animate-fade-in">
                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />
                            <CardHeader className="pt-8 px-8">
                                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Eficiencia AI</CardTitle>
                                <CardDescription className="font-semibold text-slate-400">Automatización vs Manual</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px] p-6 pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={efficiencyData}>
                                        <defs>
                                            <linearGradient id="adminAi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="ai" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#adminAi)" />
                                        <Area type="monotone" dataKey="manual" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 6" fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500" />
                            <CardHeader className="pt-8 px-8">
                                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Carga por Etapa</CardTitle>
                                <CardDescription className="font-semibold text-slate-400">Distribución Maestra</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px] p-6 pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData} barSize={40}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 12}} />
                                        <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                                            {distributionData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e3a8a' : '#4f46e5'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
                            <CardHeader className="pt-8 px-8">
                                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Estado Documental</CardTitle>
                                <CardDescription className="font-semibold text-slate-400">Salud del Repositorio</CardDescription>
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-slate-900">85%</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Salud</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Global OT Table */}
                    <Card className="rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden border-none">
                         <CardHeader className="p-8 bg-white border-b border-slate-50">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Tablero Maestro</CardTitle>
                                    <CardDescription className="font-semibold text-slate-400">Control total del flujo transaccional</CardDescription>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-72">
                                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar trámite, ID o cliente..." 
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-sm placeholder:text-slate-400"
                                        />
                                    </div>
                                    <Button variant="outline" className="rounded-2xl h-11 border-slate-200 px-5 shadow-sm">
                                        <Filter className="h-4 w-4 mr-2" /> Filtros
                                    </Button>
                                </div>
                            </div>
                         </CardHeader>
                         <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                 <thead className="bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-slate-200">
                                    <tr>
                                        <th className="px-8 py-4 text-left">Referencia</th>
                                        <th className="px-8 py-4 text-left">Cliente / Empresa</th>
                                        <th className="px-8 py-4 text-left">Etapa Actual</th>
                                        <th className="px-8 py-4 text-center">Estado Deadline</th>
                                        <th className="px-8 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-slate-50">
                                     {ots.map((ot, idx) => (
                                        <tr key={ot.id} className={cn(
                                          "group transition-all hover:bg-blue-50/30",
                                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                                        )}>
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-4">
                                                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg", STAGE_CONFIG[ot.stage].color)}>
                                                      {ot.id.split('-')[1]?.[0] || 'O'}
                                                   </div>
                                                   <div>
                                                      <span className="font-black text-slate-900 block group-hover:text-blue-600 transition-colors uppercase tracking-tighter">
                                                        OT-{ot.id.split('-')[1] || ot.id}
                                                      </span>
                                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{ot.serviceType}</span>
                                                   </div>
                                                 </div>
                                             </td>
                                             <td className="px-8 py-5">
                                                 <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                       <AvatarFallback className="bg-slate-900 text-white text-[10px] font-bold">{ot.companyId?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-700">{ot.companyId}</span>
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
                                                    onClick={() => setSelectedOT(ot)}
                                                    className="rounded-2xl hover:bg-blue-600 hover:text-white transition-all font-bold group/btn shadow-sm bg-white border border-slate-200 hover:border-blue-400"
                                                >
                                                     <Eye className="h-4 w-4 mr-2" /> Detalle
                                                 </Button>
                                             </td>
                                        </tr>
                                     ))}
                                 </tbody>
                            </table>
                         </div>
                    </Card>
                </TabsContent>

                <TabsContent value="clientes" className="animate-fade-in">
                    <ClientList />
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
