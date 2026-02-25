import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  CheckCircle, Upload, PenTool, X, UserPlus, User, 
  MessageSquare, Send, FileText, BrainCircuit, 
  Clock, CreditCard, ChevronRight, Check, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGE_CONFIG = {
    solicitud: { label: 'Solicitud', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    pago_adelanto: { label: 'Pago Inicial', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    gestion: { label: 'En Gestión', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    pago_cierre: { label: 'Pago Final', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    finalizado: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

export default function OTDetails({ ot, onClose }) {
  const { user } = useAuth();
  const { updateDocumentStatus, confirmPayment, advanceStage, getTimeStatus, users, assignUser, addComment } = useData();
  const [processingId, setProcessingId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'bitacora'

  const { discount, surcharge } = getTimeStatus(ot);
  const teamMembers = users.filter(u => u.role !== 'spi-admin');
  const isClientAdmin = user.role === 'client-admin';

  const handleUpload = (docId) => {
    setProcessingId(docId);
    setAiAnalysis(null);
    setTimeout(() => {
        setAiAnalysis({ docId, status: 'analyzing' });
        setTimeout(() => {
            setAiAnalysis({ 
                docId, 
                status: 'complete', 
                messages: [
                    "✓ Formato de archivo válido (PDF)",
                    "✓ Firma digital detectada",
                    "ℹ️ Coincidencia de fecha: 100%"
                ] 
            });
            setTimeout(() => {
                updateDocumentStatus(ot.id, docId, 'approved'); 
                setProcessingId(null);
                setAiAnalysis(null);
            }, 2500);
        }, 2000);
    }, 1200);
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

  const allDocsApproved = ot.documents.every(d => d.status === 'approved');
  const feed = [...(ot.history || []), ...(ot.comments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-white w-full max-w-xl h-full shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col animate-slide-in-right relative">
        {/* Top Gradient Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        {/* Header */}
        <div className="p-6 pb-2 border-b border-slate-100 flex justify-between items-start bg-white/80 backdrop-blur-md sticky top-0 z-20">
           <div className="flex-1">
             <div className="flex items-center gap-3 mb-2">
               <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest">
                 OT-{ot.id.split('-')[1]}
               </span>
               <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tight", STAGE_CONFIG[ot.stage].color)}>
                 {STAGE_CONFIG[ot.stage].label}
               </div>
             </div>
             <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{ot.title}</h2>
             
             {/* Pill Tabs */}
             <div className="flex bg-slate-100 rounded-xl p-1 mt-6 w-fit mb-2">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
                    activeTab === 'details' ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Gestión
                </button>
                <button 
                  onClick={() => setActiveTab('bitacora')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                    activeTab === 'bitacora' ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <MessageSquare size={14} /> 
                  Bitácora
                  {feed.length > 0 && (
                    <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 rounded-full">
                      {feed.length}
                    </span>
                  )}
                </button>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-slate-100">
             <X size={20} />
           </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 scrollbar-hide">
            {activeTab === 'details' ? (
                <div className="animate-fade-in space-y-8">
                    {/* Urgency Indicators */}
                    {(discount > 0 || surcharge > 0) && (
                      <div className="flex flex-wrap gap-2">
                          {discount > 0 && <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1.5 rounded-lg font-bold border border-emerald-100 uppercase tracking-wide flex items-center gap-2">🎯 Descuento del 10% por Pronto Envío</span>}
                          {surcharge > 0 && <span className="bg-rose-50 text-rose-700 text-[10px] px-2.5 py-1.5 rounded-lg font-bold border border-rose-100 uppercase tracking-wide flex items-center gap-2">⚠️ Recargo aplicado por retraso</span>}
                      </div>
                    )}

                    {/* Assignment Section */}
                    {isClientAdmin && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <UserPlus size={14} className="text-blue-500" /> Responsables del Trámite
                          </h3>
                          <div className="flex flex-wrap gap-2">
                              {teamMembers.map(member => {
                                const isAssigned = (ot.assignedTo || []).includes(member.id);
                                return (
                                    <button
                                      key={member.id}
                                      onClick={() => assignUser(ot.id, member.id)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                                        isAssigned 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 active:scale-95' 
                                        : 'bg-white text-slate-600 border-slate-100 hover:border-blue-300 hover:bg-blue-50'
                                      )}
                                    >
                                      {member.name}
                                    </button>
                                );
                              })}
                          </div>
                        </div>
                    )}
                    
                    {/* Stage Actions */}
                    <div className="space-y-8 pb-12">
                        {/* STAGE 1: SOLICITUD */}
                        {ot.stage === 'solicitud' && (
                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex flex-col items-center text-center animate-fade-scale">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-amber-100">
                                    <FileText className="h-7 w-7 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-900 mb-2">Solicitud Iniciada</h3>
                                <p className="text-amber-700/80 text-sm mb-6 max-w-xs">Tu solicitud ha sido recibida. Acepta los términos para proceder al pago inicial.</p>
                                <Button 
                                    onClick={() => advanceStage(ot.id)}
                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-amber-500/20"
                                >
                                    Aceptar y Continuar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* STAGE 2: PAGO ADELANTO */}
                        {ot.stage === 'pago_adelanto' && (
                            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center text-center animate-fade-scale">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                                    <CreditCard className="h-7 w-7 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-blue-900 mb-1">Pago Inicial Requerido</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Honorarios por Apertura</p>
                                <div className="text-3xl font-black text-blue-900 mb-6">$150 <span className="text-sm font-medium opacity-60">USD</span></div>
                                <Button 
                                    disabled={processingId === 'payment'}
                                    onClick={() => handlePay('adelanto')}
                                    className="w-full btn-primary h-12 rounded-xl shadow-lg shadow-blue-500/20"
                                >
                                    {processingId === 'payment' ? (
                                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                                    ) : (
                                      <>Pagar Adelanto <CheckCircle className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* STAGE 3: GESTIÓN (DOCS) */}
                        {ot.stage === 'gestion' && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <PenTool size={14} className="text-indigo-500" /> Documentación Pendiente
                                </h3>
                                <div className="grid gap-3">
                                    {ot.documents.map(doc => {
                                        const isApproved = doc.status === 'approved';
                                        const isProcessing = processingId === doc.id;
                                        
                                        return (
                                        <div key={doc.id} className={cn(
                                          "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                                          isApproved ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100 shadow-sm"
                                        )}>
                                            {/* AI Analysis Modal-like Overlay */}
                                            {aiAnalysis?.docId === doc.id && (
                                              <div className="absolute inset-0 bg-blue-600/95 backdrop-blur-sm z-30 flex flex-col p-4 text-white animate-fade-in">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <BrainCircuit className="h-5 w-5 animate-pulse" />
                                                    <span className="font-bold text-sm">Análisis por Smart AI</span>
                                                  </div>
                                                  <div className="space-y-1.5 flex-1 mt-1">
                                                    {aiAnalysis.status === 'complete' ? (
                                                      aiAnalysis.messages.map((msg, i) => (
                                                        <div key={i} className="text-[11px] font-medium flex items-center gap-2 animate-slide-in-right" style={{ animationDelay: `${i * 150}ms` }}>
                                                          <div className="w-1 h-1 bg-blue-300 rounded-full" /> {msg}
                                                        </div>
                                                      ))
                                                    ) : (
                                                      <div className="text-xs opacity-80 mt-2">Corroborando autenticidad...</div>
                                                    )}
                                                  </div>
                                              </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                      isApproved ? "bg-emerald-100 text-emerald-600 shadow-sm" : "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100"
                                                    )}>
                                                      {isApproved ? <Check size={20} className="stroke-[3]" /> : <Upload size={18} />} 
                                                    </div>
                                                    <div>
                                                      <span className={cn("font-bold text-sm block", isApproved ? "text-emerald-800" : "text-slate-900")}>{doc.name}</span>
                                                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                                        {isApproved ? "Validado por Sistema" : (doc.type === 'sign' ? "Requiere Firma" : "Formato PDF únicamente")}
                                                      </span>
                                                    </div>
                                                </div>
                                                
                                                {!isApproved && !isProcessing && (
                                                  <button 
                                                    onClick={() => handleUpload(doc.id)}
                                                    className="p-2.5 hover:bg-slate-50 rounded-xl text-blue-600 transition-colors bg-white border border-slate-100 shadow-sm"
                                                  >
                                                    <ChevronRight size={18} />
                                                  </button>
                                                )}

                                                {isProcessing && (
                                                  <Loader2 className="animate-spin text-blue-600" size={20} />
                                                )}
                                            </div>

                                            {/* Mini Progress Bar for Processing */}
                                            {isProcessing && !aiAnalysis && (
                                              <div className="h-1 bg-slate-100 w-full mt-4 rounded-full overflow-hidden">
                                                  <div className="h-full bg-blue-600 w-1/2 animate-shimmer" />
                                              </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>

                                {allDocsApproved && (
                                    <div className="mt-8 bg-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-600/20 animate-fade-scale flex flex-col items-center">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                          <CheckCircle2 size={28} />
                                        </div>
                                        <h4 className="font-bold text-lg mb-1">¡Todo en Orden!</h4>
                                        <p className="text-emerald-100 text-sm text-center mb-6">Hemos validado todos tus documentos. Ya puedes solicitar el pago de cierre.</p>
                                        <Button 
                                          onClick={() => advanceStage(ot.id)}
                                          className="w-full bg-white text-emerald-700 hover:bg-emerald-50 h-11 font-black uppercase tracking-wider text-xs rounded-xl"
                                        >
                                          Solicitar Pago Final
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STAGE 4: PAGO CIERRE */}
                        {ot.stage === 'pago_cierre' && (
                            <div className="bg-purple-50 rounded-3xl p-8 border border-purple-100 relative overflow-hidden flex flex-col items-center animate-fade-scale">
                                {discount > 0 && (
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-4 py-1.5 font-black rounded-bl-2xl uppercase tracking-widest shadow-lg">
                                      Descuento Aplicado
                                    </div>
                                )}
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-purple-100">
                                  <CreditCard className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-2xl font-black text-purple-900 mb-6">Liquidación Final</h3>
                                
                                <div className="w-full space-y-3 mb-8">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Servicios Digitales</span>
                                    <span className="font-bold text-slate-800">$500 USD</span>
                                  </div>
                                  {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-emerald-600 font-medium">Bono Pronto Envío</span>
                                      <span className="font-black text-emerald-600">-$50 USD</span>
                                    </div>
                                  )}
                                  {surcharge > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-rose-600 font-medium">Gastos de Demora</span>
                                      <span className="font-black text-rose-600">+$50 USD</span>
                                    </div>
                                  )}
                                  <div className="h-px bg-purple-200/50 w-full" />
                                  <div className="flex justify-between items-baseline pt-2">
                                    <span className="text-purple-900 font-black uppercase tracking-widest text-[10px]">Neto a Pagar</span>
                                    <span className="text-3xl font-black text-purple-900">
                                      ${500 - (discount ? 50 : 0) + (surcharge ? 50 : 0)} <span className="text-sm font-medium opacity-60">USD</span>
                                    </span>
                                  </div>
                                </div>

                                <Button 
                                    disabled={processingId === 'payment'}
                                    onClick={() => handlePay('cierre')}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all"
                                >
                                    {processingId === 'payment' ? (
                                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                                    ) : (
                                      "Confirmar y Finalizar"
                                    )}
                                </Button>
                            </div>
                        )}
                    
                        {/* STAGE 5: FINALIZADO */}
                        {ot.stage === 'finalizado' && (
                            <div className="text-center py-16 flex flex-col items-center">
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                                    <CheckCircle size={48} className="animate-fade-scale" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">¡Misión Cumplida!</h3>
                                <p className="text-slate-500 mt-3 text-lg font-medium">Tu marca/patente ya está protegida.</p>
                                <div className="mt-12 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 text-left w-full">
                                   <div className="bg-blue-100 p-3 rounded-xl">
                                      <FileText className="text-blue-600 h-6 w-6" />
                                   </div>
                                   <div>
                                      <div className="text-xs font-black text-slate-400 tracking-widest uppercase">Certificado IP</div>
                                      <div className="text-slate-900 font-bold hover:text-blue-600 cursor-pointer transition-colors">Descargar Resolución.pdf</div>
                                   </div>
                                   <ChevronRight className="ml-auto text-slate-300" size={20} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col pb-6">
                    {/* Bitácora Feed (Timeline) */}
                    <div className="flex-1 space-y-0 relative border-l-2 border-slate-100 ml-3 pl-8 py-2">
                        {feed.length === 0 && (
                             <div className="text-center text-slate-400 py-10 italic">
                                 No hay actividad registrada aún.
                             </div>
                        )}
                        {feed.map((entry, idx) => (
                             <div key={idx} className="relative mb-8 last:mb-0 group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                 {/* Timeline Dot */}
                                 <div className={cn(
                                   "absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-125",
                                   entry.type === 'system' ? 'bg-slate-300' : 'bg-blue-600'
                                 )} />
                                 
                                 <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-slate-100">
                                     <div className="flex items-center justify-between mb-2">
                                         <span className={cn(
                                           "text-xs font-black tracking-tight",
                                           entry.type === 'system' ? 'text-slate-400 uppercase' : 'text-slate-900'
                                         )}>
                                             {entry.user?.name || 'Smart Flow System'}
                                         </span>
                                         <span className="text-[10px] font-bold text-slate-300 uppercase">
                                             {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                         </span>
                                     </div>
                                     <div className={cn(
                                       "text-sm leading-relaxed",
                                       entry.type === 'system' ? 'text-slate-500 italic font-medium' : 'text-slate-700'
                                     )}>
                                         {entry.text}
                                     </div>
                                     {entry.type !== 'system' && (
                                       <div className="mt-3 flex gap-2">
                                         <span className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded-full font-bold border border-blue-100 cursor-pointer hover:bg-white transition-colors">Responder</span>
                                       </div>
                                     )}
                                 </div>
                             </div>
                        ))}
                    </div>

                    {/* New Comment Input */}
                    <form onSubmit={handleSendComment} className="mt-6 pt-6 border-t border-slate-100 bg-white z-10 sticky bottom-0">
                        <div className="relative group">
                            <textarea 
                                rows={1}
                                placeholder="Escribe un mensaje para el equipo..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-3.5 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all text-sm resize-none"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!commentText.trim()}
                                className="absolute right-2.5 bottom-2.5 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-blue-500/20 active:scale-90"
                            >
                                <Send size={18} />
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
