import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import useAdminStore from '@/store/useAdminStore';
import useAuthStore from '@/store/useAuthStore';
import type { AppUser, Company } from '@/store/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, safeDate } from '@/lib/utils';
import { Search, Users, ChevronDown, Loader2 } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(u: AppUser): string {
    return u.name || u.displayName || u.email;
}

function roleLabel(role: AppUser['role']): string {
    if (role === 'spi-admin') return 'Administrador SPI';
    if (role === 'client') return 'Cliente';
    return 'Invitado';
}

function formatDate(raw: any): string {
    const d = safeDate(raw);
    if (!d) return '—';
    return format(d, 'd MMM yyyy', { locale: es });
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ role }: { role: AppUser['role'] }) {
    if (role === 'guest') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Pendiente activación
            </span>
        );
    }
    if (role === 'spi-admin') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Administrador
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Activo
        </span>
    );
}

// ── Activate / Edit Modal ─────────────────────────────────────────────────────

interface ModalProps {
    user: AppUser;
    companies: Company[];
    onClose: () => void;
}

function ActivateModal({ user, companies, onClose }: ModalProps) {
    const { user: adminUser } = useAuthStore();
    const { updateUserActivation } = useAdminStore();
    const isGuest = user.role === 'guest';

    const [selectedCompanyId, setSelectedCompanyId] = useState(user.companyId ?? '');
    const [selectedRole, setSelectedRole] = useState<'client' | 'spi-admin'>(
        user.role === 'spi-admin' ? 'spi-admin' : 'client'
    );
    const [companySearch, setCompanySearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Pre-fill company search label from existing assignment
    useEffect(() => {
        if (user.companyId) {
            const found = companies.find(c => c.id === user.companyId);
            if (found) setCompanySearch(found.name);
        }
    }, [user.companyId, companies]);

    // Close dropdown on outside click
    useEffect(() => {
        function onOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', onOutside);
        return () => document.removeEventListener('mousedown', onOutside);
    }, []);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(companySearch.toLowerCase())
    );

    const handleSelectCompany = (c: Company) => {
        setSelectedCompanyId(c.id);
        setCompanySearch(c.name);
        setShowDropdown(false);
    };

    const handleSubmit = async () => {
        if (!selectedCompanyId) {
            toast.error('Selecciona una empresa antes de continuar.');
            return;
        }

        setIsLoading(true);
        try {
            if (isGuest) {
                // Activation: store method handles Firestore update + CF call
                await updateUserActivation(
                    user.id,
                    selectedCompanyId,
                    selectedRole,
                    adminUser?.uid ?? ''
                );
                toast.success(
                    `Usuario activado correctamente. Se envió notificación a ${user.email}.`
                );
            } else {
                // Edit active user: Firestore only
                await updateDoc(doc(db, 'users', user.id), {
                    companyId: selectedCompanyId,
                    role: selectedRole,
                    updatedAt: serverTimestamp(),
                });
                toast.success('Usuario actualizado correctamente.');
            }
            onClose();
        } catch {
            toast.error('Error al actualizar el usuario. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-900">
                        {isGuest ? 'Activar usuario' : 'Editar usuario'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">
                        {isGuest
                            ? 'Asigna una empresa y rol para activar esta cuenta.'
                            : 'Modifica el acceso de este usuario.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* Read-only info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Nombre
                            </p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {displayName(user)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Correo
                            </p>
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>

                    {/* Searchable company dropdown */}
                    <div ref={dropdownRef} className="relative space-y-1.5">
                        <Label htmlFor="company-search" className="text-sm font-semibold text-slate-700">
                            Asignar empresa
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                id="company-search"
                                value={companySearch}
                                onChange={(e) => {
                                    setCompanySearch(e.target.value);
                                    setSelectedCompanyId('');
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Buscar empresa..."
                                className="pl-9 rounded-xl border-slate-200"
                                autoComplete="off"
                            />
                        </div>
                        {showDropdown && companySearch && (
                            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                {filteredCompanies.length > 0 ? (
                                    filteredCompanies.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => handleSelectCompany(c)}
                                            className={cn(
                                                'w-full text-left px-4 py-2.5 text-sm transition-colors',
                                                selectedCompanyId === c.id
                                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            )}
                                        >
                                            {c.name}
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-4 py-3 text-sm text-slate-400">
                                        No se encontraron empresas.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Role select */}
                    <div className="space-y-1.5">
                        <Label htmlFor="role-select" className="text-sm font-semibold text-slate-700">
                            Rol
                        </Label>
                        <div className="relative">
                            <select
                                id="role-select"
                                value={selectedRole}
                                onChange={(e) =>
                                    setSelectedRole(e.target.value as 'client' | 'spi-admin')
                                }
                                className="w-full h-10 pl-3 pr-9 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                            >
                                <option value="client">Cliente</option>
                                <option value="spi-admin">Administrador SPI</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedCompanyId}
                        className="w-full h-11 btn-primary"
                    >
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                        ) : isGuest ? (
                            'Guardar y notificar'
                        ) : (
                            'Guardar cambios'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

const UsersManagementPanel = () => {
    const { users, companies, subscribeToUsers, subscribeToCompanies } = useAdminStore();
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

    useEffect(() => {
        const unsubUsers = subscribeToUsers();
        const unsubCompanies = subscribeToCompanies();
        return () => {
            unsubUsers();
            unsubCompanies();
        };
    }, []);

    const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

    const filteredUsers = users.filter(u => {
        if (showPendingOnly && u.role !== 'guest') return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                displayName(u).toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const pendingCount = users.filter(u => u.role === 'guest').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5 ml-12">
                        {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
                        {pendingCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-yellow-700 font-semibold">
                                · <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
                                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de activación
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre o correo..."
                        className="pl-9 w-72 rounded-xl border-slate-200 bg-white h-9 text-sm"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setShowPendingOnly(!showPendingOnly)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all h-9',
                        showPendingOnly
                            ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                >
                    <span
                        className={cn(
                            'w-2 h-2 rounded-full transition-colors',
                            showPendingOnly ? 'bg-yellow-500' : 'bg-slate-300'
                        )}
                    />
                    Mostrar solo pendientes
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Correo
                                </th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Empresa asignada
                                </th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Fecha de registro
                                </th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-16 text-center text-slate-400 text-sm"
                                    >
                                        {showPendingOnly
                                            ? 'No hay usuarios pendientes de activación.'
                                            : 'No se encontraron usuarios.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="hover:bg-slate-50/60 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {displayName(u)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {roleLabel(u.role)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {u.companyId
                                                ? companyMap[u.companyId] ?? u.companyId
                                                : <span className="text-slate-300">—</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {formatDate(u.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge role={u.role} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedUser(u)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                                    u.role === 'guest'
                                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                )}
                                            >
                                                {u.role === 'guest' ? 'Activar usuario' : 'Editar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activate / Edit Modal */}
            {selectedUser && (
                <ActivateModal
                    user={selectedUser}
                    companies={companies}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
};

export default UsersManagementPanel;
