import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useProcedureTypeStore from '@/store/useProcedureTypeStore';
import type { Requirement, RequirementType } from '@/store/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GripVertical,
  Plus,
  Trash2,
  FileText,
  PenLine,
  CheckSquare,
  Type,
  Fingerprint,
  Save,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_LABELS: Record<RequirementType, string> = {
  document_upload: 'Documento',
  digital_signature: 'Firma Digital',
  form_field: 'Campo de Texto',
  checkbox_confirmation: 'Confirmación',
};

const TYPE_ICONS: Record<RequirementType, React.ReactNode> = {
  document_upload: <FileText className="h-3 w-3" />,
  digital_signature: <Fingerprint className="h-3 w-3" />,
  form_field: <Type className="h-3 w-3" />,
  checkbox_confirmation: <CheckSquare className="h-3 w-3" />,
};

const TYPE_COLORS: Record<RequirementType, string> = {
  document_upload: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  digital_signature: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  form_field: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  checkbox_confirmation: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

// ── Sortable requirement row ────────────────────────────────────────────────

function SortableReqRow({
  req,
  onDelete,
}: {
  req: Requirement;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: req.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-2xl border transition-all',
        isDragging
          ? 'bg-blue-500/10 border-blue-500/40 shadow-xl opacity-90 z-50'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-[10px] font-black text-slate-600 w-5 shrink-0">{req.order}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-200 leading-snug truncate">{req.label}</p>
        {req.description && (
          <p className="text-[10px] text-slate-500 truncate mt-0.5">{req.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider',
          TYPE_COLORS[req.type],
        )}>
          {TYPE_ICONS[req.type]}
          {TYPE_LABELS[req.type]}
        </span>
        {req.isRequired && (
          <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider">Req.</span>
        )}
        <button
          onClick={() => onDelete(req.id)}
          className="text-slate-600 hover:text-rose-400 transition-colors ml-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Blank requirement form ──────────────────────────────────────────────────

const BLANK: Omit<Requirement, 'id' | 'order'> = {
  label: '',
  type: 'document_upload',
  isRequired: true,
  description: '',
  acceptedFormats: [],
  fieldKey: '',
  placeholder: '',
};

function AddReqForm({
  onAdd,
  onCancel,
}: {
  onAdd: (r: Omit<Requirement, 'id' | 'order'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...BLANK });

  const set = (k: keyof typeof BLANK, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nuevo Requisito</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Etiqueta *</Label>
          <Input
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="Ej: Poder firmado por Representante Legal"
            className="bg-slate-900 border-slate-700 text-white text-xs h-9 rounded-xl"
            autoFocus
          />
        </div>

        <div>
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipo *</Label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as RequirementType)}
            className="w-full h-9 px-3 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {(Object.keys(TYPE_LABELS) as RequirementType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-3 pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={form.isRequired}
              onCheckedChange={(v) => set('isRequired', v)}
            />
            <span className="text-xs font-bold text-slate-300">Obligatorio</span>
          </label>
        </div>

        <div className="col-span-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Descripción (opcional)</Label>
          <Input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Instrucción adicional para el cliente"
            className="bg-slate-900 border-slate-700 text-white text-xs h-9 rounded-xl"
          />
        </div>

        {form.type === 'form_field' && (
          <>
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Field Key *</Label>
              <Input
                value={form.fieldKey}
                onChange={(e) => set('fieldKey', e.target.value)}
                placeholder="Ej: denominacion"
                className="bg-slate-900 border-slate-700 text-white text-xs h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Placeholder</Label>
              <Input
                value={form.placeholder}
                onChange={(e) => set('placeholder', e.target.value)}
                placeholder="Ej: Ej: NOVA TECH"
                className="bg-slate-900 border-slate-700 text-white text-xs h-9 rounded-xl"
              />
            </div>
          </>
        )}

        {form.type === 'document_upload' && (
          <div className="col-span-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Formatos aceptados</Label>
            <div className="flex gap-3">
              {(['PDF', 'JPG', 'PNG'] as const).map((fmt) => (
                <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.acceptedFormats || []).includes(fmt)}
                    onChange={(e) => {
                      const curr = form.acceptedFormats || [];
                      set('acceptedFormats', e.target.checked
                        ? [...curr, fmt]
                        : curr.filter((f) => f !== fmt));
                    }}
                    className="accent-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-300">{fmt}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => {
            if (!form.label.trim()) return;
            onAdd(form);
          }}
          disabled={!form.label.trim()}
          className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider"
        >
          Agregar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 text-[10px] font-black uppercase tracking-wider"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

const ConfiguracionSolicitudesPage = () => {
  const { procedureTypes, loading, subscribeToAll, updateType, toggleActive } =
    useProcedureTypeStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localReqs, setLocalReqs] = useState<Requirement[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAll();
    return unsub;
  }, [subscribeToAll]);

  const selected = procedureTypes.find((p) => p.id === selectedId) ?? null;

  // Sync localReqs when selection changes
  useEffect(() => {
    if (selected) {
      setLocalReqs([...(selected.requirements || [])].sort((a, b) => a.order - b.order));
      setShowAddForm(false);
    }
  }, [selectedId, selected?.id]);

  // ── DnD ──────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = localReqs.findIndex((r) => r.id === active.id);
    const newIdx = localReqs.findIndex((r) => r.id === over.id);
    const reordered = arrayMove(localReqs, oldIdx, newIdx).map((r, i) => ({
      ...r,
      order: i + 1,
    }));
    setLocalReqs(reordered);
  };

  // ── Add requirement ───────────────────────────────────────────────────────

  const handleAddReq = (data: Omit<Requirement, 'id' | 'order'>) => {
    const id = `${selected!.code.toLowerCase()}-${Date.now()}`;
    const order = localReqs.length + 1;
    setLocalReqs((prev) => [...prev, { ...data, id, order } as Requirement]);
    setShowAddForm(false);
  };

  // ── Delete requirement ────────────────────────────────────────────────────

  const handleDeleteReq = (id: string) => {
    setLocalReqs((prev) =>
      prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, order: i + 1 })),
    );
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateType(selected.id, { requirements: localReqs });
      toast.success('Requisitos guardados');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Tipos de Actuación</h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-1.5 flex items-center gap-2">
          <span className="w-8 h-[2px] bg-blue-600 rounded-full" />
          Configuración de Requisitos por Trámite
        </p>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6 items-start">
        {/* ── LEFT: type list ─────────────────────────────────────────────── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {loading ? 'Cargando...' : `${procedureTypes.length} tipos`}
            </p>
          </div>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-2 space-y-1">
              {procedureTypes.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setSelectedId(pt.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left',
                    selectedId === pt.id
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'hover:bg-slate-800/60 border border-transparent',
                  )}
                >
                  <span className={cn(
                    'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shrink-0',
                    selectedId === pt.id
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700',
                  )}>
                    {pt.code}
                  </span>
                  <span className={cn(
                    'text-xs font-bold truncate flex-1',
                    selectedId === pt.id ? 'text-white' : 'text-slate-300',
                  )}>
                    {pt.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {!pt.isActive && (
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Inactivo</span>
                    )}
                    <ChevronRight className={cn(
                      'h-3.5 w-3.5 transition-transform',
                      selectedId === pt.id ? 'text-blue-400' : 'text-slate-600',
                    )} />
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── RIGHT: editor ───────────────────────────────────────────────── */}
        {selected ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] overflow-hidden">
            {/* Editor header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-xl">
                  {selected.code}
                </span>
                <div>
                  <p className="text-sm font-black text-white">{selected.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{localReqs.length} requisitos configurados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selected.isActive}
                    onCheckedChange={(v) => toggleActive(selected.id, v)}
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {selected.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider gap-2"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>

            {/* Requirements list */}
            <div className="p-5 space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localReqs.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {localReqs.map((req) => (
                      <SortableReqRow
                        key={req.id}
                        req={req}
                        onDelete={handleDeleteReq}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {localReqs.length === 0 && !showAddForm && (
                <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-2xl">
                  <PenLine className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Sin requisitos configurados
                  </p>
                </div>
              )}

              {showAddForm ? (
                <AddReqForm onAdd={handleAddReq} onCancel={() => setShowAddForm(false)} />
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowAddForm(true)}
                  className="w-full h-10 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Requisito
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] bg-slate-900/30 border border-dashed border-slate-800 rounded-[2rem]">
            <FileText className="h-12 w-12 text-slate-700 mb-4" />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">
              Selecciona un tipo de actuación
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionSolicitudesPage;
