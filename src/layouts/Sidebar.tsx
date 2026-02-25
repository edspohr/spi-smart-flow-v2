import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Files, 
  Settings, 
  Users, 
  ShieldCheck, 
  BarChart, 
  LogOut,
  ChevronRight,
  Sparkles,
  Command,
  CreditCard
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
          { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/client/vault', label: 'Bóveda Smart', icon: ShieldCheck },
          { href: '/client/profile', label: 'Mi Perfil', icon: Users },
        ];
      case 'client-admin':
        return [
          { href: '/client-admin', label: 'Consola Corporativa', icon: BarChart },
          { href: '/client-admin/team', label: 'Gestión de Equipo', icon: Users },
          { href: '/client-admin/billing', label: 'Pagos y Facturas', icon: CreditCard },
        ];
      case 'spi-admin':
        return [
          { href: '/spi-admin', label: 'Torre de Control', icon: Command },
          { href: '/spi-admin/companies', label: 'Empresas Clientes', icon: Files },
          { href: '/spi-admin/settings', label: 'Sistema SPI', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-slate-900 border-r border-slate-800 transition-all duration-300 overflow-hidden flex flex-col">
      {/* 1. Logo Area */}
      <div className="p-8 shrink-0">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 group-hover:scale-110 transition-transform duration-500">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-2xl tracking-tighter leading-none">SPI</span>
            <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mt-1">Smart Flow</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
        <div>
          <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Menú Principal</p>
          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <li key={link.href} className="list-none group">
                  <Link 
                    to={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 transition-all duration-300 rounded-2xl relative overflow-hidden",
                      isActive 
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="text-sm font-bold tracking-tight">{link.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </Link>
                </li>
              );
            })}
          </nav>
        </div>

        {/* AI Feature Pill (Visual only) */}
        <div className="px-4">
            <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-blue-500/20 rounded-3xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">AI Assistant</p>
                <p className="text-xs font-bold text-slate-300 leading-tight">Optimiza tus trámites con nuestra IA avanzada.</p>
                <div className="mt-4 flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                    Explorar <ChevronRight className="h-3 w-3" />
                </div>
            </div>
        </div>
      </div>
      
      {/* 3. Bottom Section: User Info Card */}
      <div className="p-6 mt-auto">
        <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-5 border border-white/5 group hover:bg-white/10 transition-all duration-300">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 rounded-2xl border-none shadow-xl">
              <AvatarFallback className="bg-blue-600 text-white font-black text-lg">
                {user.role?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate tracking-tight">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                {user.role.replace('-', ' ')}
              </p>
            </div>
          </div>
          
          <Separator className="my-4 bg-white/5" />
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 rounded-xl px-0"
            onClick={() => useAuthStore.getState().logout()}
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-all">
                <LogOut className="h-4 w-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
