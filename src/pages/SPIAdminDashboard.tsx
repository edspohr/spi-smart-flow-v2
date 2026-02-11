import { useState, useEffect } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye } from 'lucide-react';
import OTDetailsModal from '@/components/OTDetailsModal';
// import { cn } from '@/lib/utils'; // unused

const data = [
  { name: 'Lun', manual: 40, ia: 24 },
  { name: 'Mar', manual: 30, ia: 13 },
  { name: 'Mie', manual: 20, ia: 58 },
  { name: 'Jue', manual: 27, ia: 39 },
  { name: 'Vie', manual: 18, ia: 48 },
  { name: 'Sab', manual: 23, ia: 38 },
  { name: 'Dom', manual: 34, ia: 43 },
];

const SPIAdminDashboard = () => {
    const { ots, subscribeToAllOTs } = useDataStore();
    const [selectedOT, setSelectedOT] = useState<OT | null>(null);
    const [isvalModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAllOTs();
        return () => unsubscribe();
    }, [subscribeToAllOTs]);

    const handleOpenModal = (ot: OT) => {
        setSelectedOT(ot);
        setModalOpen(true);
    };

    const getDeadlineStatus = (deadline: string) => {
        const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 2) return 'red';
        if (daysLeft <= 5) return 'yellow';
        return 'green';
    };

    const renderSemaphore = (status: string) => {
        const colors = {
            red: "bg-red-500",
            yellow: "bg-amber-500",
            green: "bg-green-500"
        };
        return <div className={`h-3 w-3 rounded-full ${colors[status as keyof typeof colors]} shadow-sm`} title={status} />;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Torre de Control (SPI Admin)</h1>
            
            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Eficiencia de Validación</CardTitle>
                        <CardDescription>Comparativa de tiempo: Validación Manual vs IA (Gemini)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="manual" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorManual)" name="Manual" />
                                    <Area type="monotone" dataKey="ia" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorIa)" name="IA (Gemini)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="glass-card col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Estado General</CardTitle>
                        <CardDescription>Resumen de operaciones activas</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <span className="text-sm text-slate-500 font-medium">Total OTs Activas</span>
                                <div className="text-3xl font-bold text-slate-800 mt-1">{ots.length}</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <span className="text-sm text-slate-500 font-medium">Plazos Críticos</span>
                                <div className="text-3xl font-bold text-red-600 mt-1">
                                    {ots.filter(ot => getDeadlineStatus(ot.deadline) === 'red').length}
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <span className="text-sm text-slate-500 font-medium">IA Validaciones (Hoy)</span>
                                <div className="text-3xl font-bold text-green-600 mt-1">12</div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <span className="text-sm text-slate-500 font-medium">Pendientes de Pago</span>
                                <div className="text-3xl font-bold text-amber-600 mt-1">
                                     {ots.filter(ot => ot.stage.includes('pago')).length}
                                </div>
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Global OT List */}
            <Card className="glass-card">
                 <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Órdenes (Global)</CardTitle>
                        <CardDescription>Visualización en tiempo real de todos los clientes</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">OT ID / Cliente</th>
                                    <th className="px-4 py-3">Servicio</th>
                                    <th className="px-4 py-3">Etapa</th>
                                    <th className="px-4 py-3">Plazo</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ots.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                            No hay órdenes activas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    ots.map((ot) => (
                                        <tr key={ot.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                 {renderSemaphore(getDeadlineStatus(ot.deadline))}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-700">{ot.title}</div>
                                                <div className="text-xs text-slate-400">{ot.companyId}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {ot.serviceType}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="capitalize">
                                                    {ot.stage.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {new Date(ot.deadline).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenModal(ot)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Bitácora
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {selectedOT && (
                <OTDetailsModal 
                    isOpen={isvalModalOpen}
                    onClose={() => setModalOpen(false)}
                    ot={selectedOT}
                />
            )}
        </div>
    );
};

export default SPIAdminDashboard;
