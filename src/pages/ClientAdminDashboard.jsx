import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Users, Plus, Calendar } from 'lucide-react';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import OTDetails from '../components/dashboard/OTDetails';
import CreateOTModal from '../components/dashboard/CreateOTModal';

export default function ClientAdminDashboard() {
  const { user } = useAuth();
  const { ots } = useData();
  const [selectedOt, setSelectedOt] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Client Admin sees *all* OTs for their company
  // In our mock, 'userId' is linked to 'companyId' implicitly or explicitly.
  // Mock Data: client-1 and admin-1 are in same company (implied for now based on filtering logic we'll add)
  // For simplicity, let's show ALL OTs that belong to 'client-1' (the employee) to the 'admin-1'.
  
  // Real app: filter by companyId.
  // Mock app: filter by those that start with 'client-'
  const companyOts = ots; // Showing all for demo since we only have 1 client in mock.

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel Administrativo</h1>
          <p className="text-slate-500">Gestión de equipo y solicitudes de {user.companyId || 'mi empresa'}.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} />
          Nueva Solicitud
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
               <Calendar size={24} />
             </div>
             <div>
               <div className="text-2xl font-bold text-slate-900">{companyOts.length}</div>
               <div className="text-sm text-slate-500">Solicitudes Activas</div>
             </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
               <Users size={24} />
             </div>
             <div>
               <div className="text-2xl font-bold text-slate-900">3</div>
               <div className="text-sm text-slate-500">Usuarios Activos</div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Vista Global de OTs</h2>
        <KanbanBoard userOts={companyOts} onSelectOt={setSelectedOt} />
      </div>

      {selectedOt && (
        <OTDetails ot={selectedOt} onClose={() => setSelectedOt(null)} />
      )}

      {isCreateModalOpen && (
        <CreateOTModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  )
}
