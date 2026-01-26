import { useState } from 'react';
import { X, Check, Shield, FileText, Globe, Cpu } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const SERVICES = [
  { id: 'marca', title: 'Registro de Marca', icon: Shield, desc: 'Protección de identidad comercial', cost: 500, time: '30 días' },
  { id: 'patente', title: 'Patente de Invención', icon: Cpu, desc: 'Protección de nuevas tecnologías', cost: 1500, time: '90 días' },
  { id: 'copyright', title: 'Derechos de Autor', icon: FileText, desc: 'Obras literarias o artísticas', cost: 300, time: '15 días' },
  { id: 'dominio', title: 'Dominios Web', icon: Globe, desc: 'Registro y disputa de dominios', cost: 200, time: '7 días' },
];

export default function CreateOTModal({ onClose }) {
  const { createOt } = useData();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    service: null,
    title: '',
    description: ''
  });

  const handleCreate = () => {
    createOt(formData.service.id, formData.title, formData.description, user.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Nueva Solicitud</h2>
            <p className="text-slate-400 text-sm">Paso {step} de 3</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Selecciona el servicio</h3>
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map(srv => (
                  <button
                    key={srv.id}
                    onClick={() => setFormData({ ...formData, service: srv })}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                      formData.service?.id === srv.id 
                      ? 'border-accent bg-blue-50/50 ring-2 ring-accent/20' 
                      : 'border-slate-100 hover:border-blue-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                       formData.service?.id === srv.id ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <srv.icon size={20} />
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{srv.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{srv.desc}</div>
                    <div className="mt-3 text-xs font-mono text-slate-400">Desde ${srv.cost}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
               <h3 className="text-lg font-semibold text-slate-800">Detalles de la Solicitud</h3>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Proyecto / Marca</label>
                 <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-accent"
                    placeholder="Ej. Mi Marca Global"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Breve</label>
                 <textarea 
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-accent h-32 resize-none"
                    placeholder="Describe los productos o servicios que ofrecerás..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                 />
                 <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                   <Cpu size={12} /> Nuestra IA analizará esta descripción para sugerir clasificaciones.
                 </p>
               </div>
            </div>
          )}

          {step === 3 && (
             <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-blue-100 text-accent rounded-full flex items-center justify-center mx-auto">
                  <Check size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">¡Todo Listo!</h3>
                  <p className="text-slate-500 mt-2">Revisaremos tu solicitud y te contactaremos.</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-200 text-sm">
                   <div className="flex justify-between py-2 border-b border-slate-200">
                     <span className="text-slate-500">Servicio</span>
                     <span className="font-semibold text-slate-900">{formData.service?.title}</span>
                   </div>
                   <div className="flex justify-between py-2 border-b border-slate-200">
                     <span className="text-slate-500">Tiempo Estimado</span>
                     <span className="font-semibold text-slate-900">{formData.service?.time}</span>
                   </div>
                   <div className="flex justify-between py-2">
                     <span className="text-slate-500">Costo Base</span>
                     <span className="font-semibold text-slate-900">${formData.service?.cost} USD</span>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium"
            >
              Atrás
            </button>
          )}
          
          {step < 3 ? (
             <button 
               onClick={() => setStep(step + 1)}
               disabled={step === 1 ? !formData.service : !formData.title}
               className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
               Continuar
             </button>
          ) : (
            <button 
               onClick={handleCreate}
               className="bg-accent text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-accent/30"
             >
               Confirmar Creación
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
