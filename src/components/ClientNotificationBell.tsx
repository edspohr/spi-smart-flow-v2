import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  CircleDollarSign,
  AlertCircle,
  ArrowRightCircle,
  Fingerprint,
  PartyPopper,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useClientNotifications from '@/hooks/useClientNotifications';
import useGlobalModalStore from '@/store/useGlobalModalStore';
import useOTStore from '@/store/useOTStore';
import type {
  NotificationIcon,
  NotificationIconColor,
  NotificationItem,
} from '@/lib/clientNotifications';

const ICON_MAP: Record<NotificationIcon, LucideIcon> = {
  CheckCircle2,
  XCircle,
  CircleDollarSign,
  AlertCircle,
  ArrowRightCircle,
  Fingerprint,
  PartyPopper,
};

const COLOR_CLASSES: Record<
  NotificationIconColor,
  { icon: string; bg: string; border: string; tint: string }
> = {
  green: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    tint: 'bg-emerald-50/40',
  },
  red: {
    icon: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-l-rose-500',
    tint: 'bg-rose-50/40',
  },
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    tint: 'bg-blue-50/40',
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-l-purple-500',
    tint: 'bg-purple-50/40',
  },
  amber: {
    icon: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    tint: 'bg-amber-50/40',
  },
  emerald: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    tint: 'bg-emerald-50/40',
  },
};

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'justo ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  try {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

const ClientNotificationBell = () => {
  const { notifications, unreadCount, markAllRead } = useClientNotifications();
  const openOTDetails = useGlobalModalStore((s) => s.openOTDetails);
  const ots = useOTStore((s) => s.ots);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [justMarkedRead, setJustMarkedRead] = useState(false);

  // On first open of the dropdown, push lastNotificationReadAt to server.
  useEffect(() => {
    if (!open) {
      setJustMarkedRead(false);
      return;
    }
    if (justMarkedRead) return;
    if (unreadCount > 0) {
      markAllRead().catch(() => {});
    }
    setJustMarkedRead(true);
  }, [open, unreadCount, markAllRead, justMarkedRead]);

  const handleItemClick = (n: NotificationItem) => {
    setOpen(false);
    const ot = ots.find((o) => o.id === n.otId);
    if (!ot) {
      toast('Esta OT ya no está en tu lista activa', {
        description: 'Abrimos tu bandeja para que la veas allí.',
      });
      navigate('/client/ots');
      return;
    }
    openOTDetails({
      otId: n.otId,
      defaultTab: n.deepLink.defaultTab,
      scrollToRequirementId: n.deepLink.scrollToRequirementId,
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl border bg-white border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
          >
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[380px] p-0 rounded-2xl border-slate-100 bg-white shadow-2xl shadow-slate-900/10"
        align="end"
        sideOffset={12}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-black text-slate-900 tracking-tight">
              Notificaciones
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {notifications.length === 0
                ? 'Sin actividad reciente'
                : `${notifications.length} ${notifications.length === 1 ? 'evento' : 'eventos'}`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => {
                markAllRead().catch(() => {});
              }}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
            >
              Marcar leídas
            </button>
          )}
        </div>

        <ScrollArea className="max-h-[480px]">
          {notifications.length === 0 ? (
            <div className="py-14 text-center px-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 mb-3">
                <Inbox className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-500">
                No tienes notificaciones nuevas
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Te avisaremos cuando haya novedades en tus solicitudes.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <NotificationRow key={n.id} item={n} onClick={handleItemClick} />
              ))}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface NotificationRowProps {
  item: NotificationItem;
  onClick: (item: NotificationItem) => void;
}

function NotificationRow({ item, onClick }: NotificationRowProps) {
  const Icon = ICON_MAP[item.icon];
  const colors = COLOR_CLASSES[item.iconColor];

  return (
    <li>
      <button
        type="button"
        onClick={() => onClick(item)}
        className={cn(
          'w-full flex gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50',
          item.isUnread && 'border-l-2',
          item.isUnread && colors.border,
          item.isUnread && colors.tint,
        )}
      >
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
            colors.bg,
          )}
        >
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-xs font-black leading-snug',
              item.isUnread ? 'text-slate-900' : 'text-slate-600',
            )}
          >
            {item.title}
          </p>
          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
            {item.body}
          </p>
        </div>
        <span className="text-[10px] font-bold text-slate-400 shrink-0 whitespace-nowrap mt-1">
          {relativeTime(item.timestamp)}
        </span>
      </button>
    </li>
  );
}

export default ClientNotificationBell;
