import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import useAuthStore from '../store/useAuthStore';
import Sidebar from './Sidebar';
import {
  Bell, Search, Settings, HelpCircle, ChevronDown, LogOut,
  CheckCircle2, XCircle, ArrowRight, AlertTriangle, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, safeDate } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Log } from '../store/types';

const LAST_SEEN_KEY = (uid: string) => `spi_notif_seen_${uid}`;
const MAX_NOTIFS = 20;

function notifIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes('rechaz')) return <XCircle className="h-4 w-4 text-rose-400" />;
  if (a.includes('aprobad') || a.includes('validado') || a.includes('auto-aprobado'))
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (a.includes('etapa') || a.includes('avanzad'))
    return <ArrowRight className="h-4 w-4 text-blue-400" />;
  if (a.includes('vencimiento') || a.includes('plazo') || a.includes('escalad'))
    return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  return <Activity className="h-4 w-4 text-slate-400" />;
}

const mockMode = import.meta.env.VITE_MOCK_MODE === 'true';

const AppLayout = () => {
  const { user, loading, logout } = useAuthStore();
  const location = useLocation();

  const [notifications, setNotifications] = useState<Log[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string>('');
  const [notifOpen, setNotifOpen] = useState(false);

  // Load lastSeenAt from localStorage once user is known
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(LAST_SEEN_KEY(user.uid)) || '';
    setLastSeenAt(stored);
  }, [user?.uid]);

  // Subscribe to recent system logs (spi-admin only)
  useEffect(() => {
    if (!user || user.role !== 'spi-admin') return;
    const q = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(MAX_NOTIFS)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Log))
          .filter(log =>
            !log.action.includes('Recordatorio Automático') &&
            !log.action.includes('ALERTA DE ESCALAMIENTO') &&
            !log.action.includes('Auto-recovered') &&
            log.userId !== 'pipefy' &&
            log.userId !== 'system'
          )
      );
    });
    return unsub;
  }, [user?.uid, user?.role]);

  const markAllRead = () => {
    if (!user) return;
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY(user.uid), now);
    setLastSeenAt(now);
  };

  const handleBellOpen = (open: boolean) => {
    setNotifOpen(open);
    if (open) markAllRead();
  };

  const unreadCount = notifications.filter(
    (n) => !lastSeenAt || n.timestamp > lastSeenAt
  ).length;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B1121]">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <img
            src="/spi-logo.png"
            alt="SPI Loading..."
            className="h-20 w-20 relative animate-[spin_3s_linear_infinite]"
          />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const breadcrumbMap: Record<string, string> = {
    '/client': 'Mi Tablero',
    '/client/vault': 'Bóveda Smart',
    '/spi-admin': 'Torre de Control',
    '/spi-admin/usuarios': 'Usuarios',
    '/spi-admin/companies': 'Empresas',
    '/spi-admin/vault': 'Bóveda Global',
    '/spi-admin/configuracion-solicitudes': 'Tipos de Actuación',
  };
  const currentTitle = breadcrumbMap[location.pathname] || 'Portal SPI';
  const isSpi = user.role === 'spi-admin';

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-blue-200 selection:text-blue-900",
      isSpi ? "bg-[#0B1121] text-slate-200" : "bg-slate-50/30"
    )}>
      {mockMode && (
        <div className="fixed top-0 left-0 right-0 z-50 h-10 bg-yellow-400 flex items-center justify-center">
          <span className="text-xs font-black text-yellow-900 tracking-wide">
            ⚠️ Modo de pruebas activo — integración con Pipefy desactivada
          </span>
        </div>
      )}

      <Sidebar />

      <div className={cn("pl-72 transition-all duration-300", mockMode && "mt-10")}>
        {/* Header */}
        <header className={cn(
          "fixed right-0 left-72 z-40 h-20 backdrop-blur-2xl flex items-center justify-between px-10 border-b",
          mockMode ? "top-10" : "top-0",
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
            {/* Search */}
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

            {/* Bell / Notifications */}
            <DropdownMenu open={notifOpen} onOpenChange={handleBellOpen}>
              <DropdownMenuTrigger asChild>
                <div className="relative">
                  <Button variant="ghost" size="icon" className={cn(
                    "h-11 w-11 rounded-2xl border transition-all shadow-sm",
                    isSpi
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                      : "bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  )}>
                    <Bell className="h-5 w-5" />
                  </Button>
                  {unreadCount > 0 && (
                    <span className={cn(
                      "absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 ring-2 flex items-center justify-center",
                      isSpi ? "ring-slate-900" : "ring-white"
                    )}>
                      <span className="text-[9px] font-black text-white leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </span>
                  )}
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-96 p-0 rounded-[1.5rem] border-slate-800 bg-[#0B1121] shadow-2xl shadow-black/60"
                align="end"
                sideOffset={12}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                  <div>
                    <p className="text-sm font-black text-white tracking-tight">Notificaciones</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      {notifications.length} recientes
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                {/* Feed */}
                <ScrollArea className="max-h-[420px]">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sin notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60 py-1">
                      {notifications.map((n) => {
                        const isUnread = !lastSeenAt || n.timestamp > lastSeenAt;
                        return (
                          <div
                            key={n.id}
                            className={cn(
                              "flex gap-3 px-5 py-3.5 transition-colors",
                              isUnread ? "bg-blue-500/5 hover:bg-blue-500/10" : "hover:bg-slate-800/30"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                              "bg-slate-800"
                            )}>
                              {notifIcon(n.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-xs font-bold leading-snug line-clamp-2",
                                isUnread ? "text-white" : "text-slate-400"
                              )}>
                                {n.action}
                              </p>
                              <p className="text-[10px] font-bold text-slate-600 mt-1">
                                {n.timestamp
                                  ? (() => { const d = safeDate(n.timestamp); return d ? format(d, "d MMM, HH:mm", { locale: es }) : '—'; })()
                                  : '—'}
                              </p>
                            </div>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className={cn("h-8", isSpi ? "bg-slate-800" : "bg-slate-100")} />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-3 h-12 px-2 hover:bg-transparent rounded-2xl transition-all">
                  <Avatar className={cn(
                    "h-9 w-9 rounded-xl border-none shadow-lg",
                    isSpi ? "shadow-black/50" : "shadow-slate-200/50"
                  )}>
                    <AvatarImage src="/avatars/01.png" alt={user.displayName || "User"} />
                    <AvatarFallback className="bg-blue-600 text-white font-black text-xs uppercase">
                      {user.displayName?.substring(0, 2).toUpperCase() || "US"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start leading-none text-left mr-2">
                    <p className={cn("text-sm font-black tracking-tight", isSpi ? "text-slate-100" : "text-slate-900")}>
                      {user.displayName || user.email?.split('@')[0]}
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
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
