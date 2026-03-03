import { useEffect, useState } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { FileText } from 'lucide-react';
import OTDetailsModal from '@/components/OTDetailsModal';
import KanbanBoard from '@/components/dashboard/KanbanBoard';

const ClientDashboard = () => {
    const { user } = useAuthStore();
    const { ots, loading } = useDataStore();
    const [selectedOT, setSelectedOT] = useState<OT | null>(null);

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = useDataStore.getState().subscribeToClientData(user.uid);
            return () => unsubscribe();
        }
    }, [user]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Cargando tu panel inteligente...</p>
        </div>
    );

    return (
        <div className="max-w-[1800px] mx-auto py-2 h-[calc(100vh-6rem)] flex flex-col space-y-6">
            <header className="flex justify-between items-end border-b border-slate-100/50 pb-4 shrink-0">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hola, {user?.displayName || 'Usuario'} 👋</h1>
                  <p className="text-slate-500 text-sm mt-1">Gestión de trámites y seguimiento en tiempo real.</p>
                </div>
            </header>

            <div className="flex-1 min-h-0 flex flex-col">
                {ots.length > 0 ? (
                    <div className="flex-1 bg-white/50 border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col min-h-0">
                        <div className="flex items-center gap-3 mb-6 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800">Mis Trámites Activos</h2>
                            <span className="bg-blue-50 text-blue-600 text-xs font-black px-2.5 py-1 rounded-full border border-blue-100">
                                {ots.length}
                            </span>
                        </div>
                        
                        <div className="flex-1 min-h-0 bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden p-4">
                            <KanbanBoard userOts={ots} onSelectOt={setSelectedOT} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-sm animate-fade-scale p-8">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8">
                          <FileText className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">No tienes trámites activos</h3>
                        <p className="text-slate-500 mt-3 text-center max-w-sm mb-0">
                          El equipo de SPI cargará tus solicitudes aquí.
                        </p>
                    </div>
                )}
            </div>
            
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

export default ClientDashboard;
