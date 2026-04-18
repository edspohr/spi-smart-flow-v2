import type { Company, OT, OTStage } from '@/store/types';
import { safeDate } from '@/lib/utils';

export type StageAccentColor = 'slate' | 'amber' | 'blue' | 'indigo' | 'gray';

export const OPEN_STAGES: OTStage[] = [
  'solicitud',
  'pago_adelanto',
  'gestion',
  'pago_cierre',
];

export const STAGE_LABELS: Record<OTStage, string> = {
  solicitud: 'Solicitud',
  pago_adelanto: 'Pago Adelanto',
  gestion: 'En Gestión',
  pago_cierre: 'Pago Cierre',
  finalizado: 'Finalizado',
};

export const STAGE_ACCENTS: Record<OTStage, StageAccentColor> = {
  solicitud: 'slate',
  pago_adelanto: 'amber',
  gestion: 'blue',
  pago_cierre: 'indigo',
  finalizado: 'gray',
};

export interface StageMetric {
  stage: OTStage;
  label: string;
  count: number;
  usdTotal: number;
  percentOfPipeline: number;
  accentColor: StageAccentColor;
}

export interface ClientMetric {
  companyId: string;
  companyName: string;
  count: number;
  usdTotal: number;
}

export interface StuckOT {
  ot: OT;
  daysStuck: number;
  usdEquivalent: number;
}

export interface OtasMetrics {
  totalUsdPipeline: number;
  activeOTsCount: number;
  companiesCount: number;
  otsWithoutAmount: number;
  otsWithUnknownCurrency: number;
  byStage: StageMetric[];
  topClients: ClientMetric[];
  stuckOTs: StuckOT[];
}

const MS_PER_DAY = 86_400_000;
const STUCK_MAX_ROWS = 20;
const TOP_CLIENTS = 10;

type ConvertToUSD = (amount: number, currency: string) => number | null;

function isOpen(ot: OT): boolean {
  if (!ot.stage || ot.stage === 'finalizado') return false;
  if ((ot as unknown as { orphaned?: boolean }).orphaned === true) return false;
  return true;
}

function resolveUsd(
  amount: number | undefined,
  currency: string | undefined,
  convertToUSD: ConvertToUSD,
): { usd: number; unknownCurrency: boolean } {
  const amt = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  const cur = currency || 'USD';
  if (cur === 'USD') return { usd: amt, unknownCurrency: false };
  const converted = convertToUSD(amt, cur);
  if (converted == null) {
    // Fallback: treat as 1:1 USD so numbers still show (not ideal, but better than
    // silently dropping the OT). Flag as unknownCurrency for observability.
    if (typeof console !== 'undefined') {
      console.warn(
        `[otasMetrics] No exchange rate for ${cur}; falling back to 1:1 USD for amount ${amt}`,
      );
    }
    return { usd: amt, unknownCurrency: true };
  }
  return { usd: converted, unknownCurrency: false };
}

function timestampOf(ot: OT): number {
  const upd = safeDate(ot.updatedAt);
  if (upd) return upd.getTime();
  const cre = safeDate(ot.createdAt);
  if (cre) return cre.getTime();
  return 0;
}

export function computeOtasMetrics(
  ots: OT[],
  companies: Company[],
  convertToUSD: ConvertToUSD,
  options?: { stuckThresholdDays?: number },
): OtasMetrics {
  const threshold = options?.stuckThresholdDays ?? 7;
  const now = Date.now();

  const companyById = new Map<string, Company>();
  for (const c of companies) companyById.set(c.id, c);

  const openOTs = ots.filter(isOpen);

  const byStageMap: Map<OTStage, { count: number; usd: number }> = new Map();
  const byClientMap: Map<string, { companyName: string; count: number; usd: number }> = new Map();

  let totalUsd = 0;
  let otsWithoutAmount = 0;
  let otsWithUnknownCurrency = 0;
  const companiesSeen = new Set<string>();

  const stuckCandidates: StuckOT[] = [];

  for (const ot of openOTs) {
    const hasAmount = typeof ot.amount === 'number' && isFinite(ot.amount) && ot.amount > 0;
    if (!hasAmount) otsWithoutAmount += 1;

    const { usd, unknownCurrency } = resolveUsd(ot.amount, ot.billingCurrency, convertToUSD);
    if (unknownCurrency) otsWithUnknownCurrency += 1;

    totalUsd += usd;

    // Stage bucket — only open stages
    const stageKey = ot.stage as OTStage;
    if (OPEN_STAGES.includes(stageKey)) {
      const bucket = byStageMap.get(stageKey) ?? { count: 0, usd: 0 };
      bucket.count += 1;
      bucket.usd += usd;
      byStageMap.set(stageKey, bucket);
    }

    // Client bucket
    if (ot.companyId) {
      companiesSeen.add(ot.companyId);
      const companyName =
        ot.companyName || companyById.get(ot.companyId)?.name || ot.companyId;
      const bucket = byClientMap.get(ot.companyId) ?? { companyName, count: 0, usd: 0 };
      bucket.count += 1;
      bucket.usd += usd;
      // Prefer resolved company name once we've seen it from a trusted source
      if (!bucket.companyName || bucket.companyName === ot.companyId) {
        bucket.companyName = companyName;
      }
      byClientMap.set(ot.companyId, bucket);
    }

    // Stuck candidate
    const ts = timestampOf(ot);
    if (ts > 0) {
      const age = now - ts;
      if (age > threshold * MS_PER_DAY) {
        stuckCandidates.push({
          ot,
          daysStuck: Math.ceil(age / MS_PER_DAY),
          usdEquivalent: usd,
        });
      }
    }
  }

  // Build stage metrics in canonical order so the UI is workflow-consistent.
  const byStage: StageMetric[] = OPEN_STAGES.map((stage) => {
    const bucket = byStageMap.get(stage) ?? { count: 0, usd: 0 };
    const percent = totalUsd > 0 ? (bucket.usd / totalUsd) * 100 : 0;
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: bucket.count,
      usdTotal: bucket.usd,
      percentOfPipeline: percent,
      accentColor: STAGE_ACCENTS[stage],
    };
  });

  // Top clients by USD desc, slice 10
  const topClients: ClientMetric[] = Array.from(byClientMap.entries())
    .map(([companyId, v]) => ({
      companyId,
      companyName: v.companyName,
      count: v.count,
      usdTotal: v.usd,
    }))
    .sort((a, b) => b.usdTotal - a.usdTotal)
    .slice(0, TOP_CLIENTS);

  // Stuck OTs — USD desc then days desc, cap at 20
  const stuckOTs = stuckCandidates
    .sort((a, b) => {
      if (b.usdEquivalent !== a.usdEquivalent) return b.usdEquivalent - a.usdEquivalent;
      return b.daysStuck - a.daysStuck;
    })
    .slice(0, STUCK_MAX_ROWS);

  return {
    totalUsdPipeline: totalUsd,
    activeOTsCount: openOTs.length,
    companiesCount: companiesSeen.size,
    otsWithoutAmount,
    otsWithUnknownCurrency,
    byStage,
    topClients,
    stuckOTs,
  };
}
