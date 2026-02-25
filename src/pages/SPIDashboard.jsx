/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, Filter, DollarSign, FileCheck, AlertCircle } from 'lucide-react';
import OTDetails from '../components/dashboard/OTDetails';

export default function SPIDashboard() {
  const { ots } = useData();
  const [selectedOt, setSelectedOt] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredOts = filter === 'all' ? ots : ots.filter(ot => ot.stage === filter);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 font-medium uppercase">{title}</div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Torre de Control</h1>
          <p className="text-slate-500">Supervisión general y validaciones.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input type="text" placeholder="Buscar cliente..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-accent outline-none" />
           </div>
           <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-500">
             <Filter size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Por Validar" value={ots.filter(o => o.stage === 'gestion').length} icon={FileCheck} color="bg-orange-100 text-orange-600" />
        <StatCard title="Pagos Pendientes" value={ots.filter(o => o.stage.includes('pago')).length} icon={DollarSign} color="bg-blue-100 text-blue-600" />
        <StatCard title="Retrasados" value={1} icon={AlertCircle} color="bg-red-100 text-red-600" />
        <StatCard title="Total OTs" value={ots.length} icon={Filter} color="bg-slate-100 text-slate-600" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto">
          {['all', 'solicitud', 'pago_adelanto', 'gestion', 'pago_cierre', 'finalizado'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Servicio</th>
              <th className="px-6 py-4">Etapa</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOts.map((ot) => (
              <tr key={ot.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-slate-400">#{ot.id.split('-')[1]}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">Carlos Cliente</div>
                  <div className="text-xs text-slate-500">Empresa Demo</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{ot.title}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${ot.stage === 'finalizado' ? 'bg-green-100 text-green-800' : 
                      ot.stage === 'solicitud' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                    {ot.stage.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {/* Status Helper */}
                   {ot.stage === 'gestion' ? 'Esperando Docs' : 'Al día'}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedOt(ot)}
                    className="px-4 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-400 hover:shadow-md rounded-xl transition-all duration-200 active:scale-95"
                  >
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOts.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">No se encontraron resultados.</div>
        )}
      </div>

      {selectedOt && (
        <OTDetails ot={selectedOt} onClose={() => setSelectedOt(null)} />
      )}
    </div>
  )
}
