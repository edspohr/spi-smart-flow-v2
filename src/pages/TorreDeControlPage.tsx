import { useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { safeDate } from '@/lib/utils';
import useOTStore from '@/store/useOTStore';
import useAdminStore from '@/store/useAdminStore';
import useExchangeRatesStore from '@/store/useExchangeRatesStore';
import OTDetailsModal from '@/components/OTDetailsModal';
import StageOTsModal from '@/components/StageOTsModal';
import OtasKPICard from '@/components/torre/OtasKPICard';
import StageBreakdownGrid from '@/components/torre/StageBreakdownGrid';
import StuckOTsTable from '@/components/torre/StuckOTsTable';
import TopClientsChart from '@/components/torre/TopClientsChart';
import {
  computeOtasMetrics,
  type ClientMetric,
  type StageMetric,
} from '@/lib/otasMetrics';
import type { ExchangeRate, OT } from '@/store/types';

const TorreDeControlPage = () => {
  const { ots, subscribeToAllOTs } = useOTStore();
  const { companies, subscribeToCompanies } = useAdminStore();
  const { rates, subscribeToRates, convertToUSD } = useExchangeRatesStore();

  const [stageModal, setStageModal] = useState<StageMetric | null>(null);
  const [clientModal, setClientModal] = useState<ClientMetric | null>(null);
  const [otModal, setOtModal] = useState<OT | null>(null);

  useEffect(() => {
    const u1 = subscribeToAllOTs();
    const u2 = subscribeToCompanies();
    const u3 = subscribeToRates();
    return () => {
      u1();
      u2();
      u3();
    };
  }, [subscribeToAllOTs, subscribeToCompanies, subscribeToRates]);

  const metrics = useMemo(
    () => computeOtasMetrics(ots, companies, convertToUSD),
    [ots, companies, convertToUSD],
  );

  const lastRatesUpdate = useMemo(() => {
    const dates = Object.values(rates)
      .map((r) => safeDate((r as ExchangeRate).updatedAt))
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime());
    return dates[0] ?? null;
  }, [rates]);

  const stageModalOts = useMemo(() => {
    if (!stageModal) return [] as OT[];
    return ots.filter(
      (o) =>
        o.stage === stageModal.stage &&
        !(o as unknown as { orphaned?: boolean }).orphaned,
    );
  }, [ots, stageModal]);

  const clientModalOts = useMemo(() => {
    if (!clientModal) return [] as OT[];
    return ots.filter(
      (o) =>
        o.companyId === clientModal.companyId &&
        o.stage !== 'finalizado' &&
        !(o as unknown as { orphaned?: boolean }).orphaned,
    );
  }, [ots, clientModal]);

  const handleViewOT = (otId: string) => {
    const ot = ots.find((o) => o.id === otId);
    if (ot) setOtModal(ot);
  };

  return (
    <ScrollArea className="h-[calc(100vh-5rem)]">
      <div className="max-w-7xl mx-auto py-6 space-y-10 pb-16">
        <OtasKPICard
          totalUsd={metrics.totalUsdPipeline}
          activeOTs={metrics.activeOTsCount}
          companies={metrics.companiesCount}
          lastRatesUpdate={lastRatesUpdate}
        />

        <StageBreakdownGrid
          byStage={metrics.byStage}
          onStageClick={(s) => setStageModal(s)}
        />

        <StuckOTsTable stuckOTs={metrics.stuckOTs} onOTClick={handleViewOT} />

        <TopClientsChart
          topClients={metrics.topClients}
          onClientClick={(c) => setClientModal(c)}
        />

        {(metrics.otsWithoutAmount > 0 || metrics.otsWithUnknownCurrency > 0) && (
          <p className="text-[11px] font-semibold text-slate-500 text-center">
            {metrics.otsWithoutAmount > 0 &&
              `${metrics.otsWithoutAmount} OT(s) sin monto cargado · `}
            {metrics.otsWithUnknownCurrency > 0 &&
              `${metrics.otsWithUnknownCurrency} OT(s) con moneda sin tasa (fallback 1:1 USD)`}
          </p>
        )}
      </div>

      {stageModal && (
        <StageOTsModal
          open
          onClose={() => setStageModal(null)}
          filter={{ kind: 'stage', stage: stageModal.stage, label: stageModal.label }}
          ots={stageModalOts}
          convertToUSD={convertToUSD}
          onOTClick={handleViewOT}
        />
      )}

      {clientModal && (
        <StageOTsModal
          open
          onClose={() => setClientModal(null)}
          filter={{
            kind: 'client',
            companyId: clientModal.companyId,
            companyName: clientModal.companyName,
          }}
          ots={clientModalOts}
          convertToUSD={convertToUSD}
          onOTClick={handleViewOT}
        />
      )}

      {otModal && (
        <OTDetailsModal
          ot={otModal}
          open
          onOpenChange={(open) => {
            if (!open) setOtModal(null);
          }}
          defaultTab="overview"
        />
      )}
    </ScrollArea>
  );
};

export default TorreDeControlPage;
