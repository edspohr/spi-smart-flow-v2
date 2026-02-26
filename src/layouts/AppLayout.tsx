import { Outlet, useLocation, Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Sidebar from './Sidebar';
import { Bell, Search, Settings, HelpCircle, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"

const AppLayout = () => {
    const { user, loading, logout } = useAuthStore();
    const location = useLocation();

    if (loading) {
        return (
             <div className="flex h-screen items-center justify-center bg-white">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-2xl bg-blue-600/20 animate-pulse" />
                    <div className="absolute inset-4 rounded-xl bg-blue-600 animate-spin border-4 border-white border-t-transparent shadow-xl" />
                </div>
             </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />; 
    }

    const breadcrumbMap: Record<string, string> = {
      '/client': 'Mi Tablero',
      '/client/vault': 'Bóveda Smart',
      '/client-admin': 'Consola Corporativa',
      '/spi-admin': 'Torre de Control'
    };

    const currentTitle = breadcrumbMap[location.pathname] || 'Portal SPI';
    const isSpi = user.role === 'spi-admin';

    return (
        <div className={cn(
            "min-h-screen font-sans selection:bg-blue-200 selection:text-blue-900",
            isSpi ? "bg-[#0B1121] text-slate-200" : "bg-slate-50/30"
        )}>
            <Sidebar />
            
            <div className="pl-72 transition-all duration-300">
                {/* Header */}
                <header className={cn(
                    "fixed top-0 right-0 left-72 z-40 h-20 backdrop-blur-2xl flex items-center justify-between px-10 border-b",
                    isSpi ? "bg-[#0B1121]/80 border-slate-800" : "bg-white/60 border-slate-100"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]",
                            isSpi ? "text-slate-500" : "text-slate-400"
                        )}>
                            <span>Plataforma</span>
                            <span className={cn(isSpi ? "text-slate-700" : "text-slate-200")}>/</span>
                            <span className={isSpi ? "text-blue-400" : "text-blue-600"}>{currentTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Search Quick Action */}
                        <div className={cn(
                            "hidden lg:flex items-center rounded-2xl px-4 py-2 border group focus-within:ring-2 transition-all",
                            isSpi 
                              ? "bg-slate-900/50 border-slate-800 focus-within:ring-blue-500/30" 
                              : "bg-slate-100/50 border-slate-100 focus-within:ring-blue-100"
                        )}>
                            <Search className={cn("h-4 w-4", isSpi ? "text-slate-500 group-focus-within:text-blue-400" : "text-slate-400 group-focus-within:text-blue-500")} />
                            <input 
                                type="text" 
                                placeholder="Buscar en el sistema..." 
                                className={cn(
                                    "bg-transparent border-none text-xs font-bold px-3 focus:outline-none w-48",
                                    isSpi ? "text-slate-200 placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
                                )}
                            />
                            <div className={cn(
                                "text-[10px] font-black px-1.5 py-0.5 rounded border",
                                isSpi ? "text-slate-600 bg-slate-800 border-slate-700" : "text-slate-300 bg-white border-slate-100"
                            )}>⌘K</div>
                        </div>

                         <div title="Notificaciones" className="relative">
                            <Button variant="ghost" size="icon" className={cn(
                                "h-11 w-11 rounded-2xl border transition-all shadow-sm",
                                isSpi 
                                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-800" 
                                  : "bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            )}>
                                <Bell className="h-5 w-5" />
                                <span className={cn(
                                    "absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500 ring-2",
                                    isSpi ? "ring-slate-900" : "ring-white"
                                )}>
                                  <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></span>
                                </span>
                            </Button>
                         </div>

                        <Separator orientation="vertical" className={cn("h-8", isSpi ? "bg-slate-800" : "bg-slate-100")} />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative flex items-center gap-3 h-12 px-2 hover:bg-transparent rounded-2xl transition-all">
                                    <Avatar className={cn(
                                        "h-9 w-9 rounded-xl border-none shadow-lg",
                                        isSpi ? "shadow-black/50" : "shadow-slate-200/50"
                                    )}>
                                        <AvatarImage src="/avatars/01.png" alt={user.displayName || "User"} />
                                        <AvatarFallback className="bg-blue-600 text-white font-black text-xs uppercase">
                                          {user.displayName?.substring(0,2).toUpperCase() || "US"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start leading-none text-left mr-2">
                                        <p className={cn("text-sm font-black tracking-tight", isSpi ? "text-slate-100" : "text-slate-900")}>
                                            {user.displayName || user.email?.split('@')[0]}
                                        </p>
                                        <p className={cn("text-[9px] font-black uppercase tracking-widest mt-1", isSpi ? "text-slate-500" : "text-slate-400")}>
                                            Nivel: Full Access
                                        </p>
                                    </div>
                                    <ChevronDown className={cn("h-4 w-4", isSpi ? "text-slate-600" : "text-slate-300")} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 p-2 rounded-[1.5rem] border-none shadow-2xl ring-1 ring-slate-100" align="end" sideOffset={12}>
                                <DropdownMenuLabel className="p-4">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cuenta de Usuario</p>
                                        <p className="text-sm font-black text-slate-900 truncate">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="p-3 rounded-xl focus:bg-blue-50 flex items-center gap-3 cursor-pointer group">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">Ajustes de Perfil</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-3 rounded-xl focus:bg-blue-50 flex items-center gap-3 cursor-pointer group">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">Centro de Ayuda</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem onClick={() => logout()} className="p-3 rounded-xl focus:bg-rose-50 text-rose-600 flex items-center gap-3 cursor-pointer group">
                                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                        <LogOut className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold">Terminar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="pt-20 px-10 pb-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
