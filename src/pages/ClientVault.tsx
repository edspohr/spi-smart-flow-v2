import { useEffect } from 'react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, Search, HardDrive, Filter, Clock, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; 
import { cn } from '@/lib/utils';

const ClientVault = () => {
    const { user } = useAuthStore();
    const { vaultDocuments, loading } = useDataStore();

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = useDataStore.getState().subscribeToClientData(user.uid);
            return () => unsubscribe();
        }
    }, [user]);

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
                            Tus documentos validados por nuestra IA, listos para ser reutilizados en nuevas gestiones.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-black text-white">{vaultDocuments.length}</div>
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
                        placeholder="Buscar por nombre, tipo o fecha..." 
                        className="pl-12 pr-4 py-6 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 transition-all font-semibold placeholder:text-slate-400" 
                     />
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl border-slate-100 bg-white font-bold shadow-sm">
                        <Filter className="h-4 w-4 mr-2" /> Filtros
                    </Button>
                    <Button className="flex-1 md:flex-none btn-primary h-12 rounded-2xl px-6 font-bold shadow-lg shadow-blue-500/20">
                        <Download className="h-4 w-4 mr-2" /> Exportar Todo
                    </Button>
                  </div>
             </div>

             {/* Documents Grid */}
             <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {vaultDocuments.map((doc, idx) => {
                    const expiryDate = doc.validUntil ? new Date(doc.validUntil) : null;
                    const isExpired = expiryDate ? expiryDate < new Date() : false;
                    const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                    <Card 
                        key={doc.id} 
                        className="relative rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-200/30 transition-all duration-300 group overflow-hidden bg-white"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <CardHeader className="p-6 pb-0">
                             <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                                    <FileText className="h-7 w-7" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 font-black uppercase text-[9px] tracking-widest rounded-lg">
                                        Validado
                                    </Badge>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID: {doc.id.substring(0, 8)}</span>
                                </div>
                             </div>
                             <CardTitle className="mt-6 text-xl font-black text-slate-800 line-clamp-1" title={doc.name}>
                                {doc.name}
                             </CardTitle>
                             <CardDescription className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                {doc.type.replace('_', ' ')}
                             </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className={cn(
                                    "p-4 rounded-2xl flex items-center justify-between border transition-colors",
                                    isExpired ? "bg-rose-50 border-rose-100" : (daysToExpiry && daysToExpiry < 30 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100")
                                )}>
                                    <div className="flex items-center gap-3">
                                        {isExpired ? <AlertCircle className="h-5 w-5 text-rose-500" /> : <Clock className="h-5 w-5 text-slate-400" />}
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Expiración</p>
                                            <p className={cn("text-xs font-bold font-mono tracking-tight", isExpired ? "text-rose-600" : "text-slate-700")}>
                                                {expiryDate ? expiryDate.toLocaleDateString() : 'INDETERMINADA'}
                                            </p>
                                        </div>
                                    </div>
                                    {daysToExpiry && daysToExpiry > 0 && !isExpired && (
                                        <div className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 uppercase tracking-tighter">
                                            {daysToExpiry}d restantes
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 transition-all text-slate-500 shadow-sm">
                                        <ChevronRight className="h-4 w-4 mr-2" /> Detalles
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
             {vaultDocuments.length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                        <HardDrive className="h-12 w-12 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tu Bóveda está esperando</h3>
                    <p className="mt-2 text-slate-400 font-semibold max-w-xs mx-auto">
                        Los documentos que valides en tus trámites aparecerán aquí automáticamente para tu conveniencia.
                    </p>
                    <Button className="mt-8 btn-primary px-8 h-12 rounded-2xl font-bold shadow-lg shadow-blue-500/20">
                        Ir al Tablero Principal
                    </Button>
                </div>
             )}
        </div>
    );
};

export default ClientVault;
