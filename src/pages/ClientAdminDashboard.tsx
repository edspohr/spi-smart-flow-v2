import { useState, useEffect } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, AlertTriangle, Users, Eye } from 'lucide-react';
import OTDetailsModal from '@/components/OTDetailsModal';

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

    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold text-slate-800">Panel de Control: {user?.companyId}</h1>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Inversión Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${ots.reduce((acc, ot) => acc + (ot.amount || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> Actualizado hoy
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">OTs Activas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{activeOTs.length}</div>
                        <p className="text-xs text-slate-500 mt-1">{ots.length - activeOTs.length} finalizadas</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">En Riesgo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{riskOTs.length}</div>
                        <p className="text-xs text-amber-600 mt-1">Vencen en &lt; 2 días</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Equipo Activo</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">--</div>
                        <p className="text-xs text-slate-500 mt-1">Gestión de usuarios pronto</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* OT List */}
            <Card className="glass-card">
                 <CardHeader>
                    <CardTitle>Órdenes de Trabajo</CardTitle>
                    <CardDescription>Seguimiento de todas las solicitudes de la empresa</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">OT ID</th>
                                    <th className="px-4 py-3">Título</th>
                                    <th className="px-4 py-3">Servicio</th>
                                    <th className="px-4 py-3">Etapa</th>
                                    <th className="px-4 py-3">Deadline</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ots.map((ot) => (
                                    <tr key={ot.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{ot.id}</td>
                                        <td className="px-4 py-3 font-medium text-slate-800">{ot.title}</td>
                                        <td className="px-4 py-3 text-slate-600">{ot.serviceType}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="capitalize">
                                                {ot.stage.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {new Date(ot.deadline).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedOT(ot); setModalOpen(true); }}>
                                                <Eye className="h-4 w-4 mr-2" /> Bitácora
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
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

export default ClientAdminDashboard;
