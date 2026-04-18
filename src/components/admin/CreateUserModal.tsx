import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Search,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useAdminStore from '@/store/useAdminStore';
import type { AppUser, Company } from '@/store/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
}

const MIN_PASSWORD = 8;

const CreateUserModal = ({ open, onOpenChange, companies }: Props) => {
  const { createUserAccount } = useAdminStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AppUser['role']>('client');
  const [companyId, setCompanyId] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('client');
      setCompanyId('');
      setCompanySearch('');
      setShowCompanyDropdown(false);
      setShowPassword(false);
    }
  }, [open]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCompanyDropdown(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()),
  );

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD;
  const companyRequired = role === 'client';
  const companyValid = !companyRequired || !!companyId;
  const canSubmit = emailValid && passwordValid && companyValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createUserAccount({
        email: email.trim(),
        password,
        displayName: displayName.trim() || email.trim().split('@')[0],
        role,
        companyId: companyRequired ? companyId : '',
      });
      toast.success(`Usuario ${email.trim()} creado correctamente.`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white border-slate-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-blue-500" />
            </div>
            Crear usuario manualmente
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            La cuenta se crea en Firebase Auth + Firestore con contraseña inicial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="text-sm font-semibold text-slate-700">
              Correo electrónico <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              disabled={submitting}
              className="rounded-xl border-slate-200"
              autoComplete="off"
            />
            {email && !emailValid && (
              <p className="text-[11px] font-semibold text-rose-600">
                Email inválido.
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-sm font-semibold text-slate-700">
              Contraseña inicial <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
                disabled={submitting}
                className="rounded-xl border-slate-200 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && !passwordValid && (
              <p className="text-[11px] font-semibold text-rose-600">
                La contraseña debe tener al menos {MIN_PASSWORD} caracteres.
              </p>
            )}
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="new-name" className="text-sm font-semibold text-slate-700">
              Nombre para mostrar
            </Label>
            <Input
              id="new-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Opcional — se usa el email si lo dejás vacío"
              disabled={submitting}
              className="rounded-xl border-slate-200"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="new-role" className="text-sm font-semibold text-slate-700">
              Rol <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <select
                id="new-role"
                value={role}
                onChange={(e) => {
                  const next = e.target.value as AppUser['role'];
                  setRole(next);
                  if (next !== 'client') {
                    setCompanyId('');
                    setCompanySearch('');
                  }
                }}
                disabled={submitting}
                className="w-full h-10 pl-3 pr-9 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="client">Cliente</option>
                <option value="spi-admin">Administrador SPI</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Company — only when role === client */}
          {companyRequired && (
            <div ref={companyDropdownRef} className="relative space-y-1.5">
              <Label htmlFor="new-company" className="text-sm font-semibold text-slate-700">
                Empresa asignada <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="new-company"
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setCompanyId('');
                    setShowCompanyDropdown(true);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  placeholder="Buscar empresa..."
                  disabled={submitting}
                  className="pl-9 rounded-xl border-slate-200"
                  autoComplete="off"
                />
              </div>
              {showCompanyDropdown && companySearch && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCompanyId(c.id);
                          setCompanySearch(c.name);
                          setShowCompanyDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm transition-colors',
                          companyId === c.id
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50',
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
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1 rounded-xl font-bold text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear usuario
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
