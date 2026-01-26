import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Plus } from 'lucide-react';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import OTDetails from '../components/dashboard/OTDetails';
import CreateOTModal from '../components/dashboard/CreateOTModal';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { ots } = useData();
  const [selectedOt, setSelectedOt] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter OTs for this client
  const myOts = ots.filter(ot => ot.clientId === user.id);

  return (
    <div className="h-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hola, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500">Bienvenido a tu panel de gestión inteligente.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} />
          Nueva Solicitud
        </button>
      </div>

      <KanbanBoard userOts={myOts} onSelectOt={setSelectedOt} />

      {selectedOt && (
        <OTDetails ot={selectedOt} onClose={() => setSelectedOt(null)} />
      )}

      {isCreateModalOpen && (
        <CreateOTModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
