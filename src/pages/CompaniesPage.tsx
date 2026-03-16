import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useDataStore, { Company } from '../store/useDataStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Building2,
    Users,
    Activity
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from '@/components/ConfirmDialog';
import ClientList from '@/components/admin/ClientList';
import { cn } from '@/lib/utils';

const CompaniesPage = () => {
    const { companies, subscribeToCompanies, createCompany, updateCompany, deleteCompany, ots, documents, subscribeToOTs, subscribeToAllDocuments } = useDataStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        industry: "",
        taxId: "",
        address: "",
        contactName: "",
        contactEmail: ""
    });

    useEffect(() => {
        const unsubscribe = subscribeToCompanies();
        const unsubscribeOTs = subscribeToOTs();
        const unsubscribeDocs = subscribeToAllDocuments();
        return () => {
            unsubscribe();
            unsubscribeOTs();
            unsubscribeDocs();
        };
    }, [subscribeToCompanies, subscribeToOTs, subscribeToAllDocuments]);

    const handleOpenDialog = (company?: Company) => {
        if (company) {
            setEditingCompany(company);
            setFormData({
                name: company.name,
                industry: company.industry || "",
                taxId: company.taxId || "",
                address: company.address || "",
                contactName: company.contactName || "",
                contactEmail: company.contactEmail || ""
            });
        } else {
            setEditingCompany(null);
            setFormData({
                name: "",
                industry: "",
                taxId: "",
                address: "",
                contactName: "",
                contactEmail: ""
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCompany) {
                await updateCompany(editingCompany.id, formData);
                toast.success('Empresa actualizada correctamente');
            } else {
                await createCompany(formData);
                toast.success('Empresa creada correctamente');
            }
            setIsDialogOpen(false);
        } catch (error) {
            toast.error('Error al guardar la empresa. Intenta nuevamente.');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteCompany(deleteTarget.id);
            toast.success(`Empresa "${deleteTarget.name}" eliminada`);
            setDeleteTarget(null);
        } catch {
            toast.error('Error al eliminar la empresa');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCompanyHealth = (companyId: string | undefined) => {
        if (!companyId) return null;
        
        const companyOts = ots.filter(ot => ot.companyId === companyId);
        if (companyOts.length === 0) return { status: 'idle', color: 'bg-slate-800 text-slate-400 border-slate-700', label: 'Sin Actividad' };

        let hasPendingDocs = false;
        let isStuck = false;

        const now = new Date();

        for (const ot of companyOts) {
            const otDocs = documents.filter(d => d.otId === ot.id);
            const pending = otDocs.some(d => d.status === 'pending' || d.status === 'rejected');
            if (pending) hasPendingDocs = true;

            const daysSinceCreation = Math.floor((now.getTime() - new Date(ot.createdAt).getTime()) / (1000 * 3600 * 24));
            if (daysSinceCreation > 15 && ot.stage !== 'finalizado') {
                isStuck = true;
            }
        }

        if (isStuck) return { status: 'stuck', color: 'bg-rose-500/20 text-rose-400 border-rose-500/50', label: 'Atascado (>15 días)' };
        if (hasPendingDocs) return { status: 'pending', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50', label: 'Docs. Pendientes' };
        
        return { status: 'healthy', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', label: 'Al día' };
    };

    return (
        <div className="space-y-8 p-6 max-w-[1400px] mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-50 tracking-tight flex items-center gap-3">
                        Empresas Clientes <Building2 className="text-blue-500 h-7 w-7" />
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Gestión unificada de entidades corporativas y sus usuarios.</p>
                </div>
                {activeTab === 'companies' && (
                    <Button 
                        onClick={() => handleOpenDialog()}
                        className="btn-primary rounded-xl h-11 px-6 shadow-lg shadow-blue-900/40 font-bold transition-all border border-blue-500/50"
                    >
                        <Plus className="h-5 w-5 mr-2" /> Nueva Empresa
                    </Button>
                )}
            </div>

            {/* Custom Tabs */}
            <div className="flex p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 w-fit">
                <button
                    onClick={() => setActiveTab('companies')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'companies' 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <Building2 className="h-4 w-4" /> Empresas
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'users' 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <Users className="h-4 w-4" /> Usuarios
                </button>
            </div>

            {activeTab === 'companies' ? (
                <div className="space-y-6">
                    {/* toolbar */}
                    <div className="flex gap-4 items-center bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input 
                                placeholder="Buscar empresa por nombre, RUT o industria..." 
                                className="pl-10 bg-slate-800/50 border-slate-700/50 rounded-xl h-10 text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.map(company => {
                            const health = getCompanyHealth(company.name); // Using name as ID based on current implementation
                            
                            return (
                            <Card key={company.id} className="bg-slate-900/40 border-slate-800 hover:border-blue-500/50 transition-all group rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3 items-center mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Building2 className="text-blue-400 h-6 w-6" />
                                            </div>
                                            {health && (
                                                <div className={cn("px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-1", health.color)}>
                                                    <Activity className="w-3 h-3" /> {health.label}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(company)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(company)} className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-black text-white tracking-tight">{company.name}</CardTitle>
                                    <CardDescription className="text-slate-500 font-bold text-xs uppercase tracking-widest">{company.industry || 'Industria no especificada'}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ID Fiscal (RUT)</p>
                                            <p className="text-xs font-bold text-slate-300">{company.taxId || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Contacto</p>
                                            <p className="text-xs font-bold text-slate-300 truncate">{company.contactName || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800/50">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Dirección</p>
                                        <p className="text-xs font-medium text-slate-400 line-clamp-1">{company.address || 'Sin dirección registrada'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )})}
                    </div>
                </div>
            ) : (
                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-1 border border-white/5 overflow-hidden">
                    <ClientList />
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                title="Eliminar Empresa"
                description={`¿Estás seguro de que deseas eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
                confirmLabel="Sí, eliminar"
                confirmVariant="destructive"
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 max-w-md rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Completa los datos de la entidad corporativa.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre de la Empresa</Label>
                            <Input 
                                required
                                className="bg-slate-800/50 border-slate-700 rounded-xl h-12 font-bold"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Pj. ABC Corp SpA"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Industria</Label>
                                <Input 
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                    value={formData.industry}
                                    onChange={e => setFormData({...formData, industry: e.target.value})}
                                    placeholder="Software, Legal..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">RUT / ID Fiscal</Label>
                                <Input 
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-mono font-bold"
                                    value={formData.taxId}
                                    onChange={e => setFormData({...formData, taxId: e.target.value})}
                                    placeholder="76.000.000-0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dirección Física</Label>
                            <Input 
                                className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                placeholder="Av. Principal #123"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contacto Principal</Label>
                                <Input 
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                    value={formData.contactName}
                                    onChange={e => setFormData({...formData, contactName: e.target.value})}
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email de Contacto</Label>
                                <Input 
                                    type="email"
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                    value={formData.contactEmail}
                                    onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                                    placeholder="juan@empresa.com"
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold text-slate-400">Cancelar</Button>
                            <Button type="submit" className="btn-primary rounded-xl px-8 font-black shadow-lg shadow-blue-500/20">
                                {editingCompany ? 'Guardar Cambios' : 'Crear Empresa'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CompaniesPage;
