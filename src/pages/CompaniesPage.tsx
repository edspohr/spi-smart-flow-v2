import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useDataStore, { Company } from '../store/useDataStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Building2,
    Activity,
    Users,
    ChevronDown,
    Settings,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';

interface EditableUser {
    id: string;
    displayName: string;
    email: string;
    role: 'spi-admin' | 'client' | 'guest';
    companyId: string;
    phone?: string;
    altContactName?: string;
}

const getRoleBadge = (role: string) => {
    switch (role) {
        case 'spi-admin':
            return <Badge className="bg-slate-900 text-white border-none text-[8px] font-black uppercase tracking-widest px-2">SPI Admin</Badge>;
        case 'client':
            return <Badge className="bg-blue-100 text-blue-700 border-none text-[8px] font-black uppercase tracking-widest px-2">Cliente Activo</Badge>;
        case 'guest':
            return <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase tracking-widest px-2 animate-pulse">Pendiente Aprob.</Badge>;
        default:
            return <Badge className="bg-slate-50 text-slate-300 border-none text-[8px] font-black uppercase tracking-widest px-2">Desconocido</Badge>;
    }
};

const CompaniesPage = () => {
    const {
        companies, users,
        subscribeToCompanies, subscribeToUsers,
        createCompany, updateCompany, deleteCompany,
        ots, documents,
        subscribeToOTs, subscribeToAllDocuments,
    } = useDataStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Company CRUD state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        taxId: '',
        address: '',
        contactName: '',
        contactEmail: '',
    });

    // User edit state
    const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [isSavingUser, setIsSavingUser] = useState(false);

    useEffect(() => {
        const unsubCompanies = subscribeToCompanies();
        const unsubOTs = subscribeToOTs();
        const unsubDocs = subscribeToAllDocuments();
        const unsubUsers = subscribeToUsers();
        return () => {
            unsubCompanies();
            unsubOTs();
            unsubDocs();
            unsubUsers();
        };
    }, [subscribeToCompanies, subscribeToOTs, subscribeToAllDocuments, subscribeToUsers]);

    // ── Company CRUD helpers ─────────────────────────────────────────────────

    const handleOpenDialog = (company?: Company) => {
        if (company) {
            setEditingCompany(company);
            setFormData({
                name: company.name,
                industry: company.industry || '',
                taxId: company.taxId || '',
                address: company.address || '',
                contactName: company.contactName || '',
                contactEmail: company.contactEmail || '',
            });
        } else {
            setEditingCompany(null);
            setFormData({ name: '', industry: '', taxId: '', address: '', contactName: '', contactEmail: '' });
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
        } catch {
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

    // ── User edit helper ─────────────────────────────────────────────────────

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSavingUser(true);
        try {
            await updateDoc(doc(db, 'users', editingUser.id), {
                role: editingUser.role,
                companyId: editingUser.companyId,
                phone: editingUser.phone || '',
                altContactName: editingUser.altContactName || '',
            });
            toast.success('Usuario actualizado');
            setEditUserOpen(false);
            setEditingUser(null);
        } catch {
            toast.error('Error al guardar el usuario');
        } finally {
            setIsSavingUser(false);
        }
    };

    // ── Derived data ─────────────────────────────────────────────────────────

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCompanyHealth = (companyId: string) => {
        const companyOts = ots.filter(ot => ot.companyId === companyId);
        if (companyOts.length === 0) {
            return { color: 'bg-slate-800 text-slate-400 border-slate-700', label: 'Sin Actividad' };
        }
        const now = new Date();
        let hasPendingDocs = false;
        let isStuck = false;
        for (const ot of companyOts) {
            const otDocs = documents.filter(d => d.otId === ot.id);
            if (otDocs.some(d => d.status === 'pending' || d.status === 'rejected')) hasPendingDocs = true;
            const days = Math.floor((now.getTime() - new Date(ot.createdAt).getTime()) / 86400000);
            if (days > 15 && ot.stage !== 'finalizado') isStuck = true;
        }
        if (isStuck) return { color: 'bg-rose-500/20 text-rose-400 border-rose-500/50', label: 'Atascado (>15 días)' };
        if (hasPendingDocs) return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/50', label: 'Docs. Pendientes' };
        return { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', label: 'Al día' };
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 p-6 max-w-[1400px] mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-50 tracking-tight flex items-center gap-3">
                        Empresas <Building2 className="text-blue-500 h-7 w-7" />
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Empresas clientes registradas en la plataforma.</p>
                </div>
                <Button
                    onClick={() => handleOpenDialog()}
                    className="btn-primary rounded-xl h-11 px-6 shadow-lg shadow-blue-900/40 font-bold transition-all border border-blue-500/50"
                >
                    <Plus className="h-5 w-5 mr-2" /> Nueva Empresa
                </Button>
            </div>

            {/* Search */}
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

            {/* Companies grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map(company => {
                    const health = getCompanyHealth(company.id);
                    const companyUsers = (users as EditableUser[]).filter(u => u.companyId === company.id);
                    const isExpanded = expandedId === company.id;

                    return (
                        <Card key={company.id} className="bg-slate-900/40 border-slate-800 hover:border-blue-500/50 transition-all group rounded-[2rem] overflow-hidden flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3 items-center mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Building2 className="text-blue-400 h-6 w-6" />
                                        </div>
                                        <div className={cn('px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-1', health.color)}>
                                            <Activity className="w-3 h-3" /> {health.label}
                                        </div>
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

                            <CardContent className="space-y-4 flex-1">
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

                            {/* Expandable users footer */}
                            <div className="border-t border-slate-800/50">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : company.id)}
                                    className="w-full flex items-center justify-between px-6 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors"
                                >
                                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <Users className="h-3.5 w-3.5" />
                                        Ver usuarios ({companyUsers.length})
                                    </span>
                                    <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-2">
                                        {companyUsers.length === 0 ? (
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center py-3">
                                                Sin usuarios asignados
                                            </p>
                                        ) : (
                                            companyUsers.map(u => (
                                                <div key={u.id} className="flex items-center gap-3 bg-slate-800/30 rounded-xl px-3 py-2.5">
                                                    <Avatar className="h-8 w-8 rounded-xl shrink-0">
                                                        <AvatarFallback className={cn(
                                                            'font-black text-xs text-white',
                                                            u.role === 'guest' ? 'bg-amber-500' : 'bg-blue-600'
                                                        )}>
                                                            {u.displayName?.charAt(0).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-white truncate">{u.displayName || 'Sin nombre'}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 truncate">{u.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {getRoleBadge(u.role)}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700"
                                                            onClick={() => { setEditingUser({ ...u }); setEditUserOpen(true); }}
                                                            title="Configurar usuario"
                                                        >
                                                            <Settings className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}

                {filteredCompanies.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                        <Building2 className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            {searchTerm ? 'Sin resultados para tu búsqueda' : 'Sin empresas registradas'}
                        </p>
                    </div>
                )}
            </div>

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

            {/* Create / Edit Company Dialog */}
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
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Pj. ABC Corp SpA"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Industria</Label>
                                <Input
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                    value={formData.industry}
                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                    placeholder="Software, Legal..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">RUT / ID Fiscal</Label>
                                <Input
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-mono font-bold"
                                    value={formData.taxId}
                                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                    placeholder="76.000.000-0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dirección Física</Label>
                            <Input
                                className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Av. Principal #123"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contacto Principal</Label>
                                <Input
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                    value={formData.contactName}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email de Contacto</Label>
                                <Input
                                    type="email"
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium"
                                    value={formData.contactEmail}
                                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
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

            {/* Edit User Dialog */}
            <Dialog open={editUserOpen} onOpenChange={(open) => { if (!open) { setEditUserOpen(false); setEditingUser(null); } }}>
                <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-50 rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">Configurar Usuario</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Actualiza el rol y datos de contacto del usuario.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <form onSubmit={handleSaveUser} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rol de Usuario</Label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-800/50 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as EditableUser['role'] })}
                                >
                                    <option value="guest">Invitado (Pendiente Aprobación)</option>
                                    <option value="client">Cliente Activo</option>
                                    <option value="spi-admin">SPI Admin</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Empresa Vinculada</Label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl border border-slate-700 bg-slate-800/50 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={editingUser.companyId || ''}
                                    onChange={e => setEditingUser({ ...editingUser, companyId: e.target.value })}
                                >
                                    <option value="">Seleccionar empresa...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teléfono (WhatsApp)</Label>
                                <Input
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium text-white"
                                    value={editingUser.phone || ''}
                                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    placeholder="+56 9..."
                                />
                            </div>
                            <Separator className="bg-slate-800" />
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contacto Alternativo</Label>
                                <Input
                                    className="bg-slate-800/50 border-slate-700 rounded-xl h-11 font-medium text-white"
                                    value={editingUser.altContactName || ''}
                                    onChange={e => setEditingUser({ ...editingUser, altContactName: e.target.value })}
                                    placeholder="Nombre del contacto de escalamiento"
                                />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="ghost" disabled={isSavingUser} onClick={() => { setEditUserOpen(false); setEditingUser(null); }} className="rounded-xl font-bold text-slate-400">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSavingUser} className="btn-primary rounded-xl px-8 font-black">
                                    {isSavingUser ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CompaniesPage;
