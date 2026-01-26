import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CheckCircle, Upload, PenTool, X, UserPlus, User, MessageSquare, Send, FileText, BrainCircuit } from 'lucide-react';

export default function OTDetails({ ot, onClose }) {
  const { user } = useAuth();
  const { updateDocumentStatus, confirmPayment, advanceStage, getTimeStatus, users, assignUser, addComment } = useData();
  const [processingId, setProcessingId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'bitacora'

  const { discount, surcharge } = getTimeStatus(ot);

  // Filter team members (mock: everyone except SPI admins)
  const teamMembers = users.filter(u => u.role !== 'spi-admin');
  const isClientAdmin = user.role === 'client-admin';

  // Auto-Validation simulation
  const handleUpload = (docId) => {
    setProcessingId(docId);
    setAiAnalysis(null);
    
    // Step 1: Simulating Upload
    setTimeout(() => {
        // Step 2: Simulating AI Analysis
        setAiAnalysis({ docId, status: 'analyzing' });
        
        setTimeout(() => {
            // Step 3: Result
            setAiAnalysis({ 
                docId, 
                status: 'complete', 
                messages: [
                    "✓ Formato de archivo válido (PDF)",
                    "✓ Firma digital detectada",
                    "ℹ️ Coincidencia de fecha: 100%"
                ] 
            });
            
            // Finalize
            setTimeout(() => {
                updateDocumentStatus(ot.id, docId, 'approved'); 
                setProcessingId(null);
                setAiAnalysis(null);
            }, 2500);
            
        }, 2000);
    }, 1500);
  };

  const handlePay = (type) => {
    setProcessingId('payment');
    setTimeout(() => {
      confirmPayment(ot.id, type);
      setProcessingId(null);
    }, 1500);
  };

  const handleSendComment = (e) => {
      e.preventDefault();
      if(!commentText.trim()) return;
      addComment(ot.id, user, commentText);
      setCommentText("");
  };

  // Logic to check if we can advance from Gestíon
  const allDocsApproved = ot.documents.every(d => d.status === 'approved');
  
  // Combine history and comments, sort by date desc
  const feed = [...(ot.history || []), ...(ot.comments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50 transition-all">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-in-right relative">
        {/* Header Fixed */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white z-10">
           <div>
             <div className="text-sm font-bold text-accent uppercase tracking-wider mb-1">OT-{ot.id.split('-')[1]}</div>
             <h2 className="text-2xl font-bold text-slate-900 leading-tight">{ot.title}</h2>
             <div className="flex gap-4 mt-4 text-sm text-slate-500 font-medium">
                 <button 
                    onClick={() => setActiveTab('details')}
                    className={`pb-1 border-b-2 transition-colors ${activeTab === 'details' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'}`}
                 >
                     Detalles y Gestión
                 </button>
                 <button 
                    onClick={() => setActiveTab('bitacora')}
                    className={`pb-1 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'bitacora' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'}`}
                 >
                     <MessageSquare size={16} /> Bitácora
                 </button>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
             <X size={24} />
           </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8">
            {activeTab === 'details' ? (
                <>
                    <div className="flex flex-wrap gap-3 mb-6">
                        {discount > 0 && <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded font-medium">10% Descuento Aplicable</span>}
                        {surcharge > 0 && <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded font-medium">Recargo por retraso</span>}
                    </div>

                    {/* Assignment Section (Client Admin Only) */}
                    {isClientAdmin && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
                        <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                            <UserPlus size={16} /> Asignar Responsables
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {teamMembers.map(member => {
                            const isAssigned = (ot.assignedTo || []).includes(member.id);
                            return (
                                <button
                                key={member.id}
                                onClick={() => assignUser(ot.id, member.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    isAssigned 
                                    ? 'bg-purple-600 text-white shadow-sm' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                                }`}
                                >
                                <User size={12} />
                                {member.name}
                                </button>
                            );
                            })}
                        </div>
                        </div>
                    )}
                    
                    {/* Stage Actions */}
                    <div className="space-y-8">
                    
                        {/* STAGE 1: SOLICITUD */}
                        {ot.stage === 'solicitud' && (
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <h3 className="text-xl font-bold text-blue-900 mb-2">Solicitud Iniciada</h3>
                                <p className="text-blue-700 mb-4">Tu solicitud ha sido recibida. Para comenzar el proceso, por favor procede al pago del adelanto.</p>
                                <button 
                                    onClick={() => advanceStage(ot.id)} // Mocking automatic acceptance
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Aceptar Términos y Continuar
                                </button>
                            </div>
                        )}

                        {/* STAGE 2: PAGO ADELANTO */}
                        {ot.stage === 'pago_adelanto' && (
                            <div className="bg-white border-2 border-dashed border-slate-300 p-8 rounded-xl text-center">
                                <h3 className="text-xl font-bold mb-4">Pago Inicial Requerido</h3>
                                <p className="text-slate-500 mb-6">Monto: $150 USD</p>
                                <button 
                                    disabled={processingId === 'payment'}
                                    onClick={() => handlePay('adelanto')}
                                    className="bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    {processingId === 'payment' ? 'Procesando...' : 'Pagar Adelanto'}
                                </button>
                            </div>
                        )}

                        {/* STAGE 3: GESTIÓN (DOCS) */}
                        {ot.stage === 'gestion' && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <PenTool className="text-accent" /> Documentación Requerida
                                </h3>
                                <div className="grid gap-4">
                                    {ot.documents.map(doc => {
                                        const isDone = doc.status === 'approved' || doc.status === 'pre-approved';
                                        const isProcessing = processingId === doc.id;
                                        
                                        // AI Analysis UI Overlay
                                        if (aiAnalysis?.docId === doc.id && aiAnalysis?.status === 'complete') {
                                           return (
                                               <div key={doc.id} className="p-4 rounded-xl border border-blue-200 bg-blue-50 animate-pulse-soft">
                                                   <div className="flex items-center gap-2 text-blue-800 font-bold mb-2">
                                                       <BrainCircuit size={20} /> Análisis IA Completado
                                                   </div>
                                                   <ul className="space-y-1 mb-2">
                                                       {aiAnalysis.messages.map((msg, idx) => (
                                                           <li key={idx} className="text-sm text-blue-700">{msg}</li>
                                                       ))}
                                                   </ul>
                                                   <div className="text-xs text-blue-500 font-mono text-right">Validando finalización...</div>
                                               </div>
                                           );
                                        }

                                        return (
                                        <div key={doc.id} className={`p-4 rounded-xl border transition-all ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {isDone ? <CheckCircle size={18} /> : <Upload size={16} />} 
                                                </div>
                                                <span className={`font-medium ${isDone ? 'text-green-800' : 'text-slate-900'}`}>{doc.name}</span>
                                            </div>
                                            <span className="text-xs font-mono text-slate-400 uppercase">{doc.status}</span>
                                            </div>

                                            {!isDone && (
                                            <div className="pl-11">
                                                {doc.type === 'text' ? (
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="Ingresar texto..." className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm" />
                                                    <button 
                                                    onClick={() => updateDocumentStatus(ot.id, doc.id, 'approved')} // Skip AI for text for now or implement similar
                                                    className="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-800"
                                                    >
                                                    Guardar
                                                    </button>
                                                </div>
                                                ) : (
                                                <button 
                                                    onClick={() => handleUpload(doc.id)}
                                                    disabled={isProcessing}
                                                    className="w-full border-2 border-dashed border-slate-300 hover:border-accent hover:bg-slate-50 py-3 rounded-lg text-sm text-slate-500 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isProcessing ? (
                                                        <>
                                                            <BrainCircuit className="animate-pulse" size={16} />
                                                            Analizando Documento...
                                                        </>
                                                    ) : (doc.type === 'sign' ? 'Firmar Digitalmente' : 'Subir Archivo')}
                                                </button>
                                                )}
                                            </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>

                                {/* Advance Button Only if All Done */}
                                {/* Note: In real app, this might be automatic or "Send to Review" */}
                                {allDocsApproved && (
                                    <div className="mt-6 bg-green-50 p-4 rounded-lg flex items-center justify-between animate-fade-in-up">
                                        <div className="text-green-800 font-medium">Todos los documentos completados.</div>
                                        <button 
                                        onClick={() => advanceStage(ot.id)}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                        >
                                        Solicitar Pago Cierre
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STAGE 4: PAGO CIERRE */}
                        {ot.stage === 'pago_cierre' && (
                            <div className="bg-white border-2 border-dashed border-slate-300 p-8 rounded-xl text-center relative overflow-hidden">
                                {discount > 0 && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 font-bold rounded-bl-xl">
                                    -10% APLICADO
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-4">Pago Final</h3>
                                <p className="text-slate-500 mb-2">Total Servicios: $500 USD</p>
                                {discount > 0 && <p className="text-green-600 font-bold mb-4">Descuento Tiempo Record: -$50 USD</p>}
                                {surcharge > 0 && <p className="text-red-500 font-bold mb-4">Recargo por Demora: +$50 USD</p>}
                                
                                <div className="text-2xl font-bold text-slate-900 mb-6">
                                    Total a Pagar: ${500 - (discount ? 50 : 0) + (surcharge ? 50 : 0)} USD
                                </div>

                                <button 
                                    disabled={processingId === 'payment'}
                                    onClick={() => handlePay('cierre')}
                                    className="bg-linear-to-r from-slate-900 to-slate-800 text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all w-full disabled:opacity-50"
                                >
                                    {processingId === 'payment' ? 'Procesando Pago...' : 'Pagar y Finalizar'}
                                </button>
                            </div>
                        )}
                    
                        {/* STAGE 5: FINALIZADO */}
                        {ot.stage === 'finalizado' && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">¡Proceso Completado!</h3>
                                <p className="text-slate-500 mt-2">Gracias por confiar en SPI Americas.</p>
                            </div>
                        )}

                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col">
                    {/* Bitácora Feed */}
                    <div className="flex-1 space-y-6">
                        {feed.length === 0 && (
                             <div className="text-center text-slate-400 py-10">
                                 No hay actividad registrada aún.
                             </div>
                        )}
                        {feed.map((entry, idx) => (
                             <div key={idx} className="flex gap-4">
                                 <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                                     entry.type === 'system' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'
                                 }`}>
                                     {entry.type === 'system' ? <FileText size={14} /> : <User size={14} />}
                                 </div>
                                 <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="font-bold text-slate-900 text-sm">
                                             {entry.user?.name || 'Sistema'}
                                         </span>
                                         <span className="text-xs text-slate-400">
                                             {new Date(entry.date).toLocaleString()}
                                         </span>
                                     </div>
                                     <div className={`text-sm ${entry.type === 'system' ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                                         {entry.text}
                                     </div>
                                 </div>
                             </div>
                        ))}
                    </div>

                    {/* New Comment Input */}
                    <form onSubmit={handleSendComment} className="mt-6 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Escribe un comentario..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!commentText.trim()}
                                className="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
