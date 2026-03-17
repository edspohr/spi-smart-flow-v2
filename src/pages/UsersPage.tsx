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
  'spi-admin': { label: 'SPI Admin', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  'client':    { label: 'Cliente',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'guest':     { label: 'Invitado',  className: 'bg-slate-50 text-slate-600 border-slate-200' },
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
    <div className="space-y-8 animate-fade-in pb-12 p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por email, nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 bg-white border-slate-200 text-slate-900 rounded-2xl focus:ring-4 focus:ring-blue-50 transition-all font-bold placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-slate-900/10 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Crear Usuario
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40">
        <ScrollArea className="h-[65vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Usuario</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rol</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Empresa</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Estado</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const roleConf = ROLE_CONFIG[u.role] ?? ROLE_CONFIG['guest'];
                return (
                  <tr key={u.id} className={cn("transition-colors group", u.disabled ? "bg-slate-50/50" : "hover:bg-slate-50/80")}>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors uppercase text-xs">{u.displayName || '—'}</span>
                        <span className="text-xs font-bold text-slate-500 mt-1">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm", roleConf.className)}>
                        {roleConf.label}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{u.companyId || '—'}</span>
                    </td>
                    <td className="p-6 text-center">
                      {u.disabled ? (
                        <Badge className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border-rose-200">
                          Inactivo
                        </Badge>
                      ) : (
                        <Badge className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200">
                          Activo
                        </Badge>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={resettingId === u.id}
                          onClick={() => handlePasswordReset(u)}
                          title="Enviar correo de restablecimiento"
                          className="h-10 w-10 p-0 rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 shadow-sm transition-all"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={togglingId === u.id}
                          onClick={() => handleToggleDisabled(u)}
                          title={u.disabled ? 'Activar usuario' : 'Desactivar usuario'}
                          className={cn(
                            "h-10 w-10 p-0 rounded-2xl border border-slate-100 bg-white shadow-sm transition-all",
                            u.disabled
                              ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
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
                  <td colSpan={5} className="py-32 text-center bg-white">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <Users className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-xs">
                      {search ? 'Sin resultados para tu búsqueda' : 'Sin usuarios registrados'}
                    </p>
                    <p className="text-slate-400 font-bold text-[11px] mt-2">
                      Intenta con otro término o crea un nuevo usuario.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      <      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-white border-slate-200 text-slate-900 p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-50 p-8 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">Crear Usuario</DialogTitle>
              <DialogDescription className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
                Nueva cuenta y perfil de acceso
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={handleCreate} className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Principal *</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="usuario@empresa.cl"
                className="h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre Completo</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                className="h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contraseña Temporal *</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl font-bold focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Rol Operativo *</Label>
                <div className="relative">
                    <select
                        value={form.role}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AppUser['role'] }))}
                        className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer"
                    >
                        <option value="client">Cliente</option>
                        <option value="spi-admin">SPI Admin</option>
                        <option value="guest">Invitado</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Users className="h-3 w-3 text-slate-400" />
                    </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Empresa</Label>
                <div className="relative">
                    <select
                        value={form.companyId}
                        onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
                        className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer"
                    >
                        <option value="">Ninguna</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Users className="h-3 w-3 text-slate-400" />
                    </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-4 gap-3 bg-slate-50 -mx-8 -mb-8 p-8 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setCreateOpen(false)}
                className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.email || !form.password}
                className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl px-8 disabled:opacity-50 shadow-xl shadow-slate-900/10 transition-all uppercase text-[10px] tracking-widest"
              >
                {isSubmitting ? 'Procesando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
```
