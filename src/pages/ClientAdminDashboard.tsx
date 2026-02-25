import { useState, useEffect } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, TrendingUp, AlertTriangle, Users, Eye, 
  Briefcase, Search, Filter, ArrowUpRight, Clock,
  Building2, ShieldCheck, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OTDetailsModal from '@/components/OTDetailsModal';

const STAGE_CONFIG: Record<string, { label: string; badge: string }> = {
    solicitud: { label: 'Solicitud', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    pago_adelanto: { label: 'Pago Inicial', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
    gestion: { label: 'En Gestión', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    pago_cierre: { label: 'Pago Final', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
    finalizado: { label: 'Finalizado', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

const ClientAdminDashboard = () => {
    const { user } = useAuthStore();
    const { ots, subscribeToCompanyData } = useDataStore();
    const [selectedOT, setSelectedOT] = useState<OT | null>(null);
    const [isvalModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (user?.companyId) {
            const unsubscribe = subscribeToCompanyData(user.companyId);
            return () => unsubscribe();
        }
    }, [user, subscribeToCompanyData]);

    const activeOTs = ots.filter(ot => ot.stage !== 'finalizado');
    const riskOTs = ots.filter(ot => {
        const daysLeft = Math.ceil((new Date(ot.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft < 2 && ot.stage !== 'finalizado';
    });

    const getDeadlineBadge = (deadline: string) => {
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return <Badge className="bg-rose-50 text-rose-700 border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-tighter">Vencido</Badge>;
        if (days < 3) return <Badge className="bg-amber-50 text-amber-700 border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-tighter">Vence Pronto</Badge>;
        return <Badge className="bg-slate-50 text-slate-500 border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-tighter">{days}d faltan</Badge>;
    };

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-fade-in">
             {/* Header */}
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Client Admin Console</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        {user?.companyId || 'Panel Corporativo'}
                    </h1>
                </div>
                <div className="flex gap-4">
                     <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 hover:bg-slate-50 font-bold transition-all shadow-sm">
                        <Download className="h-4 w-4 mr-2" /> Exportar Datos
                     </Button>
                     <Button className="btn-primary rounded-2xl h-12 px-6 shadow-lg shadow-blue-500/20 font-bold transition-all">
                        <Briefcase className="h-4 w-4 mr-2" /> Nuevo Trámite
                     </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card p-6 flex items-center justify-between" style={{animationDelay: '0ms'}}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inversión Total</p>
                        <h3 className="text-3xl font-black text-slate-900">
                             ${ots.reduce((acc, ot) => acc + (ot.amount || 0), 0).toLocaleString()}
                        </h3>
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            <ArrowUpRight className="h-3 w-3" /> Actualizado
                        </div>
                    </div>
                    <div className="icon-badge bg-emerald-50 text-emerald-600">
                        <DollarSign className="h-6 w-6" />
                    </div>
                </div>

                <div className="stat-card p-6 flex items-center justify-between" style={{animationDelay: '100ms'}}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operaciones Activas</p>
                        <h3 className="text-3xl font-black text-slate-900">{activeOTs.length}</h3>
                        <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">
                            {ots.length - activeOTs.length} completadas
                        </div>
                    </div>
                    <div className="icon-badge bg-blue-50 text-blue-600">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>

                <div className="stat-card p-6 flex items-center justify-between" style={{animationDelay: '200ms'}}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alertas Críticas</p>
                        <h3 className="text-3xl font-black text-slate-900">{riskOTs.length}</h3>
                        <div className="flex items-center gap-1 text-rose-600 text-[10px] font-black mt-2 bg-rose-50 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Vencen pronto
                        </div>
                    </div>
                    <div className="icon-badge bg-rose-50 text-rose-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                </div>

                <div className="stat-card p-6 flex items-center justify-between" style={{animationDelay: '300ms'}}>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Salud Legal</p>
                        <h3 className="text-3xl font-black text-slate-900">A+</h3>
                        <div className="flex items-center gap-1 text-blue-600 text-[10px] font-black mt-2 bg-blue-50 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            <ShieldCheck className="h-3 w-3" /> Verificado
                        </div>
                    </div>
                    <div className="icon-badge bg-indigo-50 text-indigo-600">
                        <Users className="h-6 w-6" />
                    </div>
                </div>
            </div>
            
            {/* Global OT Table */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/40 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Registro de Trámites</CardTitle>
                                <CardDescription className="font-semibold text-slate-400">Listado consolidado de gestiones corporativas</CardDescription>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-72">
                                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 font-bold" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por ID o título..." 
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-sm placeholder:text-slate-400"
                                    />
                                </div>
                                <Button variant="outline" className="rounded-2xl h-11 border-slate-200 px-5 shadow-sm font-bold">
                                    <Filter className="h-4 w-4 mr-2" /> Filtros
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-left">
                                <tr>
                                    <th className="px-8 py-4">Referencia / ID</th>
                                    <th className="px-8 py-4">Descripción del Servicio</th>
                                    <th className="px-8 py-4">Etapa Actual</th>
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
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 uppercase tracking-tighter">
                                                    OT-{ot.id.split('-')[1] || ot.id}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[100px]">{ot.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div>
                                                <p className="font-black text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{ot.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{ot.serviceType}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <Badge className={cn("px-4 py-1 shadow-none rounded-xl text-[10px] font-black tracking-widest uppercase border", STAGE_CONFIG[ot.stage].badge)}>
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
                                                onClick={() => { setSelectedOT(ot); setModalOpen(true); }}
                                                className="rounded-2xl h-10 px-4 hover:bg-blue-600 hover:text-white transition-all font-bold group/btn shadow-sm bg-white border border-slate-100"
                                            >
                                                <Eye className="h-4 w-4 mr-2" /> Ver Detalles
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {ots.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <Clock className="h-12 w-12 text-slate-200 mb-4" />
                                                <p className="text-slate-400 font-semibold italic text-lg">No hay operaciones activas registradas.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
            </Card>

            {selectedOT && (
                <OTDetailsModal 
                    open={isvalModalOpen}
                    onOpenChange={setModalOpen}
                    ot={selectedOT}
                />
            )}
        </div>
    );
};

export default ClientAdminDashboard;
