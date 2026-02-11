import { useEffect } from 'react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertTriangle, Users } from 'lucide-react';

const ClientAdminDashboard = () => {
    const { user } = useAuthStore();
    const { loadMockData } = useDataStore();

    useEffect(() => {
        if (user) {
            loadMockData(user.role, user.uid);
        }
    }, [user, loadMockData]);

    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold text-slate-800">Panel de Control: {user?.companyId}</h1>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Ahorro Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">$12,450</div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> +15% vs mes anterior
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">OTs Activas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">8</div>
                        <p className="text-xs text-slate-500 mt-1">3 en etapa final</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">En Riesgo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">1</div>
                        <p className="text-xs text-amber-600 mt-1">Vence en 2 días</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Equipo Activo</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">4</div>
                        <p className="text-xs text-slate-500 mt-1">Usuarios registrados</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Additional content usually goes here, like a team table or active OT list similar to client dashboard */}
            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400">Gráficos detallados y tabla de gestión de equipo en construcción...</p>
            </div>
        </div>
    );
};

export default ClientAdminDashboard;
