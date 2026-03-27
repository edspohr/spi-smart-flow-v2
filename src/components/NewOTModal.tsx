import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logAction } from '@/lib/logAction';
import useAdminStore from '@/store/useAdminStore';
import useProcedureTypeStore from '@/store/useProcedureTypeStore';
import useAuthStore from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Building2,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import type { Company } from '@/store/types';

interface NewOTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Searchable company dropdown ───────────────────────────────────────────────

function CompanyCombobox({
  companies,
  value,
  onChange,
}: {
  companies: Company[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery]     = useState('');
  const [isOpen, setIsOpen]   = useState(false);
  const containerRef           = useRef<HTMLDivElement>(null);
  const selected               = companies.find((c) => c.id === value);

  const filtered = query.trim()
    ? companies.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : companies;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (company: Company) => {
    onChange(company.id);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setIsOpen((o) => !o); setQuery(''); }}
        className={cn(
          'w-full flex items-center justify-between h-11 px-4 rounded-xl border text-sm transition-all',
          'bg-slate-900 border-slate-700 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30',
          selected ? 'text-white' : 'text-slate-500',
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
          {selected ? selected.name : 'Buscar empresa...'}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-500 shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar empresa..."
              className="flex-1 bg-transparent text-white text-xs font-medium focus:outline-none placeholder:text-slate-600"
            />
          </div>
          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                Sin resultados
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors',
                    c.id === value
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-300 hover:bg-slate-800',
                  )}
                >
                  {c.id === value && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                  <span className="text-xs font-bold truncate">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

const EMPTY = {
  companyId:       '',
  procedureTypeId: '',
  reference:       '',
  assigneeUid:     '',
  dueDate:         '',
  notes:           '',
};

const NewOTModal = ({ open, onOpenChange }: NewOTModalProps) => {
  const { companies, users, subscribeToCompanies, subscribeToAllUsers } = useAdminStore();
  const { procedureTypes, subscribeToAll: subscribeToProcedureTypes }   = useProcedureTypeStore();
  const { user: currentUser } = useAuthStore();

  const [form,   setForm]   = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Subscribe when open
  useEffect(() => {
    if (!open) return;
    const u1 = subscribeToCompanies();
    const u2 = subscribeToAllUsers();
    const u3 = subscribeToProcedureTypes();
    return () => { u1(); u2(); u3(); };
  }, [open, subscribeToCompanies, subscribeToAllUsers, subscribeToProcedureTypes]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setForm({ ...EMPTY });
      setErrors({});
    }
  }, [open]);

  const activeProcedureTypes = procedureTypes.filter((p) => p.isActive);
  const adminUsers            = users.filter((u) => u.role === 'spi-admin');
  const selectedCompany       = companies.find((c) => c.id === form.companyId);
  const selectedProcedureType = procedureTypes.find((p) => p.id === form.procedureTypeId);
  const selectedAssignee      = adminUsers.find((u) => u.id === form.assigneeUid);

  const setField = (k: keyof typeof EMPTY, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.companyId)       errs.companyId       = 'Selecciona una empresa para continuar.';
    if (!form.procedureTypeId) errs.procedureTypeId = 'Selecciona el tipo de trámite.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'ots'), {
        // Required
        companyId:         form.companyId,
        companyName:       selectedCompany!.name,
        procedureTypeId:   form.procedureTypeId,
        procedureTypeCode: selectedProcedureType!.code,
        procedureTypeName: selectedProcedureType!.name,
        // Optional fields
        reference:       form.reference.trim()    || null,
        assignedTo:      selectedAssignee?.id      || null,
        assignedToEmail: selectedAssignee?.email   || null,
        dueDate:         form.dueDate              || null,
        deadline:        form.dueDate              || null, // compat field
        internalNotes:   form.notes.trim()         || null,
        // Derived
        title:       `${selectedProcedureType!.name} — ${selectedCompany!.name}`,
        serviceType: selectedProcedureType!.name,
        area:        'PI' as const,
        amount:      0,
        clientId:    form.companyId,
        // Status
        stage:             'solicitud' as const,
        source:            'manual'    as const,
        createdManually:   true,
        createdBy:         currentUser?.uid || null,
        documents:         [],
        requirementsProgress: {},
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await logAction(
        currentUser?.uid || 'admin',
        docRef.id,
        `OT creada manualmente: ${selectedProcedureType!.name} — ${selectedCompany!.name}`,
      );

      toast.success('Orden de trabajo creada exitosamente.');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la OT. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-lg p-0 rounded-[2rem] bg-[#0B1121] border-slate-800 shadow-2xl shadow-black/60 gap-0">

        <DialogHeader className="px-7 pt-7 pb-4 border-b border-slate-800">
          <DialogTitle className="text-lg font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Plus className="h-5 w-5 text-blue-400" />
            </div>
            Nueva Orden de Trabajo
          </DialogTitle>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
            Creación manual · SPI Smart Flow
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-7 py-6 space-y-5">

            {/* ── Cliente / Empresa ── */}
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Cliente / Empresa <span className="text-rose-500">*</span>
              </Label>
              <CompanyCombobox
                companies={companies}
                value={form.companyId}
                onChange={(id) => setField('companyId', id)}
              />
              {errors.companyId && (
                <p className="text-[10px] font-bold text-rose-400 mt-1.5">{errors.companyId}</p>
              )}
            </div>

            {/* ── Tipo de actuación ── */}
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Tipo de Actuación <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <select
                  value={form.procedureTypeId}
                  onChange={(e) => setField('procedureTypeId', e.target.value)}
                  className={cn(
                    'w-full h-11 pl-4 pr-10 bg-slate-900 border text-sm rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white',
                    errors.procedureTypeId ? 'border-rose-500/60' : 'border-slate-700',
                  )}
                >
                  <option value="">Seleccionar tipo...</option>
                  {activeProcedureTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.code} — {pt.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.procedureTypeId && (
                <p className="text-[10px] font-bold text-rose-400 mt-1.5">{errors.procedureTypeId}</p>
              )}
              {selectedProcedureType && (
                <p className="text-[10px] font-bold text-blue-400/70 mt-1.5">
                  {selectedProcedureType.requirements?.length || 0} requisitos configurados
                </p>
              )}
            </div>

            {/* ── Número de referencia ── */}
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Número de Referencia
              </Label>
              <Input
                value={form.reference}
                onChange={(e) => setField('reference', e.target.value)}
                placeholder="Ej: EXP-2024-001"
                className="bg-slate-900 border-slate-700 text-white h-11 rounded-xl text-sm placeholder:text-slate-600"
              />
            </div>

            {/* ── Asignado a ── */}
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Asignado a
              </Label>
              <div className="relative">
                <select
                  value={form.assigneeUid}
                  onChange={(e) => setField('assigneeUid', e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-slate-900 border border-slate-700 text-white text-sm rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Sin asignar</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.displayName || u.email}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* ── Fecha límite ── */}
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Fecha Límite
              </Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setField('dueDate', e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-11 rounded-xl text-sm [color-scheme:dark]"
              />
            </div>

            {/* ── Notas internas ── */}
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Notas Internas
                <span className="ml-2 text-[9px] font-bold text-slate-600 normal-case tracking-normal">
                  Solo visible para SPI
                </span>
              </Label>
              <textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Contexto, instrucciones internas o referencias adicionales..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white text-sm rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-600"
              />
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="px-7 py-5 border-t border-slate-800 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => !saving && onOpenChange(false)}
            disabled={saving}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest h-10 px-5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 px-7 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-60"
          >
            {saving
              ? <><span className="animate-pulse">Creando...</span></>
              : <><Plus className="h-3.5 w-3.5" /> Crear OT</>}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default NewOTModal;
