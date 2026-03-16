import { useEffect, useState } from 'react';
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
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { OTStatusBadge } from '@/components/OTStatusBadge';
import OTDetailsModal from '@/components/OTDetailsModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { OT, OTStage, Document } from '@/store/types';

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
  solicitud: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  pago_adelanto: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  gestion: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  pago_cierre: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  finalizado: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
};

// ─── Kanban card ──────────────────────────────────────────────────────────────

function KanbanCard({
  ot,
  pendingCount,
  onClick,
}: {
  ot: OT;
  pendingCount: number;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ot.id,
  });

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
        'bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 cursor-grab active:cursor-grabbing',
        'hover:border-blue-500/40 hover:bg-slate-800/90 transition-all duration-150 select-none',
        isDragging && 'opacity-40 ring-2 ring-blue-500/50',
      )}
    >
      <p className="font-black text-white text-sm leading-tight truncate mb-2">
        {ot.brandName || ot.title}
      </p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge className="bg-slate-700/80 text-slate-400 border-slate-600 text-[9px] font-bold px-2 py-0.5 max-w-[90px] truncate">
          {ot.companyId}
        </Badge>
        <OTStatusBadge stage={ot.stage} size="sm" />
      </div>
      {pendingCount > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
            <AlertCircle className="h-2.5 w-2.5" />
            {pendingCount} docs
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  ots,
  pendingDocs,
  onOTClick,
}: {
  stage: OTStage;
  ots: OT[];
  pendingDocs: Document[];
  onOTClick: (ot: OT) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageOTs = ots.filter((o) => o.stage === stage);

  return (
    <div className="flex flex-col min-w-[240px] w-[240px]">
      {/* Column header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 rounded-2xl border mb-3',
        STAGE_COLORS[stage],
      )}>
        <span className="text-[10px] font-black uppercase tracking-widest">
          {STAGE_LABELS[stage]}
        </span>
        <span className="text-[10px] font-black bg-white/10 rounded-lg px-2 py-0.5">
          {stageOTs.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] space-y-2.5 rounded-2xl p-2 transition-colors duration-150',
          isOver ? 'bg-blue-500/10 ring-2 ring-blue-500/30' : 'bg-transparent',
        )}
      >
        {stageOTs.map((ot) => (
          <KanbanCard
            key={ot.id}
            ot={ot}
            pendingCount={pendingDocs.filter((d) => d.otId === ot.id).length}
            onClick={() => onOTClick(ot)}
          />
        ))}
        {stageOTs.length === 0 && (
          <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-slate-700/40">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Vacío
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

  const [selectedOT, setSelectedOT] = useState<OT | null>(null);
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
    return () => { u1(); };
  }, [subscribeToAllOTs]);

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
      const u = new Date(o.updatedAt);
      const n = new Date();
      return u.getMonth() === n.getMonth() && u.getFullYear() === n.getFullYear();
    }).length,
    companies: new Set(
      ots.filter((o) => o.stage !== 'finalizado').map((o) => o.companyId),
    ).size,
  };

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
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Torre de Control SPI</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
          Visión Global de Operaciones
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active OTs */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              OTs Activas
            </span>
          </div>
          <p className="text-3xl font-black text-white">{stats.active}</p>
        </div>

        {/* Pending review — visually dominant when > 0 */}
        <div className={cn(
          'rounded-2xl p-5 border transition-colors',
          stats.pending > 0
            ? 'bg-red-50 border-red-100'
            : 'bg-white/5 border-white/10',
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              stats.pending > 0 ? 'bg-red-100' : 'bg-white/10',
            )}>
              <AlertCircle className={cn(
                'h-4 w-4',
                stats.pending > 0 ? 'text-red-500' : 'text-slate-400',
              )} />
            </div>
            <span className={cn(
              'text-[10px] font-black uppercase tracking-widest',
              stats.pending > 0 ? 'text-red-500' : 'text-slate-400',
            )}>
              Pendientes de Revisión
            </span>
          </div>
          <p className={cn(
            'font-black',
            stats.pending > 0 ? 'text-4xl text-red-600' : 'text-3xl text-white',
          )}>
            {stats.pending}
          </p>
          {stats.pending > 0 && (
            <p className="text-[10px] font-black uppercase text-red-400 tracking-widest mt-1">
              Requieren acción
            </p>
          )}
        </div>

        {/* Finalized this month */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Finalizadas este mes
            </span>
          </div>
          <p className="text-3xl font-black text-white">{stats.finalized}</p>
        </div>

        {/* Active companies */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Empresas activas
            </span>
          </div>
          <p className="text-3xl font-black text-white">{stats.companies}</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto">
          <TabsTrigger
            value="kanban"
            className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Kanban
          </TabsTrigger>
          <TabsTrigger
            value="lista"
            className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Lista
          </TabsTrigger>
          <TabsTrigger
            value="pendientes"
            className={cn(
              'rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest',
              'data-[state=active]:text-white',
              stats.pending > 0
                ? 'data-[state=active]:bg-red-600'
                : 'data-[state=active]:bg-blue-600',
            )}
          >
            Pendientes ({pendingDocs.length})
          </TabsTrigger>
        </TabsList>

        {/* ── KANBAN TAB ── */}
        <TabsContent value="kanban" className="mt-6 outline-none">
          {loading ? (
            <div className="flex gap-4 overflow-x-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[240px] w-[240px] flex flex-col gap-3">
                  <Skeleton className="h-12 w-full bg-slate-800/60 rounded-2xl" />
                  {Array.from({ length: 2 }).map((_, j) => (
                    <Skeleton key={j} className="h-24 w-full bg-slate-800/40 rounded-2xl" />
                  ))}
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
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por marca, OT o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-11 bg-slate-900/50 border-slate-800 text-white rounded-xl focus:ring-blue-500 font-medium"
              />
            </div>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="h-11 px-4 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las empresas</option>
              {uniqueCompanies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10 border-b border-slate-800">
                  <tr>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operación</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Empresa</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Etapa</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Último cambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map((ot) => (
                    <tr
                      key={ot.id}
                      onClick={() => setSelectedOT(ot)}
                      className="group hover:bg-blue-600/5 transition-colors cursor-pointer"
                    >
                      <td className="p-5">
                        <p className="font-black text-white group-hover:text-blue-400 transition-colors truncate max-w-[200px]">
                          {ot.brandName || ot.title}
                        </p>
                        <p className="text-[10px] font-bold text-slate-600 font-mono mt-0.5">
                          {ot.id.substring(0, 10)}
                        </p>
                      </td>
                      <td className="p-5">
                        <Badge className="bg-slate-800/50 text-slate-400 border-slate-700 font-bold text-[9px] px-2 py-0.5">
                          {ot.companyId}
                        </Badge>
                      </td>
                      <td className="p-5 text-center">
                        <OTStatusBadge stage={ot.stage} size="sm" />
                      </td>
                      <td className="p-5">
                        <span className="text-xs font-bold text-slate-500">
                          {ot.updatedAt
                            ? format(new Date(ot.updatedAt), 'd MMM, HH:mm', { locale: es })
                            : '—'}
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
            <div className="space-y-8">
              {Object.entries(grouped).map(([companyId, docs]) => (
                <div key={companyId}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                      {companyId}
                    </span>
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[9px] font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg">
                      {docs.length} doc{docs.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Document rows */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
                    {docs.map((d) => {
                      const relatedOT = ots.find((o) => o.id === d.otId);
                      const isRejecting = rejectingId === d.id;
                      const isLoading = actionLoading === d.id;

                      return (
                        <div
                          key={d.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                        >
                          {/* Doc info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-white text-sm">{d.name}</p>
                              {d.status === 'ocr_processed' && (
                                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[9px] font-black uppercase rounded-lg px-2">
                                  IA · {(((d as any).validationMetadata?.confidence ?? 0) * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5 truncate">
                              {relatedOT?.brandName || relatedOT?.title || d.otId}
                            </p>
                            <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                              {new Date(d.uploadedAt).toLocaleDateString('es-CL')}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {!isRejecting ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(d.id)}
                                  disabled={isLoading}
                                  className="h-8 px-4 rounded-lg border-emerald-600 text-emerald-500 hover:bg-emerald-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? '...' : 'Aprobar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setRejectingId(d.id); setRejectReason(''); }}
                                  disabled={isLoading}
                                  className="h-8 px-4 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 font-black text-[10px] uppercase tracking-widest"
                                >
                                  Rechazar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Input
                                  placeholder="Motivo del rechazo..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="h-8 text-xs w-48 bg-slate-800 border-slate-700 text-white rounded-lg"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectConfirm(d.id)}
                                  disabled={!rejectReason.trim() || isLoading}
                                  className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                                >
                                  {isLoading ? '...' : 'Confirmar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setRejectingId(null)}
                                  className="h-8 px-3 rounded-lg text-slate-400 hover:text-slate-200 font-black text-[10px] uppercase"
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
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
    </div>
  );
};

export default SPIAdminDashboard;
