import { Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Sidebar from './Sidebar';
import { Bell, Search, Settings, HelpCircle, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator";
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
        return <div className="p-10 font-bold text-slate-400">Sesión no validada. Reingrese.</div>; 
    }

    const breadcrumbMap: Record<string, string> = {
      '/client': 'Mi Tablero',
      '/client/vault': 'Bóveda Smart',
      '/client-admin': 'Consola Corporativa',
      '/spi-admin': 'Torre de Control'
    };

    const currentTitle = breadcrumbMap[location.pathname] || 'Portal SPI';

    return (
        <div className="min-h-screen bg-slate-50/30 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />
            
            <div className="pl-72 transition-all duration-300">
                {/* Header */}
                <header className="fixed top-0 right-0 left-72 z-40 h-20 bg-white/60 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <span>Plataforma</span>
                            <span className="text-slate-200">/</span>
                            <span className="text-blue-600">{currentTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Search Quick Action */}
                        <div className="hidden lg:flex items-center bg-slate-100/50 rounded-2xl px-4 py-2 border border-slate-100 group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar en el sistema..." 
                                className="bg-transparent border-none text-xs font-bold px-3 focus:outline-none w-48 placeholder:text-slate-400"
                            />
                            <div className="text-[10px] font-black text-slate-300 bg-white px-1.5 py-0.5 rounded border border-slate-100">⌘K</div>
                        </div>

                         <div title="Notificaciones" className="relative">
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                                <Bell className="h-5 w-5" />
                                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white">
                                  <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></span>
                                </span>
                            </Button>
                         </div>

                        <Separator orientation="vertical" className="h-8 bg-slate-100" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative flex items-center gap-3 h-12 px-2 hover:bg-slate-50 rounded-2xl transition-all">
                                    <Avatar className="h-9 w-9 rounded-xl border-none shadow-lg shadow-slate-200/50">
                                        <AvatarImage src="/avatars/01.png" alt={user.displayName || "User"} />
                                        <AvatarFallback className="bg-slate-900 text-white font-black text-xs uppercase">
                                          {user.displayName?.substring(0,2).toUpperCase() || "US"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start leading-none text-left mr-2">
                                        <p className="text-sm font-black text-slate-900 tracking-tight">{user.displayName || user.email?.split('@')[0]}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Nivel: Full Access</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-slate-300" />
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
