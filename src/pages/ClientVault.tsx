import { useEffect, useState } from 'react';
import useDocumentStore from '../store/useDocumentStore';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, Search, HardDrive, Clock, AlertCircle, FileText, ChevronRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { safeDate } from '@/lib/utils';

type ExpiryStatus = 'vencido' | 'proximo' | 'vigente' | 'indefinido';

function getExpiryStatus(validUntil?: any): ExpiryStatus {
   const d = safeDate(validUntil);
   if (!d) return 'indefinido';
   const days = Math.ceil(
    (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
   );
   if (days < 0)   return 'vencido';
   if (days <= 30) return 'proximo';
   return 'vigente';
}

const ClientVault = () => {
    const { user } = useAuthStore();
    const { vaultDocuments, loading } = useDocumentStore();
    const subscribeToClientDocuments = useDocumentStore((s) => s.subscribeToClientDocuments);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToClientDocuments(user.uid);
            return () => unsubscribe();
        }
    }, [user, subscribeToClientDocuments]);

    const vaultDocs = vaultDocuments.filter(d => 
        ['poder_legal', 'cedula', 'certificado_constitucion'].includes(d.type)
    ).filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                <div className="h-4 w-32 bg-slate-100 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
             {/* Hero Section */}
             <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 lg:p-12 shadow-2xl shadow-blue-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/40">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Ambiente Seguro</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Bóveda Documental
                        </h1>
                        <p className="text-slate-300 font-semibold mt-3 text-lg leading-relaxed">
                            Tus documentos validados, listos para ser reutilizados en nuevas gestiones.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-black text-white">{vaultDocs.length}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Activos</div>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-center">
                            <div className="text-3xl font-black text-emerald-400">100%</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Integridad</div>
                        </div>
                    </div>
                </div>
             </div>
             
             {/* Controls */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="relative w-full md:w-96 group">
                     <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400 font-bold" />
                     <Input 
                        placeholder="Buscar en la bóveda..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-6 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 transition-all font-semibold placeholder:text-slate-400" 
                     />
                  </div>
             </div>

             {/* Documents Grid */}
             <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {vaultDocs.map((doc, idx) => {
                    const status = getExpiryStatus(doc.validUntil);
                    const expiryDate = safeDate(doc.validUntil);
                    const days = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                        <Card
                            key={doc.id}
                            className="relative rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-200/30 transition-all duration-300 group overflow-hidden bg-white"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <CardHeader className="p-6 pb-0">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                                        <FileText className="h-7 w-7" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID: {doc.id.substring(0, 8)}</span>
                                </div>
                                <CardTitle className="mt-6 text-xl font-black text-slate-800 line-clamp-1" title={doc.name}>
                                    {doc.name}
                                </CardTitle>
                                <CardDescription className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                    {doc.type.replace('_', ' ')}
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Expiry status banner */}
                                    {status === 'vencido' && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            Documento vencido — será solicitado en tu próxima operación
                                        </div>
                                    )}
                                    {status === 'proximo' && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-semibold text-amber-700 flex items-center gap-2">
                                            <Clock className="w-4 h-4 shrink-0" />
                                            Vence en {days} días
                                        </div>
                                    )}
                                    {status === 'vigente' && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase tracking-widest rounded-lg px-2">
                                            Vigente
                                        </Badge>
                                    )}
                                    {status === 'indefinido' && (
                                        <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[9px] font-black uppercase tracking-widest rounded-lg px-2">
                                            Sin fecha de caducidad
                                        </Badge>
                                    )}

                                    <div className="p-4 rounded-2xl flex items-center justify-between border border-slate-100 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Expiración</p>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {expiryDate ? format(expiryDate, "d 'de' MMMM, yyyy", { locale: es }) : 'INDETERMINADA'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 transition-all text-slate-500 shadow-sm" onClick={() => window.open(doc.url, '_blank')}>
                                            <ChevronRight className="h-4 w-4 mr-2" /> Ver Documento
                                        </Button>
                                        <Button className="h-12 w-12 rounded-2xl bg-slate-900 border-none hover:bg-slate-800 shadow-xl shadow-slate-900/20 text-white p-0 flex items-center justify-center transition-all active:scale-90">
                                            <Download className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
             </div>

             {/* Empty State */}
             {vaultDocs.length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                        <HardDrive className="h-12 w-12 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tu Bóveda está esperando</h3>
                    <p className="mt-2 text-slate-400 font-semibold max-w-xs mx-auto">
                        Los documentos que valides en tus trámites aparecerán aquí automáticamente para tu conveniencia.
                    </p>
                </div>
             )}
        </div>
    );
};

export default ClientVault;
