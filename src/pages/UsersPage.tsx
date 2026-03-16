import { useEffect, useState } from "react";
import useAdminStore from "../store/useAdminStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserPlus,
  KeyRound,
  ShieldOff,
  ShieldCheck,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AppUser } from "../store/types";

const ROLE_CONFIG: Record<AppUser['role'], { label: string; className: string }> = {
  'spi-admin': { label: 'SPI Admin', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'client':    { label: 'Cliente',   className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'guest':     { label: 'Invitado',  className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const DEFAULT_FORM = { email: '', password: '', displayName: '', role: 'client' as AppUser['role'], companyId: '' };

const UsersPage = () => {
  const {
    users, companies, loading,
    subscribeToUsers, subscribeToCompanies,
    createUserAccount, sendPasswordReset, toggleUserDisabled,
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubUsers = subscribeToUsers();
    const unsubCompanies = subscribeToCompanies();
    return () => { unsubUsers(); unsubCompanies(); };
  }, [subscribeToUsers, subscribeToCompanies]);

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.companyId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.role) return;
    setIsSubmitting(true);
    try {
      await createUserAccount(form);
      toast.success(`Usuario ${form.email} creado correctamente`);
      setCreateOpen(false);
      setForm(DEFAULT_FORM);
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (user: AppUser) => {
    setResettingId(user.id);
    try {
      await sendPasswordReset(user.email);
      toast.success(`Correo de restablecimiento enviado a ${user.email}`);
    } catch {
      toast.error('Error al enviar el correo');
    } finally {
      setResettingId(null);
    }
  };

  const handleToggleDisabled = async (user: AppUser) => {
    setTogglingId(user.id);
    try {
      await toggleUserDisabled(user.id, !user.disabled);
      toast.success(user.disabled ? 'Usuario activado' : 'Usuario desactivado');
    } catch {
      toast.error('Error al actualizar el usuario');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar por email, nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 bg-slate-900/50 border-slate-800 text-white rounded-2xl focus:ring-blue-500 font-bold"
            />
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-blue-500/20 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Crear Usuario
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
        <ScrollArea className="h-[65vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-800">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Usuario</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rol</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Empresa</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Estado</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((u) => {
                const roleConf = ROLE_CONFIG[u.role] ?? ROLE_CONFIG['guest'];
                return (
                  <tr key={u.id} className={cn("transition-colors", u.disabled ? "opacity-50" : "hover:bg-slate-800/20")}>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-white tracking-tight">{u.displayName || '—'}</span>
                        <span className="text-xs font-bold text-slate-500 mt-0.5">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest border", roleConf.className)}>
                        {roleConf.label}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-bold text-slate-400">{u.companyId || '—'}</span>
                    </td>
                    <td className="p-6 text-center">
                      {u.disabled ? (
                        <Badge className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border-rose-500/20">
                          Inactivo
                        </Badge>
                      ) : (
                        <Badge className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Activo
                        </Badge>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resettingId === u.id}
                          onClick={() => handlePasswordReset(u)}
                          title="Enviar correo de restablecimiento"
                          className="h-9 w-9 p-0 rounded-xl border-slate-700 bg-slate-800/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={togglingId === u.id}
                          onClick={() => handleToggleDisabled(u)}
                          title={u.disabled ? 'Activar usuario' : 'Desactivar usuario'}
                          className={cn(
                            "h-9 w-9 p-0 rounded-xl border-slate-700 bg-slate-800/50",
                            u.disabled
                              ? "text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30"
                              : "text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
                          )}
                        >
                          {u.disabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Users className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                      {search ? 'Sin resultados para tu búsqueda' : 'Sin usuarios registrados'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-[2rem] bg-[#0B1121] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Crear Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Se creará una cuenta en Firebase Auth y un perfil en Firestore.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email *</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="usuario@empresa.cl"
                className="bg-slate-800/50 border-slate-700 text-white rounded-xl font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre completo</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Juan Pérez"
                className="bg-slate-800/50 border-slate-700 text-white rounded-xl font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contraseña temporal *</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="bg-slate-800/50 border-slate-700 text-white rounded-xl font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rol *</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AppUser['role'] }))}
                  className="w-full h-10 px-3 bg-slate-800/50 border border-slate-700 text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="client">Cliente</option>
                  <option value="spi-admin">SPI Admin</option>
                  <option value="guest">Invitado</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Empresa</Label>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
                  className="w-full h-10 px-3 bg-slate-800/50 border border-slate-700 text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Ninguna</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setCreateOpen(false)}
                className="rounded-xl font-bold text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.email || !form.password}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-6 disabled:opacity-60"
              >
                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
