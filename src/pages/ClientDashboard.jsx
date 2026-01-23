import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import OTDetails from '../components/dashboard/OTDetails';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { ots } = useData();
  const [selectedOt, setSelectedOt] = useState(null);

  // Filter OTs for this client
  const myOts = ots.filter(ot => ot.clientId === user.id);

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Hola, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-500">Bienvenido a tu panel de gestión inteligente.</p>
      </div>

      <KanbanBoard userOts={myOts} onSelectOt={setSelectedOt} />

      {selectedOt && (
        <OTDetails ot={selectedOt} onClose={() => setSelectedOt(null)} />
      )}
    </div>
  );
}
