import useAuthStore from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Hourglass, LogOut, ShieldCheck, MailCheck, Building } from 'lucide-react';

const GuestDashboard = () => {
    const { user, logout } = useAuthStore();

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid-guest" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-guest)" />
                    </svg>
                </div>
            </div>

            <div className="relative z-10 max-w-lg w-full">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-12 animate-fade-scale text-center">
                    
                    {/* Icon Container */}
                    <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                        <Hourglass className="h-10 w-10 text-blue-600 animate-pulse" />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                        Cuenta en Revisión
                    </h1>
                    
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-8 bg-blue-50/50 py-2 px-4 rounded-full w-max mx-auto border border-blue-100">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Acceso Pendiente</span>
                    </div>

                    <div className="space-y-6 text-slate-600 text-sm leading-relaxed text-left">
                        <p className="text-center font-medium text-slate-800">
                            ¡Hola, {user?.displayName || 'Usuario'}! Bienvenido a SPI Smart Flow.
                        </p>
                        
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                                    <Building className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Verificación de Empresa</h3>
                                    <p className="text-slate-500 text-xs">Nuestro equipo administrador está validando tu vinculación con la empresa registrada para garantizar la máxima seguridad de la información.</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                                    <MailCheck className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Activación de Perfil</h3>
                                    <p className="text-slate-500 text-xs">Una vez verificado, se te asignará tu perfil (Cliente o Admin) y podrás acceder a tu tablero de gestión de Propiedad Intelectual.</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="pt-10">
                        <Button 
                            variant="ghost" 
                            onClick={() => logout()}
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold uppercase tracking-widest text-[10px] w-full"
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                        </Button>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-blue-100 font-medium uppercase tracking-widest mix-blend-overlay">
                        © 2026 SPI Smart Flow
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GuestDashboard;
