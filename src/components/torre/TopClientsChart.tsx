import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Users, Inbox } from 'lucide-react';
import type { ClientMetric } from '@/lib/otasMetrics';
import { compactUSD, formatUSD, truncate } from './torreStyles';

interface Props {
  topClients: ClientMetric[];
  onClientClick: (c: ClientMetric) => void;
}

interface ClientChartDatum {
  companyId: string;
  label: string;
  usdTotal: number;
  count: number;
}

const TopClientsChart = ({ topClients, onClientClick }: Props) => {
  const data: ClientChartDatum[] = topClients.map((c) => ({
    companyId: c.companyId,
    label: truncate(c.companyName, 24),
    usdTotal: c.usdTotal,
    count: c.count,
  }));

  return (
    <div>
      <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-blue-400" />
        Top 10 clientes por volumen USD
      </h2>

      {data.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl py-16 text-center">
          <Inbox className="h-6 w-6 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">Sin datos para mostrar</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <ResponsiveContainer width="100%" height={Math.max(260, data.length * 36)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              onClick={(state: any) => {
                const payload = state?.activePayload?.[0]?.payload as
                  | ClientChartDatum
                  | undefined;
                if (payload) {
                  const match = topClients.find((c) => c.companyId === payload.companyId);
                  if (match) onClientClick(match);
                }
              }}
            >
              <XAxis
                type="number"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
                tickFormatter={(v) => compactUSD(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={200}
                tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 700 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#1e293b33' }}
                contentStyle={{
                  backgroundColor: '#0B1121',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  color: '#e2e8f0',
                  fontSize: 12,
                  fontWeight: 700,
                }}
                formatter={(value: any, _name: any, props: any) => {
                  const d: ClientChartDatum = props.payload;
                  return [
                    `${formatUSD(value as number, 0)} — ${d.count} ${d.count === 1 ? 'OT' : 'OTs'}`,
                    'Total USD',
                  ];
                }}
                labelFormatter={(l) => String(l)}
              />
              <Bar dataKey="usdTotal" radius={[0, 8, 8, 0]} cursor="pointer">
                {data.map((_, i) => (
                  <Cell key={i} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TopClientsChart;
