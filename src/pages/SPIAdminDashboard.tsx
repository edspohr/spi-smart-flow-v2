import { useEffect, useState } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { 
    Activity,  AlertTriangle, 
     Eye, Search, TrendingUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OTDetailsModal from '@/components/OTDetailsModal';

// --- Types & Data Helpers ---
const COLORS = [
    '#059669', // Emerald 600 (Validated)
    '#2563eb', // Blue 600 (Uploaded)
    '#e2e8f0', // Slate 200 (Pending)
    '#e11d48'  // Rose 600 (Rejected)
];

const STAGE_COLORS: Record<string, string> = {
    solicitud: 'bg-slate-100 text-slate-700',
    pago_adelanto: 'bg-indigo-50 text-indigo-700',
    gestion: 'bg-blue-50 text-blue-700',
    pago_cierre: 'bg-purple-50 text-purple-700',
    finalizado: 'bg-emerald-50 text-emerald-700'
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-lg border border-slate-200 shadow-lg text-sm">
                <p className="font-semibold text-slate-800">{label}</p>
                {payload.map((entry: any, index: number) => (
                     <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}: <span className="font-bold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const SPIAdminDashboard = () => {
    const { ots, subscribeToAllOTs } = useDataStore(); 
    
    // Derived Metrics
    // const totalOTs = ots.length; // Used inline
    // const activeOTs = ots.filter(ot => ot.stage !== 'finalizado').length; // Used inline
    // const criticalOTs = ots.filter(ot => ...).length; // Used inline

    const [selectedOT, setSelectedOT] = useState<OT | null>(null);
    
    useEffect(() => {
        const unsubscribe = subscribeToAllOTs();
        return () => unsubscribe();
    }, [subscribeToAllOTs]);

    // Derived Metrics
    const totalOTs = ots.length;
    const activeOTs = ots.filter(ot => ot.stage !== 'finalizado').length;
    const criticalOTs = ots.filter(ot => {
         const daysLeft = Math.ceil((new Date(ot.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
         return daysLeft < 2 && ot.stage !== 'finalizado';
    }).length;

    // --- Chart Data Preparation (Mocked/Derived) ---
    const efficiencyData = [
        { name: 'Mon', manual: 4, ai: 12 },
        { name: 'Tue', manual: 3, ai: 18 },
        { name: 'Wed', manual: 2, ai: 25 },
        { name: 'Thu', manual: 2, ai: 22 },
        { name: 'Fri', manual: 1, ai: 30 },
        { name: 'Sat', manual: 0, ai: 15 },
        { name: 'Sun', manual: 0, ai: 10 },
    ];

    const distributionData = [
        { name: 'Solicitud', value: ots.filter(o => o.stage === 'solicitud').length },
        { name: 'Gestión', value: ots.filter(o => o.stage === 'gestion').length },
        { name: 'Finalizado', value: ots.filter(o => o.stage === 'finalizado').length },
    ];

    const documentStatusData = [
        { name: 'Validated', value: 45 }, // Mock counts as we don't fetch all global docs yet
        { name: 'Uploaded', value: 30 },
        { name: 'Pending', value: 15 },
        { name: 'Rejected', value: 10 },
    ];

    const getDeadlineBadge = (deadline: string) => {
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 2) return <Badge variant="destructive" className="bg-rose-600 hover:bg-rose-700">Crucial: {days}d</Badge>;
        if (days < 5) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Riesgo: {days}d</Badge>;
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">OK: {days}d</Badge>;
    };

    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Control Tower</h1>
                    <p className="text-slate-500 mt-1">Monitoreo global de operaciones y eficiencia AI.</p>
                </div>
                <div className="flex gap-3">
                     <Card className="glass-card shadow-sm border-slate-200 px-4 py-2 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-full">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Total OTs</p>
                            <p className="text-xl font-bold text-slate-900">{totalOTs}</p>
                        </div>
                     </Card>
                     <Card className="glass-card shadow-sm border-slate-200 px-4 py-2 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-full">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Activas</p>
                            <p className="text-xl font-bold text-slate-900">{activeOTs}</p>
                        </div>
                     </Card>
                     <Card className="glass-card shadow-sm border-slate-200 px-4 py-2 flex items-center gap-3">
                        <div className="p-2 bg-rose-50 text-rose-700 rounded-full">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Riesgo</p>
                            <p className="text-xl font-bold text-slate-900">{criticalOTs}</p>
                        </div>
                     </Card>
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Validation Efficiency (AreaChart) */}
                <Card className="col-span-1 border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Eficiencia de Validación</CardTitle>
                        <CardDescription className="text-slate-500">Comparativa AI vs Manual (Última Semana)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={efficiencyData}>
                                <defs>
                                    <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3}/> {/* blue-800 */}
                                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/> {/* slate-500 */}
                                        <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="ai" 
                                    stroke="#1e3a8a" /* blue-900 */
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorAi)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="manual" 
                                    stroke="#94a3b8" /* slate-400 */
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fillOpacity={1} 
                                    fill="url(#colorManual)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. OT Distribution (BarChart) */}
                <Card className="col-span-1 border-none shadow-md bg-white">
                     <CardHeader>
                        <CardTitle className="text-slate-900">Distribución de OTs</CardTitle>
                        <CardDescription className="text-slate-500">Volumen actual por etapa</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData} barSize={40}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {distributionData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e40af' : '#64748b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 3. Document Status (DonutChart) */}
                <Card className="col-span-1 border-none shadow-md bg-white">
                     <CardHeader>
                        <CardTitle className="text-slate-900">Estado Documental</CardTitle>
                        <CardDescription className="text-slate-500">Proporción de validación</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                    data={documentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {documentStatusData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-slate-800">85%</span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest">Health</span>
                        </div>
                    </CardContent>
                </Card>

            </div>

             {/* Global OT Table */}
             <Card className="border-none shadow-md bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">Tablero Global de Operaciones</CardTitle>
                            <CardDescription>Vista maestra de solicitudes activas</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar OT, cliente, ID..." 
                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-64"
                            />
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Título / Servicio</th>
                                <th className="px-6 py-4 text-center">Etapa</th>
                                <th className="px-6 py-4 text-center">Deadline</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-100">
                             {ots.map((ot) => (
                                <tr key={ot.id} className="hover:bg-blue-50/30 transition-colors group">
                                     <td className="px-6 py-4 font-mono text-xs text-slate-500 group-hover:text-blue-700">
                                         {ot.id}
                                     </td>
                                     <td className="px-6 py-4 font-medium text-slate-700">
                                         {ot.companyId}
                                     </td>
                                     <td className="px-6 py-4">
                                         <p className="font-semibold text-slate-800">{ot.title}</p>
                                         <p className="text-xs text-slate-500">{ot.serviceType}</p>
                                     </td>
                                     <td className="px-6 py-4 text-center">
                                         <Badge variant="secondary" className={cn("capitalize shadow-none", STAGE_COLORS[ot.stage])}>
                                             {ot.stage.replace('_', ' ')}
                                         </Badge>
                                     </td>
                                     <td className="px-6 py-4 text-center">
                                         {getDeadlineBadge(ot.deadline)}
                                     </td>
                                     <td className="px-6 py-4 text-right">
                                         <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => setSelectedOT(ot)}
                                        >
                                             <Eye className="h-4 w-4 mr-2" />
                                             Ver Bitácora
                                         </Button>
                                     </td>
                                </tr>
                             ))}
                             {ots.length === 0 && (
                                 <tr>
                                     <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                         No hay operaciones activas en este momento.
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                    </table>
                </div>
            </Card>

            {selectedOT && (
                <OTDetailsModal 
                    isOpen={!!selectedOT}
                    onClose={() => setSelectedOT(null)}
                    ot={selectedOT}
                />
            )}
        </div>
    );
};

export default SPIAdminDashboard;
