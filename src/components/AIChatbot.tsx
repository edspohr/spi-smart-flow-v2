import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronDown, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import useDataStore from '@/store/useDataStore';
import { cn } from '@/lib/utils';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
        { role: 'bot', text: '¡Hola! Soy tu asistente virtual inteligente. ¿En qué puedo apoyarte hoy con tus trámites?' }
    ]);
    const [input, setInput] = useState("");
    const { ots } = useDataStore();
    
    const activeOT = ots.find(ot => ot.stage !== 'finalizado');
    const serviceContext = activeOT?.serviceType || 'General';

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput("");

        setTimeout(() => {
            let response = "Lo siento, no tengo esa información específica ahora mismo. ¿Deseas que un ejecutivo revise tu caso?";
            const lowerInput = userMsg.toLowerCase();

            if (lowerInput.includes('plazo') || lowerInput.includes('tiempo') || lowerInput.includes('demora')) {
                 if (serviceContext.includes('Sanitaria')) {
                     response = "Para trámites de Resolución Sanitaria, los plazos suelen ser de 15 a 20 días hábiles tras la carga completa.";
                 } else if (serviceContext.includes('Marca')) {
                     response = "El registro de marca legalmente toma entre 4 y 6 meses. Te notificaremos cada hito importante.";
                 } else {
                     response = "Los plazos varían. En promedio para este flujo estimamos 10 días hábiles.";
                 }
            } else if (lowerInput.includes('documento') || lowerInput.includes('subir')) {
                response = "Puedes subir los documentos requeridos directamente en el tablero. Nuestra IA los validará en segundos.";
            } else if (lowerInput.includes('pago') || lowerInput.includes('costo')) {
                response = "El sistema acepta pagos vía transferencia o tarjeta. El link de pago se habilita automáticamente en la etapa correspondiente.";
            } else {
                response = `He analizado tu consulta sobre ${serviceContext}. ¿Hay algo específico sobre los requisitos que desees saber?`;
            }

            setMessages(prev => [...prev, { role: 'bot', text: response }]);
        }, 1200);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end pointer-events-none">
            {isOpen && (
                <Card className="w-[380px] h-[550px] shadow-2xl rounded-[2.5rem] border-none flex flex-col mb-6 pointer-events-auto overflow-hidden animate-slide-up bg-white/80 backdrop-blur-2xl ring-1 ring-slate-100">
                    {/* Header */}
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <span className="font-black text-sm tracking-tight block">AI Assistant</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl" onClick={() => setIsOpen(false)}>
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    {/* Context Ribbon */}
                    <div className="bg-blue-50/50 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-600 border-b border-blue-100/50 flex items-center gap-2 shrink-0">
                        <ChevronDown className="h-3 w-3" /> Foco: {serviceContext}
                    </div>

                    {/* Messages Body */}
                    <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                        <div className="space-y-6 pb-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn("flex items-end gap-3", msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                                    <Avatar className={cn("h-8 w-8 rounded-xl border-none shadow-sm", msg.role === 'bot' ? 'bg-slate-900' : 'bg-blue-600')}>
                                      <AvatarFallback className="text-[10px] font-bold text-white">
                                        {msg.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "max-w-[75%] rounded-[1.5rem] px-5 py-3.5 text-sm font-semibold leading-relaxed shadow-sm",
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Input Footer */}
                    <div className="p-6 bg-white border-t border-slate-50 shrink-0">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-3 items-center bg-slate-50 p-1.5 rounded-2xl ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                        >
                            <Input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="h-10 border-none bg-transparent shadow-none focus-visible:ring-0 font-semibold text-sm px-4"
                            />
                            <Button type="submit" size="icon" className="h-10 w-10 shrink-0 btn-primary rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                        <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest mt-3">
                            Powered by Smart Flow AI Architecture
                        </p>
                    </div>
                </Card>
            )}

            <Button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "h-16 w-16 rounded-3xl shadow-2xl transition-all duration-500 pointer-events-auto border-none",
                  isOpen 
                  ? 'bg-slate-900 hover:bg-black rotate-90 scale-90' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-110 shadow-blue-500/40 active:scale-95'
                )}
            >
                {isOpen ? <X className="h-7 w-7 text-white" /> : <MessageSquare className="h-7 w-7 text-white" />}
            </Button>
        </div>
    );
};

export default AIChatbot;
