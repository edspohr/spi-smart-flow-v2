import useAuthStore from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Hourglass, LogOut, ShieldCheck } from 'lucide-react';

const GuestDashboard = () => {
    const { logout } = useAuthStore();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/30">
            <Card className="max-w-2xl w-full border-none shadow-2xl shadow-blue-500/5 rounded-[2.5rem] overflow-hidden bg-white animate-fade-scale">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 h-32 flex items-center justify-center relative">
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid-guest" width="30" height="30" patternUnits="userSpaceOnUse">
                                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid-guest)" />
                        </svg>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center translate-y-12 border-8 border-slate-50">
                        <Hourglass className="h-10 w-10 text-blue-600 animate-pulse" />
                    </div>
                </div>

                <CardContent className="pt-20 pb-12 px-12 text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cuenta en Revisión</h1>
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Acceso Pendiente de Aprobación</span>
                        </div>
                    </div>

                    <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                        <p className="font-bold text-slate-800">
                            Bienvenido a SPI Smart Flow.
                        </p>
                        <p>
                            Tu cuenta ha sido creada exitosamente y actualmente se encuentra en estado de invitado. SPI Americas es líder en gestión estratégica de Propiedad Intelectual y Asuntos Regulatorios.
                        </p>
                        <p className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 text-blue-900 font-medium">
                            Un administrador revisará tus datos y te asignará el perfil correspondiente (Cliente o Admin) a la brevedad para que puedas comenzar a gestionar tus trámites en un entorno seguro.
                        </p>
                    </div>

                    <div className="pt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => logout()}
                            className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all font-bold uppercase tracking-widest text-[10px]"
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GuestDashboard;
