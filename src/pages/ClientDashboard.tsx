import { useEffect } from 'react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Clock, FileText, ArrowRight } from 'lucide-react';
import AIChatbot from '@/components/AIChatbot';
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STAGE_COLORS: Record<string, string> = {
    solicitud: 'border-l-amber-500',
    pago_adelanto: 'border-l-sky-500',
    gestion: 'border-l-indigo-500',
    pago_cierre: 'border-l-purple-500',
    finalizado: 'border-l-emerald-500'
};

const STAGE_DOT_COLORS: Record<string, string> = {
    solicitud: 'bg-amber-500',
    pago_adelanto: 'bg-sky-500',
    gestion: 'bg-indigo-500',
    pago_cierre: 'bg-purple-500',
    finalizado: 'bg-emerald-500'
};

const STAGES = ['solicitud', 'pago_adelanto', 'gestion', 'pago_cierre', 'finalizado'];

const CountdownBanner = ({ deadline }: { deadline: string }) => {
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    // Assume 30 days is the full window for the progress bar
    const progress = Math.max(0, Math.min(100, (daysLeft / 30) * 100));
    
    return (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group animate-fade-in text-slate-800">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Clock className="h-6 w-6 text-blue-200" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">¡Completa tus documentos a tiempo!</h2>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Si envías todo antes de {daysLeft} días, obtienes un <strong>5% de descuento</strong> en tu pago final.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/10 rounded-full border border-white/20 backdrop-blur-md shadow-inner">
                    <span className="text-3xl font-black text-white leading-none">{daysLeft}</span>
                    <span className="text-[10px] uppercase font-bold tracking-tighter text-blue-200 mt-1">días</span>
                </div>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full">
                <div 
                    className="h-full bg-blue-300 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(147,197,253,0.5)]" 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
};

const OTCardProgress = ({ currentStage }: { currentStage: string }) => {
    const currentIndex = STAGES.indexOf(currentStage);
    return (
        <div className="flex items-center justify-between w-full gap-1 mt-4">
            {STAGES.map((stage, i) => (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={cn(
                        "h-1.5 w-full rounded-full transition-all duration-300",
                        i <= currentIndex ? STAGE_DOT_COLORS[stage] : "bg-slate-100"
                    )} />
                </div>
            ))}
        </div>
    );
};

const ClientDashboard = () => {
    const { user } = useAuthStore();
    const { ots, loading } = useDataStore();

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

    const activeOT = ots.find(ot => ot.stage !== 'finalizado');

    return (
        <div className="max-w-7xl mx-auto py-2">
            <header className="mb-8 border-b border-slate-100 pb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hola, {user?.displayName || 'Usuario'} 👋</h1>
                  <p className="text-slate-500 mt-1">Bienvenido a tu panel de gestión de trámites.</p>
                </div>
            </header>

            {activeOT && activeOT.deadline && (
                <CountdownBanner deadline={activeOT.deadline} />
            )}

            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-slate-800">Mis Trámites Activos</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full border border-blue-200">
                    {ots.length}
                </span>
            </div>
            
            {ots.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {ots.map((ot) => (
                        <div 
                          key={ot.id} 
                          className={cn(
                            "surface-card border-l-[6px] transition-all hover:-translate-y-1 hover:shadow-lg p-5 flex flex-col justify-between",
                            STAGE_COLORS[ot.stage]
                          )}
                        >
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                  <div className="bg-slate-50 text-slate-400 font-mono text-[10px] px-2 py-1 rounded border border-slate-100">
                                      {ot.id}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-slate-100/80 text-slate-600 text-[10px] uppercase font-bold rounded-lg border border-slate-200/50">
                                        {ot.serviceType}
                                    </span>
                                    {ot.stage !== 'finalizado' && (
                                      <div className={cn("w-2 h-2 rounded-full animate-pulse", STAGE_DOT_COLORS[ot.stage])} />
                                    )}
                                  </div>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 leading-snug mb-1">{ot.title}</h3>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Iniciado el {format(new Date(ot.createdAt), "d 'de' MMMM", { locale: es })}
                              </p>

                              <OTCardProgress currentStage={ot.stage} />
                              <p className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">
                                Etapa: <span className="text-slate-900">{ot.stage.replace('_', ' ')}</span>
                              </p>
                            </div>

                            <div className="pt-6 flex gap-3">
                                 <Button variant="ghost" className="flex-1 text-slate-500 hover:bg-slate-50 text-xs font-semibold h-10 rounded-xl">
                                    Ver Detalles
                                 </Button>
                                 <Button className="flex-1 btn-primary text-xs h-10 group px-4">
                                    Ir al Panel
                                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                 </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm animate-fade-scale">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                      <FileText className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No tienes trámites activos</h3>
                    <p className="text-slate-500 mt-2 text-center max-w-xs mb-8">
                      Inicia tu primera solicitud de Propiedad Intelectual para comenzar la gestión inteligente.
                    </p>
                    <Button className="btn-primary px-8 h-12 shadow-blue-500/20">
                      Nueva Solicitud
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
            
            <AIChatbot />
        </div>
    );
};

export default ClientDashboard;
