import { useEffect, useState } from 'react';
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
    Building2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const CompaniesPage = () => {
    const { companies, subscribeToCompanies, createCompany, updateCompany, deleteCompany } = useDataStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
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
        return () => unsubscribe();
    }, [subscribeToCompanies]);

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
            } else {
                await createCompany(formData);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error saving company:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar esta empresa?")) {
            await deleteCompany(id);
        }
    };

    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6 max-w-[1400px] mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-50 tracking-tight flex items-center gap-3">
                        Empresas Clientes <Building2 className="text-blue-500 h-7 w-7" />
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Gestiona las entidades legales y perfiles corporativos.</p>
                </div>
                <Button 
                    onClick={() => handleOpenDialog()}
                    className="btn-primary rounded-xl h-11 px-6 shadow-lg shadow-blue-900/40 font-bold transition-all border border-blue-500/50"
                >
                    <Plus className="h-5 w-5 mr-2" /> Nueva Empresa
                </Button>
            </div>

            {/* toolbar */}
            <div className="flex gap-4 items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input 
                        placeholder="Buscar empresa por nombre, RUT o industria..." 
                        className="pl-10 bg-slate-800/50 border-slate-700 rounded-xl h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map(company => (
                    <Card key={company.id} className="bg-slate-900/40 border-slate-800 hover:border-blue-500/50 transition-all group rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Building2 className="text-blue-400 h-6 w-6" />
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(company)} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)} className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
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
                ))}

                {filteredCompanies.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
                        <Building2 className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-bold text-lg">No se encontraron empresas</p>
                        <p className="text-sm">Agrega una nueva empresa para comenzar a asignar usuarios y OTs.</p>
                    </div>
                )}
            </div>

            {/* Dialog */}
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
