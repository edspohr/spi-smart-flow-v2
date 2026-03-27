import { useEffect, useState } from 'react';
import useDataStore from '../store/useDataStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, Search, HardDrive, ListFilter, Clock, AlertCircle, FileText, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const SPIVault = () => {
    const { vaultDocuments, loading, subscribeToAllDocuments } = useDataStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCompany, setFilterCompany] = useState("all");
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        const unsubscribe = subscribeToAllDocuments();
        return () => unsubscribe();
    }, [subscribeToAllDocuments]);

    const companies = Array.from(new Set(vaultDocuments.map(doc => doc.validationMetadata?.companyName || (doc as any).companyId))).filter(Boolean);
    const docTypes = Array.from(new Set(vaultDocuments.map(doc => doc.type))).filter(Boolean);

    const filteredDocs = vaultDocuments.filter(doc => {
        const companyName = doc.validationMetadata?.companyName || (doc as any).companyId || "";
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === "all" || companyName === filterCompany;
        const matchesType = filterType === "all" || doc.type === filterType;
        return matchesSearch && matchesCompany && matchesType;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Cargando Bóveda Global...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12 p-6 max-w-[1800px] mx-auto">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        Bóveda Global <ShieldCheck className="text-blue-400 h-8 w-8" />
                    </h1>
                    <p className="text-slate-400 font-bold mt-1">Supervisión y gestión de documentos validados en toda la plataforma.</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-center gap-8 shadow-sm">
                    <div className="text-center">
                        <div className="text-3xl font-black text-slate-900">{vaultDocuments.length}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Docs</div>
                    </div>
                    <div className="h-10 w-px bg-slate-100" />
                    <div className="text-center group cursor-help">
                        <div className="text-3xl font-black text-emerald-600 group-hover:scale-110 transition-transform">100%</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Verificados</div>
                    </div>
                </div>
             </div>
             
             {/* Controls */}
             <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/80 p-4 rounded-3xl border border-slate-200 backdrop-blur-sm shadow-sm">
                  <div className="relative w-full lg:w-96">
                     <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                     <Input 
                        placeholder="Buscar por nombre o empresa..." 
                        className="pl-12 h-11 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none min-w-[200px]">
                        <ListFilter className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <select 
                            className="w-full pl-11 pr-10 h-11 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                        >
                            <option value="all">Todas las Empresas</option>
                            {companies.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none">
                            <Filter className="h-3 w-3 text-slate-400" />
                        </div>
                    </div>
                    <div className="relative flex-1 lg:flex-none min-w-[200px]">
                        <Filter className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <select 
                            className="w-full pl-11 pr-10 h-11 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 transition-all font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Todos los Tipos</option>
                            {docTypes.map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none">
                            <ListFilter className="h-3 w-3 text-slate-400" />
                        </div>
                    </div>
                  </div>
             </div>

             {/* Documents Grid */}
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDocs.map((doc) => {
                    const companyName = doc.validationMetadata?.companyName || (doc as any).companyId || "Empresa Desconocida";
                    const expiryStatus = getExpiryStatus(doc.validUntil);
                    const expiryDate = safeDate(doc.validUntil);
                    const expiryDays = expiryDate
                      ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                    <Card
                        key={doc.id}
                        className="group relative rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-200/30 transition-all duration-300 overflow-hidden bg-white flex flex-col h-full"
                    >
                        <CardHeader className="p-6 pb-0 space-y-4 flex-none">
                             <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-transform group-hover:rotate-12">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 font-black uppercase text-[8px] tracking-[0.2em] rounded-lg mb-1">
                                        Validado
                                    </Badge>
                                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                                        {doc.id.substring(0, 8)}
                                    </p>
                                </div>
                             </div>
                             <div>
                                <CardTitle className="text-lg font-black text-slate-900 line-clamp-1 h-7" title={doc.name}>
                                    {doc.name}
                                </CardTitle>
                                <CardDescription className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">
                                    {doc.type.replace('_', ' ')}
                                </CardDescription>
                             </div>
                        </CardHeader>
                        
                        <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 rounded-xl ring-2 ring-white shadow-sm border-none">
                                        <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-black">
                                            {companyName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Empresa</p>
                                        <p className="text-xs font-bold text-slate-900 truncate">{companyName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2 border-t border-slate-200/50">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Válido hasta</p>
                                        <p className="text-xs font-bold text-slate-900">
                                            {(() => {
                                                const d = safeDate(doc.validUntil);
                                                return d ? d.toLocaleDateString() : 'INDETERMINADA';
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expiry status banner */}
                            <div className="mt-auto pt-2">
                                {expiryStatus === 'vencido' && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-[11px] font-bold text-rose-700 flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                        <span>Documento vencido — se solicitará actualización</span>
                                    </div>
                                )}
                                {expiryStatus === 'proximo' && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] font-bold text-amber-800 flex items-start gap-3">
                                        <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                                        <span>Vence en {expiryDays} días</span>
                                    </div>
                                )}
                                {expiryStatus === 'vigente' && (
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-1.5 w-full justify-center">
                                        Vigente
                                    </Badge>
                                )}
                                {expiryStatus === 'indefinido' && (
                                    <Badge className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-1.5 w-full justify-center">
                                        Vigencia Indefinida
                                    </Badge>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => doc.url && window.open(doc.url, '_blank')}
                                    disabled={!doc.url}
                                    className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
                                >
                                    Ver Documento
                                </Button>
                                <Button 
                                    onClick={() => {
                                        if (doc.url) {
                                            const a = document.createElement('a');
                                            a.href = doc.url;
                                            a.download = doc.name;
                                            a.click();
                                        }
                                    }}
                                    disabled={!doc.url}
                                    className="h-12 w-12 rounded-2xl bg-slate-900 border-none hover:bg-slate-800 shadow-xl shadow-slate-900/10 text-white p-0 flex items-center justify-center transition-all active:scale-95 group/btn"
                                >
                                    <Download className="h-4 w-4 group-hover/btn:translate-y-0.5 transition-transform" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    );
                })}
             </div>

             {/* Empty State */}
             {filteredDocs.length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                        <HardDrive className="h-12 w-12 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">No se encontraron documentos</h3>
                    <p className="mt-2 text-slate-400 font-semibold max-w-xs mx-auto">
                        Intenta ajustar los filtros o términos de búsqueda para encontrar lo que necesitas.
                    </p>
                </div>
             )}
        </div>
    );
};

export default SPIVault;
