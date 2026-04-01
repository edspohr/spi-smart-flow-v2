import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useDataStore, { Company } from '../store/useDataStore';
import useAdminStore from '../store/useAdminStore';
import useAuthStore from '../store/useAuthStore';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn, safeDate } from '@/lib/utils';

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
            return <Badge className="bg-slate-900 text-white border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm shadow-slate-900/10">SPI Admin</Badge>;
        case 'client':
            return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm shadow-blue-900/5">Cliente Activo</Badge>;
        case 'guest':
            return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm shadow-amber-900/5">Pendiente</Badge>;
        default:
            return <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">Desconocido</Badge>;
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

    const { updateUserActivation } = useAdminStore();
    const { user: adminUser } = useAuthStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Company CRUD state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);
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
        setIsLoadingData(true);
        const unsubCompanies = subscribeToCompanies();
        const unsubOTs = subscribeToOTs();
        const unsubDocs = subscribeToAllDocuments();
        const unsubUsers = subscribeToUsers();
        // Mark loaded after first tick — subscriptions fire synchronously if cache is warm
        const t = setTimeout(() => setIsLoadingData(false), 600);
        return () => {
            unsubCompanies();
            unsubOTs();
            unsubDocs();
            unsubUsers();
            clearTimeout(t);
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
        setIsSubmittingCompany(true);
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
        } finally {
            setIsSubmittingCompany(false);
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
            if (
                (editingUser.role === 'client' || editingUser.role === 'spi-admin') &&
                editingUser.companyId
            ) {
                await updateUserActivation(
                    editingUser.id,
                    editingUser.companyId,
                    editingUser.role as 'client' | 'spi-admin',
                    adminUser?.uid || '',
                );
            } else {
                await updateDoc(doc(db, 'users', editingUser.id), {
                    role: editingUser.role,
                    companyId: editingUser.companyId,
                    phone: editingUser.phone || '',
                    altContactName: editingUser.altContactName || '',
                });
            }
            toast.success('Usuario actualizado correctamente');
            setEditUserOpen(false);
            setEditingUser(null);
        } catch {
            toast.error('Error al guardar el usuario. Intenta nuevamente.');
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
            return { color: 'bg-slate-50 text-slate-400 border-slate-100', label: 'Sin Actividad' };
        }
        const now = new Date();
        let hasPendingDocs = false;
        let isStuck = false;
        for (const ot of companyOts) {
            const otDocs = documents.filter(d => d.otId === ot.id);
            if (otDocs.some(d => d.status === 'pending' || d.status === 'rejected')) hasPendingDocs = true;
            const otDate = safeDate(ot.updatedAt || ot.createdAt);
            const days = otDate ? Math.floor((now.getTime() - otDate.getTime()) / 86400000) : 0;
            if (days > 7 && ot.stage !== 'finalizado') isStuck = true;
        }
        if (isStuck) return { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Sin actividad (+7 días)' };
        if (hasPendingDocs) return { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Docs. Pendientes' };
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Al día' };
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 p-6 max-w-[1400px] mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        Empresas <Building2 className="text-blue-400 h-7 w-7" />
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Empresas clientes registradas en la plataforma.</p>
                </div>
                <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 shadow-lg shadow-blue-500/20 font-bold transition-all"
                >
                    <Plus className="h-5 w-5 mr-2" /> Nueva Empresa
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-4 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar empresa por nombre, RUT o industria..."
                        className="pl-12 bg-slate-50 border-slate-200 rounded-2xl h-12 text-slate-900 focus:ring-blue-500/20 placeholder:text-slate-400 font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Companies grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingData ? (
                  <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-5 shadow-sm">
                        <div className="flex justify-between items-start">
                          <Skeleton className="w-14 h-14 rounded-2xl" />
                          <Skeleton className="w-24 h-6 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-3/4 rounded-xl" />
                          <Skeleton className="h-4 w-1/2 rounded-lg" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Skeleton className="h-12 rounded-xl" />
                          <Skeleton className="h-12 rounded-xl" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : filteredCompanies.map(company => {
                    const health = getCompanyHealth(company.id);
                    const companyUsers = (users as EditableUser[]).filter(u => u.companyId === company.id);
                    const isExpanded = expandedId === company.id;

                    return (
                        <Card key={company.id} className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all group rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                            <CardHeader className="pb-4 p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100/50">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <div className={cn('px-4 py-1.5 rounded-2xl border text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-2 shadow-sm', health.color)}>
                                            <Activity className="w-3.5 h-3.5" /> {health.label}
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
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{company.name}</CardTitle>
                                <CardDescription className="text-slate-500 font-black text-[10px] uppercase tracking-[0.15em] mt-1">{company.industry || 'Industria no especificada'}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Fiscal (RUT)</p>
                                        <p className="text-sm font-bold text-slate-950 tracking-tight">{company.taxId || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                                        <p className="text-sm font-bold text-slate-950 truncate tracking-tight">{company.contactName || '—'}</p>
                                    </div>
                                </div>
                                <div className="pt-5 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dirección</p>
                                    <p className="text-xs font-bold text-slate-600 line-clamp-1">{company.address || 'Sin dirección registrada'}</p>
                                </div>
                            </CardContent>

                            {/* Expandable users footer */}
                            <div className="border-t border-slate-50 bg-slate-50/30">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : company.id)}
                                    className="w-full flex items-center justify-between px-8 py-4 text-slate-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all"
                                >
                                    <span className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.1em]">
                                        <Users className="h-4 w-4" />
                                        Usuarios Vinculados ({companyUsers.length})
                                    </span>
                                    <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', isExpanded && 'rotate-180')} />
                                </button>

                                {isExpanded && (
                                    <div className="px-6 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {companyUsers.length === 0 ? (
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center py-6 bg-white/50 rounded-3xl border border-dashed border-slate-100 mx-2">
                                                Sin usuarios asignados
                                            </p>
                                        ) : (
                                            companyUsers.map(u => (
                                                <div key={u.id} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                                    <Avatar className="h-10 w-10 rounded-2xl shrink-0 shadow-md shadow-blue-500/10">
                                                        <AvatarFallback className={cn(
                                                            'font-black text-sm text-white',
                                                            u.role === 'guest' ? 'bg-amber-500' : 'bg-royal-gradient'
                                                        )}>
                                                            {u.displayName?.charAt(0).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{u.displayName || 'Sin nombre'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 truncate tracking-wide">{u.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {getRoleBadge(u.role)}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                            onClick={() => { setEditingUser({ ...u }); setEditUserOpen(true); }}
                                                            title="Configurar usuario"
                                                        >
                                                            <Settings className="h-4 w-4" />
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

                {!isLoadingData && filteredCompanies.length === 0 && (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 bg-slate-50 rounded-[3rem]">
                        <Building2 className="h-14 w-14 text-slate-200 mx-auto mb-6" />
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
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
                <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-xl rounded-[2.5rem] p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                            {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-base mt-2">
                            Completa los datos de la entidad corporativa para gestionar sus operaciones.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre Legal de la Empresa</Label>
                            <Input
                                required
                                className="bg-slate-50 border-slate-200 rounded-2xl h-14 font-bold text-slate-900 px-6 focus:ring-blue-500/10 shadow-inner"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: ABC Tecnología SpA"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Industria / Sector</Label>
                                <Input
                                    className="bg-slate-50 border-slate-200 rounded-2xl h-12 font-semibold text-slate-700 px-5 focus:ring-blue-500/10"
                                    value={formData.industry}
                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                    placeholder="Software, Logística..."
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">RUT / Identificador Fiscal</Label>
                                <Input
                                    className="bg-slate-50 border-slate-200 rounded-2xl h-12 font-mono font-bold text-slate-800 px-5 focus:ring-blue-500/10"
                                    value={formData.taxId}
                                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                    placeholder="76.000.000-0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Casa Matriz / Dirección Habitual</Label>
                            <Input
                                className="bg-slate-50 border-slate-200 rounded-2xl h-12 font-semibold text-slate-600 px-5 focus:ring-blue-500/10"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Avenida Principal #1234, Of. 501"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Representante / Contacto</Label>
                                <Input
                                    className="bg-slate-50 border-slate-200 rounded-2xl h-12 font-semibold text-slate-700 px-5 focus:ring-blue-500/10"
                                    value={formData.contactName}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    placeholder="Juan Pérez Silva"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Correo de Notificaciones</Label>
                                <Input
                                    type="email"
                                    className="bg-slate-50 border-slate-200 rounded-2xl h-12 font-semibold text-slate-700 px-5 focus:ring-blue-500/10"
                                    value={formData.contactEmail}
                                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                    placeholder="contacto@empresa.cl"
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-8 gap-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 px-6 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">Cancelar</Button>
                            <Button type="submit" disabled={isSubmittingCompany} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-blue-500/20 transition-all">
                                {isSubmittingCompany ? 'Procesando...' : (editingCompany ? 'Actualizar Registro' : 'Registrar Empresa')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editUserOpen} onOpenChange={(open) => { if (!open) { setEditUserOpen(false); setEditingUser(null); } }}>
                <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 rounded-[2.5rem] p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Configurar Usuario</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-sm mt-2">
                            Actualiza los permisos y la vinculación corporativa del usuario.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <form onSubmit={handleSaveUser} className="space-y-6 pt-6">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Rol de Acceso</Label>
                                <select
                                    className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-inner"
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as EditableUser['role'] })}
                                >
                                    <option value="guest">Invitado (Acceso Limitado)</option>
                                    <option value="client">Cliente Activo (Gestión Documental)</option>
                                    <option value="spi-admin">SPI Admin (Super Administrador)</option>
                                </select>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Empresa Vinculada</Label>
                                <select
                                    className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-inner"
                                    value={editingUser.companyId || ''}
                                    onChange={e => setEditingUser({ ...editingUser, companyId: e.target.value })}
                                >
                                    <option value="">Sin empresa vinculada...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Teléfono Móvil (WhatsApp)</Label>
                                <Input
                                    className="bg-slate-50 border-slate-200 rounded-2xl h-12 font-semibold text-slate-800 px-5 focus:ring-blue-500/10 shadow-inner"
                                    value={editingUser.phone || ''}
                                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    placeholder="+56 9 1234 5678"
                                />
                            </div>
                            <Separator className="bg-slate-100" />
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Contacto Alternativo / Escalamiento</Label>
                                <Input
                                    className="bg-slate-50 border-slate-200 rounded-2xl h-12 font-semibold text-slate-800 px-5 focus:ring-blue-500/10 shadow-inner"
                                    value={editingUser.altContactName || ''}
                                    onChange={e => setEditingUser({ ...editingUser, altContactName: e.target.value })}
                                    placeholder="Nombre del contacto secundario"
                                />
                            </div>
                            <DialogFooter className="pt-6 gap-3">
                                <Button type="button" variant="ghost" disabled={isSavingUser} onClick={() => { setEditUserOpen(false); setEditingUser(null); }} className="rounded-2xl h-12 px-6 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSavingUser} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-blue-500/20 transition-all">
                                    {isSavingUser ? 'Guardando...' : 'Aplicar Cambios'}
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
