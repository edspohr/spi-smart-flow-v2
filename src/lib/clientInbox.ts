import type { OT, Document, ProcedureType, Requirement, OTStage } from '@/store/types';

export type ClientActionKind =
  | 'sign'
  | 'upload'
  | 'fill'
  | 'confirm'
  | 'pay_pending'
  | 'pay_review';

export type DeadlineUrgency = 'green' | 'amber' | 'red';

export interface ClientActionItem {
  id: string;
  otId: string;
  ot: OT;
  otTitle: string;
  companyName: string;
  actionLabel: string;
  actionKind: ClientActionKind;
  requirement?: Requirement;
  deadline?: string;
  deadlineUrgency?: DeadlineUrgency;
  stage: OTStage;
}

export interface ClientActionInboxGroups {
  signPowers: ClientActionItem[];
  completeDocs: ClientActionItem[];
  paymentsPending: ClientActionItem[];
  paymentsInReview: ClientActionItem[];
  totalCount: number;
}

const URGENCY_RANK: Record<DeadlineUrgency | 'none', number> = {
  red: 0,
  amber: 1,
  green: 2,
  none: 3,
};

function pickEarliestFutureDate(...candidates: Array<string | undefined>): string | undefined {
  const now = Date.now();
  const futures = candidates
    .filter((d): d is string => typeof d === 'string' && d.length > 0)
    .map((d) => ({ iso: d, ts: Date.parse(d) }))
    .filter((x) => !isNaN(x.ts) && x.ts > now)
    .sort((a, b) => a.ts - b.ts);
  return futures[0]?.iso;
}

function computeUrgency(deadlineIso: string | undefined): DeadlineUrgency | undefined {
  if (!deadlineIso) return undefined;
  const ts = Date.parse(deadlineIso);
  if (isNaN(ts)) return undefined;
  const days = Math.ceil((ts - Date.now()) / 86_400_000);
  if (days < 2) return 'red';
  if (days <= 5) return 'amber';
  return 'green';
}

function formatAmount(amount: number | undefined, currency: string | undefined): string {
  const cur = currency || 'USD';
  const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString('es-CO')}`;
  }
}

function otTitleOf(ot: OT): string {
  return ot.brandName || ot.procedureTypeName || ot.title || 'Solicitud';
}

function signLabel(req: Requirement): string {
  const label = (req.label || '').trim();
  if (/^firmar\b/i.test(label)) return label;
  return `Firmar ${label}`.trim();
}

function compareItems(a: ClientActionItem, b: ClientActionItem): number {
  const rankA = URGENCY_RANK[a.deadlineUrgency ?? 'none'];
  const rankB = URGENCY_RANK[b.deadlineUrgency ?? 'none'];
  if (rankA !== rankB) return rankA - rankB;
  const createdA = Date.parse(a.ot.createdAt) || 0;
  const createdB = Date.parse(b.ot.createdAt) || 0;
  return createdA - createdB;
}

export function buildClientActionInbox(
  ots: OT[],
  documents: Document[],
  procedureTypes: ProcedureType[],
): ClientActionInboxGroups {
  const signPowers: ClientActionItem[] = [];
  const completeDocs: ClientActionItem[] = [];
  const paymentsPending: ClientActionItem[] = [];
  const paymentsInReview: ClientActionItem[] = [];

  const procedureTypeById = new Map<string, ProcedureType>();
  for (const pt of procedureTypes) procedureTypeById.set(pt.id, pt);

  const activeOTs = ots.filter((ot) => {
    if (ot.stage === 'finalizado') return false;
    if ((ot as unknown as { orphaned?: boolean }).orphaned === true) return false;
    return true;
  });

  for (const ot of activeOTs) {
    const deadline = pickEarliestFutureDate(ot.deadline, ot.discountDeadline);
    const urgency = computeUrgency(deadline);
    const otTitle = otTitleOf(ot);
    const companyName = ot.companyName || '';

    if (ot.procedureTypeId) {
      const pt = procedureTypeById.get(ot.procedureTypeId);
      if (pt) {
        const sortedReqs = [...pt.requirements].sort((a, b) => a.order - b.order);
        for (const req of sortedReqs) {
          if (!req.isRequired) continue;
          const progress = ot.requirementsProgress?.[req.id];
          if (progress?.completed === true) continue;

          const baseItem = {
            id: `${ot.id}:${req.id}`,
            otId: ot.id,
            ot,
            otTitle,
            companyName,
            requirement: req,
            deadline,
            deadlineUrgency: urgency,
            stage: ot.stage,
          };

          switch (req.type) {
            case 'digital_signature':
              signPowers.push({
                ...baseItem,
                actionLabel: signLabel(req),
                actionKind: 'sign',
              });
              break;
            case 'document_upload':
              completeDocs.push({
                ...baseItem,
                actionLabel: `Subir: ${req.label}`,
                actionKind: 'upload',
              });
              break;
            case 'form_field':
              completeDocs.push({
                ...baseItem,
                actionLabel: `Completar: ${req.label}`,
                actionKind: 'fill',
              });
              break;
            case 'checkbox_confirmation':
              completeDocs.push({
                ...baseItem,
                actionLabel: `Confirmar: ${req.label}`,
                actionKind: 'confirm',
              });
              break;
          }
        }
      }
    }

    if (ot.stage === 'pago_adelanto' || ot.stage === 'pago_cierre') {
      const expectedPaymentType: 'adelanto' | 'cierre' =
        ot.stage === 'pago_adelanto' ? 'adelanto' : 'cierre';
      // Only consider comprobantes whose paymentType matches the current stage AND
      // that are still pending review or approved (rejected ones should allow re-upload).
      const activeReceipt = documents.find(
        (d) =>
          d.otId === ot.id &&
          d.type === 'comprobante_pago' &&
          d.paymentType === expectedPaymentType &&
          (d.status === 'pending_review' || d.status === 'approved'),
      );
      const paymentBase = {
        id: `${ot.id}:payment`,
        otId: ot.id,
        ot,
        otTitle,
        companyName,
        deadline,
        deadlineUrgency: urgency,
        stage: ot.stage,
      };
      if (activeReceipt) {
        paymentsInReview.push({
          ...paymentBase,
          actionLabel: 'Comprobante de pago en revisión por SPI',
          actionKind: 'pay_review',
        });
      } else {
        paymentsPending.push({
          ...paymentBase,
          actionLabel: `Monto pendiente: ${formatAmount(ot.amount, ot.billingCurrency)}`,
          actionKind: 'pay_pending',
        });
      }
    }
  }

  signPowers.sort(compareItems);
  completeDocs.sort(compareItems);
  paymentsPending.sort(compareItems);
  paymentsInReview.sort(compareItems);

  return {
    signPowers,
    completeDocs,
    paymentsPending,
    paymentsInReview,
    totalCount:
      signPowers.length +
      completeDocs.length +
      paymentsPending.length +
      paymentsInReview.length,
  };
}
