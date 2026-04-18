import type { Log, OT } from '@/store/types';
import { safeDate } from '@/lib/utils';

export type NotificationKind =
  | 'document_approved'
  | 'document_rejected'
  | 'payment_approved'
  | 'payment_rejected'
  | 'ot_advanced'
  | 'ot_finalized'
  | 'poa_signed';

export type NotificationIcon =
  | 'CheckCircle2'
  | 'XCircle'
  | 'CircleDollarSign'
  | 'AlertCircle'
  | 'ArrowRightCircle'
  | 'Fingerprint'
  | 'PartyPopper';

export type NotificationIconColor =
  | 'green'
  | 'red'
  | 'blue'
  | 'purple'
  | 'amber'
  | 'emerald';

export interface NotificationDeepLink {
  type: 'otDetails';
  otId: string;
  defaultTab: 'overview' | 'documents' | 'history';
  scrollToRequirementId?: string;
}

export interface NotificationItem {
  id: string;
  logAction: string;
  kind: NotificationKind;
  icon: NotificationIcon;
  iconColor: NotificationIconColor;
  title: string;
  body: string;
  timestamp: Date;
  otId: string;
  ot?: OT;
  deepLink: NotificationDeepLink;
  isUnread: boolean;
}

const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const MAX_ITEMS = 50;

interface MappedEvent {
  kind: NotificationKind;
  icon: NotificationIcon;
  iconColor: NotificationIconColor;
  title: string;
  defaultTab: 'overview' | 'documents' | 'history';
}

function mapAction(action: string): MappedEvent | null {
  if (!action) return null;

  // Finalized takes priority — look for any signal that the stage is 'finalizado'
  const lowered = action.toLowerCase();
  const mentionsFinalized =
    lowered.includes('finalizad') &&
    (lowered.includes('etapa') || lowered.includes('avanzad') || lowered.includes('auto'));

  if (mentionsFinalized) {
    return {
      kind: 'ot_finalized',
      icon: 'PartyPopper',
      iconColor: 'emerald',
      title: 'Tu OT fue completada',
      defaultTab: 'overview',
    };
  }

  if (action.startsWith('Documento Aprobado:')) {
    return {
      kind: 'document_approved',
      icon: 'CheckCircle2',
      iconColor: 'green',
      title: 'Documento aprobado',
      defaultTab: 'documents',
    };
  }
  if (action.startsWith('Documento Rechazado:')) {
    return {
      kind: 'document_rejected',
      icon: 'XCircle',
      iconColor: 'red',
      title: 'Documento rechazado',
      defaultTab: 'documents',
    };
  }
  if (action === 'Comprobante de pago aprobado') {
    return {
      kind: 'payment_approved',
      icon: 'CircleDollarSign',
      iconColor: 'green',
      title: 'Pago aprobado',
      defaultTab: 'overview',
    };
  }
  if (action === 'Comprobante de pago rechazado') {
    return {
      kind: 'payment_rejected',
      icon: 'AlertCircle',
      iconColor: 'red',
      title: 'Comprobante rechazado',
      defaultTab: 'overview',
    };
  }
  if (action === 'OT auto-avanzada por pago aprobado') {
    return {
      kind: 'ot_advanced',
      icon: 'ArrowRightCircle',
      iconColor: 'blue',
      title: 'Tu OT avanzó de etapa',
      defaultTab: 'overview',
    };
  }
  if (
    action.startsWith('Etapa actualizada a:') ||
    action.startsWith('Etapa actualizada vía Pipefy:')
  ) {
    return {
      kind: 'ot_advanced',
      icon: 'ArrowRightCircle',
      iconColor: 'blue',
      title: 'Tu OT avanzó de etapa',
      defaultTab: 'overview',
    };
  }

  return null;
}

function bodyFor(
  kind: NotificationKind,
  log: Log,
  ot: OT | undefined,
): string {
  const title = ot?.brandName || ot?.procedureTypeName || ot?.title || 'tu solicitud';

  switch (kind) {
    case 'document_approved':
      return title;
    case 'document_rejected': {
      // Full action string like "Documento Rechazado: Foo. Razón: bar."
      const reasonIdx = log.action.indexOf('Razón:');
      if (reasonIdx >= 0) {
        const reason = log.action.slice(reasonIdx + 'Razón:'.length).trim();
        return `${title} — ${reason}`;
      }
      return `${title} — revisar motivo`;
    }
    case 'payment_approved':
      return `Pago confirmado en ${title}`;
    case 'payment_rejected':
      return `Rechazo de comprobante en ${title}`;
    case 'ot_advanced': {
      const toStage =
        (log.metadata?.toStage as string | undefined) ||
        (log.metadata?.newStage as string | undefined);
      if (toStage) return `${title} avanzó a ${toStage}`;
      return `${title} avanzó de etapa`;
    }
    case 'ot_finalized':
      return `${title} completada`;
    case 'poa_signed':
      return `${title} — poder registrado`;
    default:
      return title;
  }
}

export function buildClientNotifications(
  logs: Log[],
  ots: OT[],
  lastReadAtSnapshot: Date | null,
): NotificationItem[] {
  const otById = new Map<string, OT>();
  const activeOtIds = new Set<string>();
  for (const ot of ots) {
    otById.set(ot.id, ot);
    activeOtIds.add(ot.id);
  }

  const now = Date.now();
  const cutoff = now - MAX_AGE_MS;
  const result: NotificationItem[] = [];

  for (const log of logs) {
    if (!log.otId || !activeOtIds.has(log.otId)) continue;

    const mapped = mapAction(log.action);
    if (!mapped) continue;

    const ts = safeDate(log.timestamp);
    if (!ts) continue;
    if (ts.getTime() < cutoff) continue;

    const ot = otById.get(log.otId);
    const scrollToRequirementId =
      mapped.kind === 'document_rejected'
        ? (log.metadata?.requirementId as string | undefined) ||
          (log.metadata?.docId as string | undefined)
        : undefined;

    result.push({
      id: log.id,
      logAction: log.action,
      kind: mapped.kind,
      icon: mapped.icon,
      iconColor: mapped.iconColor,
      title: mapped.title,
      body: bodyFor(mapped.kind, log, ot),
      timestamp: ts,
      otId: log.otId,
      ot,
      deepLink: {
        type: 'otDetails',
        otId: log.otId,
        defaultTab: mapped.defaultTab,
        scrollToRequirementId,
      },
      isUnread: lastReadAtSnapshot
        ? ts.getTime() > lastReadAtSnapshot.getTime()
        : true,
    });
  }

  result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return result.slice(0, MAX_ITEMS);
}
