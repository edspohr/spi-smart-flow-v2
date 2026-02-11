import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, FileCheck } from 'lucide-react';
import { Progress } from "@/components/ui/progress"

const CountdownBanner = ({ deadline }: { deadline: string }) => {
    // Simple mock countdown logic for display
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">¡Completa tus documentos a tiempo!</h2>
                    <p className="opacity-90">Si envías todo antes de {daysLeft} días, obtienes un **5% de descuento** en tu pago final.</p>
                </div>
                <div className="text-center bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                    <span className="block text-3xl font-bold">{daysLeft}</span>
                    <span className="text-xs uppercase tracking-wide">Días restantes</span>
                </div>
            </div>
        </div>
    );
};

const ClientDashboard = () => {
    const { user } = useAuthStore();
    const { ots, loading } = useDataStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = useDataStore.getState().subscribeToClientData(user.uid);
            return () => unsubscribe();
        }
    }, [user]);

    if (loading) return <div className="p-10 text-center">Cargando dashboard...</div>;

    const activeOT = ots.find(ot => ot.stage !== 'finalizado');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-slate-800">Hola, {user?.displayName} 👋</h1>
                 <Button onClick={() => navigate('/client/new-request')} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
                 </Button>
            </div>

            {activeOT && activeOT.deadline && (
                <CountdownBanner deadline={activeOT.deadline} />
            )}

            <h2 className="text-xl font-semibold text-slate-700 mt-8">Mis Trámites Activos</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ots.map((ot) => (
                    <Card key={ot.id} className="glass-card border-l-4 border-l-blue-500 overflow-hidden">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold text-slate-800">{ot.title}</CardTitle>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                    {ot.serviceType}
                                </span>
                             </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Etapa actual:</span>
                                    <span className="font-semibold text-slate-700 uppercase">{ot.stage.replace('_', ' ')}</span>
                                </div>
                                <Progress value={ot.stage === 'gestion' ? 50 : 20} className="h-2" />
                                
                                <div className="pt-4 flex gap-2">
                                     <Button variant="outline" className="w-full text-xs" size="sm">Ver Detalles</Button>
                                     <Button className="w-full text-xs bg-slate-800" size="sm">
                                        <FileCheck className="mr-2 h-3 w-3" /> Subir Docs
                                     </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

             {/* Placeholder for no OTs */}
             {ots.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Clock className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No tienes trámites activos</h3>
                    <p className="mt-1 text-sm text-slate-500">Comienza una nueva solicitud para verla aquí.</p>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
