import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import {
  LayoutDashboard,
  FileText,
  Building2,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const Sidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case 'client':
        return [
          { href: '/client',       label: 'Mis Solicitudes',      icon: FileText },
          { href: '/client/vault', label: 'Bóveda de Documentos', icon: ShieldCheck },
        ];
      case 'spi-admin':
        return [
          { href: '/spi-admin',           label: 'Torre de Control', icon: LayoutDashboard },
          { href: '/spi-admin/companies', label: 'Empresas',          icon: Building2 },
          { href: '/spi-admin/vault',     label: 'Bóveda Global',     icon: ShieldCheck },
        ];
      case 'guest':
        return [];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-slate-900 border-r border-slate-800 transition-all duration-500 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* 1. Logo Area */}
      <div className="p-10 shrink-0">
        <div className="flex items-center gap-4 group cursor-pointer relative">
          {/* Subtle Glow behind logo */}
          <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-2xl group-hover:scale-105 group-hover:border-blue-500/50 transition-all duration-500 relative z-10 p-2 overflow-hidden">
            <img src="/spi-logo.png" alt="SPI" className="h-full w-full object-contain" />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent pointer-events-none" />
          </div>
          
          <div className="flex flex-col relative z-10 transition-transform duration-500 group-hover:translate-x-1">
            <span className="font-extrabold text-white text-3xl tracking-tighter leading-none italic">SPI</span>
            <span className="text-teal-400 font-black text-[9px] uppercase tracking-[0.4em] mt-1.5 opacity-80">Smart Flow</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 scrollbar-hide">
        <div>
          <p className="px-4 mb-6 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500/80 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-slate-800" />
            MENÚ PRINCIPAL
          </p>
          <nav className="space-y-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <li key={link.href} className="list-none group">
                  <Link
                    to={link.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 transition-all duration-300 rounded-2xl relative group overflow-hidden border border-transparent",
                      isActive
                        ? "bg-blue-600/10 text-white border-blue-500/30 glow-blue shadow-lg shadow-blue-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:translate-x-1"
                    )}
                  >
                    {/* Active Indicator Line */}
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-blue-400 to-teal-400 rounded-r-full" />
                    )}
                    
                    <Icon className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "text-blue-400 scale-110" : "group-hover:text-blue-400 group-hover:scale-110"
                    )} />
                    
                    <span className={cn(
                      "text-sm tracking-tight transition-all",
                      isActive ? "font-bold" : "font-medium"
                    )}>
                      {link.label}
                    </span>
                    
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-pulse" />
                    )}
                  </Link>
                </li>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. Bottom Section: User Info Card */}
      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 group/user shadow-2xl hover:border-white/20 transition-all duration-500 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-800 shadow-2xl group-hover/user:scale-110 transition-transform duration-500">
                <AvatarFallback className="bg-premium-gradient text-white font-black text-xl">
                  {user.role?.[0].toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg shadow-emerald-500/30" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate tracking-tight group-hover/user:text-blue-300 transition-colors">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-80">
                {user.role.replace('-', ' ')}
              </p>
            </div>
          </div>

          <Separator className="my-5 bg-white/5" />

          <Button
            variant="ghost"
            className="w-full justify-start gap-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 rounded-2xl px-2 h-12"
            onClick={() => useAuthStore.getState().logout()}
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/user:bg-rose-500/10 transition-all">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
