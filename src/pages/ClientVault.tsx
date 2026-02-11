import { useEffect } from 'react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; 

const ClientVault = () => {
    const { user } = useAuthStore();
    const { vaultDocuments, loading } = useDataStore();

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = useDataStore.getState().subscribeToClientData(user.uid);
            return () => unsubscribe();
        }
    }, [user]);

    if (loading) return <div className="p-10 text-center">Cargando bóveda...</div>;

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-green-600" />
                        Bóveda Documental
                    </h1>
                    <p className="text-slate-500 mt-1">Tus documentos validados listos para reutilizarse.</p>
                 </div>
                 
                 <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar documento..." className="pl-9 bg-white" />
                 </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vaultDocuments.map((doc) => (
                    <Card key={doc.id} className="glass-card hover:border-green-200 transition-colors group">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                                    Validado
                                </Badge>
                             </div>
                             <CardTitle className="mt-4 text-base font-bold text-slate-800 truncate" title={doc.name}>
                                {doc.name}
                             </CardTitle>
                             <CardDescription className="text-xs">
                                {doc.type.toUpperCase().replace('_', ' ')}
                             </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                    Vence: <span className="font-semibold text-slate-700">{doc.validUntil ? new Date(doc.validUntil).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <Button variant="outline" className="w-full text-xs gap-2 hover:text-green-700 hover:border-green-200">
                                    <Download className="h-3 w-3" /> Descargar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {vaultDocuments.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Tu bóveda está vacía</h3>
                    <p className="mt-1 text-sm text-slate-500">Los documentos verificados aparecerán aquí automáticamente.</p>
                </div>
            )}
        </div>
    );
};

export default ClientVault;
