import { useEffect, useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useOTStore from '../store/useOTStore';
import useDocumentStore from '../store/useDocumentStore';
import useProcedureTypeStore from '../store/useProcedureTypeStore';
import useAdminStore from '../store/useAdminStore';
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Search,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { OTStatusBadge } from '@/components/OTStatusBadge';
import OTDetailsModal from '@/components/OTDetailsModal';
import NewOTModal from '@/components/NewOTModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OT, OTStage, Document } from '@/store/types';

// ─── Date helper ──────────────────────────────────────────────────────────────
// Firestore puede devolver Timestamps (con .toDate()) o strings ISO.
// Esta función los normaliza de forma segura a un Date válido.
function toDate(raw: any): Date | null {
  if (!raw) return null;
  if (typeof raw.toDate === 'function') return raw.toDate();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: OTStage[] = [
  'solicitud',
  'pago_adelanto',
  'gestion',
  'pago_cierre',
  'finalizado',
];

const STAGE_LABELS: Record<OTStage, string> = {
  solicitud: 'Solicitud',
  pago_adelanto: 'Pago Inicial',
  gestion: 'En Gestión',
  pago_cierre: 'Pago Final',
  finalizado: 'Finalizado',
};

const STAGE_COLORS: Record<OTStage, string> = {
  solicitud: 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-900/5',
  pago_adelanto: 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-900/5',
  gestion: 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-900/5',
  pago_cierre: 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm shadow-purple-900/5',
  finalizado: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-900/5',
};

// ─── Kanban card ──────────────────────────────────────────────────────────────

function KanbanCard({
  ot,
  pendingCount,
  onClick,
  companyMap,
}: {
  ot: OT;
  pendingCount: number;
  onClick: () => void;
  companyMap: Record<string, string>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ot.id,
  });
  const { procedureTypes } = useProcedureTypeStore();

  // Progress computation
  const procedureType = procedureTypes.find((p) => p.id === ot.procedureTypeId);
  const totalReqs     = procedureType?.requirements?.length ?? 0;
  const completedReqs = totalReqs > 0
    ? Object.values(ot.requirementsProgress ?? {}).filter(
        (p: any) => p?.completed || p?.signedAt || p?.documentUrl,
      ).length
    : 0;

  // Assignee initials from email
  const assigneeInitials = ot.assignedToEmail
    ? ot.assignedToEmail.split('@')[0].slice(0, 2).toUpperCase()
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white border border-slate-200 rounded-[2rem] p-4 cursor-grab active:cursor-grabbing',
        'hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 select-none shadow-sm',
        isDragging && 'opacity-40 ring-4 ring-blue-500/20 scale-105 z-50',
      )}
    >
      <div className="flex flex-col gap-2.5">

        {/* Row 1 — procedure type chip + source badge */}
        <div className="flex items-center justify-between gap-2">
          {ot.procedureTypeCode ? (
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
              {ot.procedureTypeCode}
            </span>
          ) : <span />}
          {ot.source === 'pipefy' ? (
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-blue-600 text-white border border-blue-700">
              Pipefy
            </span>
          ) : ot.source === 'manual' ? (
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
              Manual
            </span>
          ) : null}
        </div>

        {/* Row 2 — company name (primary) */}
        <p className="font-black text-slate-900 text-[13px] leading-snug tracking-tight">
          {companyMap[ot.companyId] || ot.companyName || ot.brandName || ot.title}
        </p>

        {/* Row 3 — procedure type name (secondary) */}
        {ot.procedureTypeName && (
          <p className="text-[10px] font-bold text-slate-400 leading-snug -mt-1 truncate">
            {ot.procedureTypeName}
          </p>
        )}

        {/* Row 4 — reference number */}
        {ot.reference && (
          <p className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 inline-block self-start">
            {ot.reference}
          </p>
        )}

        {/* Row 5 — assignee + progress */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            {assigneeInitials ? (
              <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-black text-indigo-700">{assigneeInitials}</span>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-black text-slate-400">—</span>
              </div>
            )}
            {totalReqs > 0 && (
              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest',
                completedReqs === totalReqs ? 'text-emerald-600' : 'text-slate-400',
              )}>
                {completedReqs}/{totalReqs} req.
              </span>
            )}
          </div>
          <OTStatusBadge stage={ot.stage} size="sm" />
        </div>

        {/* Row 6 — pending alert */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm shadow-rose-900/5 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              {pendingCount} Pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  ots,
  pendingDocs,
  companyMap,
  onOTClick,
}: {
  stage: OTStage;
  ots: OT[];
  pendingDocs: Document[];
  companyMap: Record<string, string>;
  onOTClick: (ot: OT) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageOTs = ots.filter((o) => o.stage === stage);

  return (
    <div className="flex flex-col min-w-[240px] w-[240px]">
      {/* Column header */}
      <div className={cn(
        'flex items-center justify-between px-5 py-3 rounded-[1.5rem] border mb-6 shadow-sm',
        STAGE_COLORS[stage],
      )}>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {STAGE_LABELS[stage]}
        </span>
        <span className="text-[10px] font-black bg-white/60 backdrop-blur-sm rounded-xl px-3 py-1 min-w-[28px] text-center border border-white/40 shadow-sm">
          {stageOTs.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[400px] space-y-2.5 rounded-2xl p-2 transition-colors duration-150',
          isOver ? 'bg-blue-500/10 ring-2 ring-blue-500/30' : 'bg-transparent',
        )}
      >
        {stageOTs.map((ot) => (
          <KanbanCard
            key={ot.id}
            ot={ot}
            pendingCount={pendingDocs.filter((d) => d.otId === ot.id).length}
            onClick={() => onOTClick(ot)}
            companyMap={companyMap}
          />
        ))}
        {stageOTs.length === 0 && (
          <div className={cn(
            "flex items-center justify-center h-20 rounded-2xl border-2 border-dashed transition-all duration-200",
            isOver
              ? "border-blue-400 bg-blue-50/80 scale-[0.98]"
              : "border-slate-700 bg-slate-900/20"
          )}>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isOver ? "text-blue-400" : "text-slate-600"
            )}>
              {isOver ? "Soltar aquí" : "Vacío"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

const SPIAdminDashboard = () => {
  const { ots, loading, subscribeToAllOTs, updateOTStage } = useOTStore();
  const { updateDocumentStatus } = useDocumentStore();
  const { subscribeToAll: subscribeToProcedureTypes } = useProcedureTypeStore();
  const { companies, subscribeToCompanies } = useAdminStore();

  const [selectedOT, setSelectedOT] = useState<OT | null>(null);
  const [showNewOTModal, setShowNewOTModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');

  // Inline approve/reject state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Direct Firestore subscription for pending docs
  const [pendingDocs, setPendingDocs] = useState<Document[]>([]);
  useEffect(() => {
    const q = query(
      collection(db, 'documents'),
      where('status', 'in', ['uploaded', 'ocr_processed']),
    );
    return onSnapshot(q, (snap) => {
      setPendingDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document)));
    });
  }, []);

  useEffect(() => {
    const u1 = subscribeToAllOTs();
    const u2 = subscribeToProcedureTypes();
    const u3 = subscribeToCompanies();
    return () => { u1(); u2(); u3(); };
  }, [subscribeToAllOTs, subscribeToProcedureTypes, subscribeToCompanies]);

  // ── DnD ────────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const otId = active.id as string;
    const newStage = over.id as OTStage;
    const ot = ots.find((o) => o.id === otId);
    if (!ot || ot.stage === newStage) return;
    await updateOTStage(otId, newStage);
    toast.success(`OT movida a ${STAGE_LABELS[newStage]}`);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    active: ots.filter((o) => o.stage !== 'finalizado').length,
    pending: pendingDocs.length,
    finalized: ots.filter((o) => {
      if (o.stage !== 'finalizado' || !o.updatedAt) return false;
      const u = toDate(o.updatedAt);
      if (!u) return false;
      const n = new Date();
      return u.getMonth() === n.getMonth() && u.getFullYear() === n.getFullYear();
    }).length,
    companies: new Set(
      ots.filter((o) => o.stage !== 'finalizado').map((o) => o.companyId),
    ).size,
  };

  // ── Company name map ───────────────────────────────────────────────────────

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map(c => [c.id, c.name])),
    [companies],
  );

  // ── Lista filters ──────────────────────────────────────────────────────────

  const uniqueCompanies = Array.from(new Set(ots.map((o) => o.companyId))).filter(Boolean);

  const filtered = ots.filter((ot) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      ot.title?.toLowerCase().includes(term) ||
      ot.companyId?.toLowerCase().includes(term) ||
      ot.id.toLowerCase().includes(term);
    const matchCompany =
      filterCompany === 'all' || ot.companyId === filterCompany;
    return matchSearch && matchCompany;
  });

  // ── Pendientes grouped ─────────────────────────────────────────────────────

  const grouped = pendingDocs.reduce(
    (acc, d) => {
      const k = (d as any).companyId || 'Sin empresa';
      if (!acc[k]) acc[k] = [];
      acc[k].push(d);
      return acc;
    },
    {} as Record<string, Document[]>,
  );

  // ── Default tab ────────────────────────────────────────────────────────────

  const defaultTab = pendingDocs.length > 0 ? 'pendientes' : 'kanban';

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleApprove = async (docId: string) => {
    setActionLoading(docId);
    try {
      await updateDocumentStatus(docId, 'validated');
      toast.success('Documento aprobado');
    } catch {
      toast.error('Error al aprobar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (docId: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(docId);
    try {
      await updateDocumentStatus(docId, 'rejected', rejectReason);
      setRejectingId(null);
      setRejectReason('');
      toast.error('Documento rechazado');
    } catch {
      toast.error('Error al rechazar');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Torre de Control SPI</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-1.5 flex items-center gap-2">
            <span className="w-8 h-[2px] bg-blue-600 rounded-full" />
            Visión Global de Operaciones
          </p>
        </div>
        <Button
          onClick={() => setShowNewOTModal(true)}
          className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-blue-900/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Active OTs */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-[1.25rem] bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  OTs Activas
                </span>
              </div>
              <p className="text-5xl font-black text-slate-900 tracking-tight leading-none">{stats.active}</p>
              <div className="h-1 w-12 bg-blue-100 rounded-full mt-6 group-hover:w-full transition-all duration-700" />
            </div>

            {/* Pending review */}
            <div className={cn(
              'rounded-[2.5rem] p-8 border transition-all duration-500 shadow-xl group',
              stats.pending > 0
                ? 'bg-rose-50 border-rose-100 shadow-rose-200/40 hover:shadow-rose-300/40 ring-4 ring-rose-500/5'
                : 'bg-white border-slate-200 shadow-slate-200/40 hover:shadow-slate-300/40',
            )}>
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  'w-12 h-12 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500',
                  stats.pending > 0 ? 'bg-rose-100 animate-pulse' : 'bg-slate-50',
                )}>
                  <AlertCircle className={cn(
                    'h-6 w-6',
                    stats.pending > 0 ? 'text-rose-600' : 'text-slate-400',
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-black uppercase tracking-[0.3em]',
                  stats.pending > 0 ? 'text-rose-600' : 'text-slate-500',
                )}>
                  Pendientes
                </span>
              </div>
              <p className={cn(
                'text-5xl font-black tracking-tight leading-none',
                stats.pending > 0 ? 'text-rose-700' : 'text-slate-900',
              )}>
                {stats.pending}
              </p>
              <div className={cn(
                "h-1 w-12 rounded-full mt-6 group-hover:w-full transition-all duration-700",
                stats.pending > 0 ? "bg-rose-200" : "bg-slate-100"
              )} />
            </div>

            {/* Finalized */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-teal-900/5 transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Finalizadas
                </span>
              </div>
              <p className="text-5xl font-black text-slate-900 tracking-tight leading-none">{stats.finalized}</p>
              <div className="h-1 w-12 bg-emerald-100 rounded-full mt-6 group-hover:w-full transition-all duration-700" />
            </div>

            {/* Companies */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Empresas
                </span>
              </div>
              <p className="text-5xl font-black text-slate-900 tracking-tight leading-none">{stats.companies}</p>
              <div className="h-1 w-12 bg-indigo-100 rounded-full mt-6 group-hover:w-full transition-all duration-700" />
            </div>
          </>
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-[2rem] border border-slate-200 w-full sm:w-auto shadow-xl shadow-slate-200/40 h-auto gap-1">
          <TabsTrigger
            value="kanban"
            className="rounded-[1.25rem] px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl shadow-slate-900/10 transition-all duration-300"
          >
            Tablero Kanban
          </TabsTrigger>
          <TabsTrigger
            value="lista"
            className="rounded-[1.25rem] px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl shadow-slate-900/10 transition-all duration-300"
          >
            Vista Lista
          </TabsTrigger>
          <TabsTrigger
            value="pendientes"
            className={cn(
              'rounded-[1.25rem] px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300',
              stats.pending > 0
                ? 'data-[state=active]:bg-rose-600 data-[state=active]:text-white text-rose-600'
                : 'data-[state=active]:bg-slate-900 data-[state=active]:text-white'
            )}
          >
            Pendientes ({pendingDocs.length})
          </TabsTrigger>
        </TabsList>

        {/* ── KANBAN TAB ── */}
        <TabsContent value="kanban" className="mt-6 outline-none">
          {loading ? (
            <div className="flex gap-4 overflow-x-hidden pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[240px] w-[240px] flex flex-col gap-4">
                  <Skeleton className="h-12 w-full bg-slate-200 rounded-[1.5rem]" />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    ots={ots}
                    pendingDocs={pendingDocs}
                    companyMap={companyMap}
                    onOTClick={(ot) => setSelectedOT(ot)}
                  />
                ))}
              </div>
            </DndContext>
          )}
        </TabsContent>

        {/* ── LISTA TAB ── */}
        <TabsContent value="lista" className="mt-6 outline-none">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder="Buscar por marca, OT o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 bg-white border-slate-200 text-slate-900 rounded-[1.5rem] focus:ring-4 focus:ring-blue-50 font-bold shadow-sm transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="relative min-w-[240px]">
                <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="w-full h-14 pl-6 pr-12 bg-white border border-slate-200 text-slate-900 rounded-[1.5rem] text-xs font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer"
                >
                    <option value="all">Todas las empresas</option>
                    {uniqueCompanies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-400" />
                </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            <ScrollArea className="h-[60vh]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operación</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Empresa</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Etapa</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Último cambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((ot) => (
                    <tr
                      key={ot.id}
                      onClick={() => setSelectedOT(ot)}
                      className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                    >
                      <td className="p-6">
                        <div className="flex flex-col">
                            <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-xs tracking-tight">
                                {ot.brandName || ot.title}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">
                                ID: {ot.id.substring(0, 8).toUpperCase()}
                            </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-black text-[9px] px-3 py-1 rounded-xl shadow-none uppercase tracking-widest">
                          {ot.companyId}
                        </Badge>
                      </td>
                      <td className="p-6 text-center">
                        <OTStatusBadge stage={ot.stage} />
                      </td>
                      <td className="p-6">
                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                            {(() => { const d = toDate(ot.updatedAt); return d ? format(d, 'd MMM, HH:mm', { locale: es }) : '—'; })()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-500 text-sm font-bold">
                        Sin resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* ── PENDIENTES TAB ── */}
        <TabsContent value="pendientes" className="mt-6 outline-none">
          {pendingDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <CheckCircle2 className="h-16 w-16 text-emerald-500/60" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                No hay documentos pendientes de revisión
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(grouped).map(([companyId, docs]) => (
                <div key={companyId} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Group header */}
                  <div className="flex items-center gap-4 mb-6 ml-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/40" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
                      {companyMap[companyId] || companyId}
                    </span>
                    <div className="flex-1 h-[1px] bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm uppercase tracking-widest">
                      {docs.length} Documento{docs.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Document cards */}
                  <div className="grid gap-4">
                    {docs.map((d) => {
                      const relatedOT = ots.find((o) => o.id === d.otId);
                      const isRejecting = rejectingId === d.id;
                      const isLoading = actionLoading === d.id;

                      return (
                        <div
                          key={d.id}
                          className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 group"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            {/* Doc info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <h4 className="font-black text-slate-900 text-base uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                        {d.name}
                                    </h4>
                                    {d.status === 'ocr_processed' && (
                                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-1 shadow-none">
                                            IA VALIDADO · {(((d as any).validationMetadata?.confidence ?? 0) * 100).toFixed(0)}%
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                                        {relatedOT?.brandName || relatedOT?.title || 'Sin OT'}
                                    </Badge>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {(() => { const d2 = toDate(d.uploadedAt); return d2 ? `Cargado el ${d2.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}` : ''; })()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 shrink-0">
                              {!isRejecting ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(d.id)}
                                    disabled={isLoading}
                                    className="h-11 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 transition-all disabled:opacity-50"
                                  >
                                    {isLoading ? 'Procesando...' : 'Aprobar'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setRejectingId(d.id); setRejectReason(''); }}
                                    disabled={isLoading}
                                    className="h-11 px-6 rounded-2xl text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-[0.1em]"
                                  >
                                    Rechazar
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                  <Input
                                    placeholder="Motivo del rechazo..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="h-11 text-xs w-64 bg-slate-50 border-slate-200 text-slate-900 rounded-2xl focus:ring-4 focus:ring-rose-50 font-bold"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleRejectConfirm(d.id)}
                                    disabled={!rejectReason.trim() || isLoading}
                                    className="h-11 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-[0.1em] shadow-xl shadow-rose-900/10 transition-all"
                                  >
                                    {isLoading ? 'Procesando...' : 'Confirmar'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRejectingId(null)}
                                    className="h-11 px-4 rounded-2xl text-slate-500 hover:bg-slate-100 font-black text-[10px] uppercase"
                                  >
                                    X
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* OT Details Modal */}
      {selectedOT && (
        <OTDetailsModal
          ot={selectedOT}
          open={!!selectedOT}
          onOpenChange={(o) => !o && setSelectedOT(null)}
        />
      )}

      {/* New OT Modal */}
      <NewOTModal open={showNewOTModal} onOpenChange={setShowNewOTModal} />
    </div>
  );
};

export default SPIAdminDashboard;
