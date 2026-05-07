import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { AlertTriangle, FlaskConical, Plus, Save } from 'lucide-react';

const COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Brasil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
];

import useAuthStore from '@/store/useAuthStore';
import useAdminStore from '@/store/useAdminStore';
import useProcedureTypeStore from '@/store/useProcedureTypeStore';
import { db } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ManualOTPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { companies, users, subscribeToCompanies, subscribeToUsers } = useAdminStore();
  const { procedureTypes, subscribeToAll: subscribeToProcedureTypes } = useProcedureTypeStore();

  // ── Subscriptions ──────────────────────────────────────────────────────────
  useEffect(() => {
    const u1 = subscribeToCompanies();
    const u2 = subscribeToUsers();
    const u3 = subscribeToProcedureTypes();
    return () => { u1(); u2(); u3(); };
  }, [subscribeToCompanies, subscribeToUsers]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [pipefyCardId, setPipefyCardId] = useState('');

  // Company: either select an existing one or create a new one inline.
  const [companySearch, setCompanySearch] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    clientEmail: '',
    clientName: '',
    clientPhone: '',
  });
  const isCreatingNewCompany = !companyId && !!newCompanyData.name;

  // Encargado SPI
  const [assignedToId, setAssignedToId] = useState('');

  // Encargado Cliente
  const [clientContactId, setClientContactId] = useState('');

  // Activity details
  const [area, setArea] = useState<'PI' | 'AR'>('PI');
  const [procedureTypeId, setProcedureTypeId] = useState('');
  const [marcaAsunto, setMarcaAsunto] = useState('');
  const [country, setCountry] = useState<string>('Colombia');
  const [amount, setAmount] = useState('');
  const [fees, setFees] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Contado');
  const [deadline, setDeadline] = useState('');

  // Submission
  const [saving, setSaving] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    const term = companySearch.trim().toLowerCase();
    if (!term) return companies.slice(0, 8);
    return companies.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 8);
  }, [companies, companySearch]);

  const exactMatch = useMemo(
    () => companies.find((c) => c.name.toLowerCase() === companySearch.trim().toLowerCase()),
    [companies, companySearch],
  );

  const spiUsers = useMemo(
    () => users.filter((u) => u.role === 'spi-admin' || (u.role as string) === 'spi-staff'),
    [users],
  );

  const selectedAssignee = useMemo(
    () => spiUsers.find((u) => u.id === assignedToId),
    [spiUsers, assignedToId],
  );

  const clientUsers = useMemo(
    () => companyId
      ? users.filter((u) => u.companyId === companyId && u.role === 'client')
      : [],
    [users, companyId],
  );

  const selectedClientContact = useMemo(
    () => clientUsers.find((u) => u.id === clientContactId),
    [clientUsers, clientContactId],
  );

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId],
  );

  const activeProcedureTypes = useMemo(
    () => procedureTypes.filter((p) => p.isActive),
    [procedureTypes],
  );

  const selectedProcedureType = useMemo(
    () => procedureTypes.find((p) => p.id === procedureTypeId),
    [procedureTypes, procedureTypeId],
  );

  const handleSelectCompany = (id: string, name: string) => {
    setCompanyId(id);
    setCompanySearch(name);
    setClientContactId('');
    setNewCompanyData({ name: '', clientEmail: '', clientName: '', clientPhone: '' });
  };

  const handleStartNewCompany = (name: string) => {
    setCompanyId(null);
    setNewCompanyData((prev) => ({ ...prev, name }));
  };

  const handleClearCompany = () => {
    setCompanyId(null);
    setCompanySearch('');
    setClientContactId('');
    setNewCompanyData({ name: '', clientEmail: '', clientName: '', clientPhone: '' });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const newCompanyValid =
    !!newCompanyData.name.trim() &&
    !!newCompanyData.clientEmail.trim() &&
    !!newCompanyData.clientName.trim();

  const canSubmit =
    !!procedureTypeId &&
    !!marcaAsunto.trim() &&
    (!!companyId || newCompanyValid) &&
    !saving;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setSaving(true);
    try {
      // Resolve or create company
      let resolvedCompanyId = companyId;
      if (!resolvedCompanyId && newCompanyData.name) {
        const companyRef = await addDoc(collection(db, 'companies'), {
          name: newCompanyData.name.trim(),
          pipefyTitularId: '',
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
          status: 'active',
        });
        resolvedCompanyId = companyRef.id;

        // Create client user document (no Auth — admin links manually later)
        if (newCompanyData.clientEmail) {
          const existingUser = await getDocs(
            query(
              collection(db, 'users'),
              where('email', '==', newCompanyData.clientEmail.trim()),
            ),
          );
          if (existingUser.empty) {
            await addDoc(collection(db, 'users'), {
              email:       newCompanyData.clientEmail.trim(),
              displayName: newCompanyData.clientName.trim() || newCompanyData.clientEmail.trim(),
              phone:       newCompanyData.clientPhone.trim() || '',
              companyId:   resolvedCompanyId,
              role:        'client',
              createdAt:   new Date().toISOString(),
              createdBy:   user.uid,
              authLinked:  false,
            });
          }
        }
      }

      // Resolve clientId for the OT
      let resolvedClientId = 'manual-guest';
      const userQuery = await getDocs(
        query(
          collection(db, 'users'),
          where('companyId', '==', resolvedCompanyId),
          where('role', '==', 'client'),
        ),
      );
      if (!userQuery.empty) resolvedClientId = userQuery.docs[0].id;

      const titularName = newCompanyData.name.trim() || selectedCompany?.name || '';
      const selectedAssigneeEmail = selectedAssignee?.email || '';

      // Create OT
      const otRef = await addDoc(collection(db, 'ots'), {
        pipefyCardId:        pipefyCardId.trim(),
        title:               selectedProcedureType
          ? `${selectedProcedureType.name} — ${marcaAsunto.trim()}`
          : marcaAsunto.trim(),
        brandName:           marcaAsunto.trim(),
        serviceType:         selectedProcedureType?.name || '',
        procedureTypeId:     procedureTypeId || null,
        procedureTypeCode:   selectedProcedureType?.code || null,
        procedureTypeName:   selectedProcedureType?.name || null,
        titularName,
        encargadoEmail:      selectedAssigneeEmail,
        assignedToId:        assignedToId || null,
        clientContactId:     clientContactId || null,
        clientContactName:   selectedClientContact
          ? (selectedClientContact.displayName || selectedClientContact.name || selectedClientContact.email)
          : null,
        area,
        country,
        amount:         parseFloat(amount) || 0,
        fees:           parseFloat(fees) || 0,
        paymentTerms,
        stage:          'solicitud',
        status:         'pending',
        createdAt:      new Date().toISOString(),
        updatedAt:      new Date().toISOString(),
        deadline:       deadline ? new Date(deadline).toISOString() : null,
        companyId:      resolvedCompanyId,
        clientId:       resolvedClientId,
        source:         'manual',
      });

      // Create default documents
      const batch = writeBatch(db);
      const defaultDocs = [
        { name: 'Poder Simple',     type: 'poder_legal', isVaultEligible: true  },
        { name: 'Logo de la Marca', type: 'logo',        isVaultEligible: false },
      ];
      defaultDocs.forEach((d) => {
        const ref = doc(collection(db, 'documents'));
        batch.set(ref, {
          otId:            otRef.id,
          clientId:        resolvedClientId,
          companyId:       resolvedCompanyId,
          name:            d.name,
          type:            d.type,
          status:          'pending',
          isVaultEligible: d.isVaultEligible,
          createdAt:       new Date().toISOString(),
        });
      });
      await batch.commit();

      // Audit log
      await addDoc(collection(db, 'logs'), {
        otId:      otRef.id,
        userId:    user.uid,
        userName:  user.displayName || user.email,
        action:    `OT creada manualmente (modo pruebas). Pipefy Card ID: ${pipefyCardId.trim()}`,
        type:      'system',
        timestamp: new Date().toISOString(),
      });

      toast.success(`OT creada exitosamente: ${otRef.id}`);
      navigate('/spi-admin');
    } catch (error: any) {
      console.error(error);
      toast.error(`Error al crear OT: ${error.message ?? 'desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pb-20">
      {/* Sticky test-mode banner */}
      <div className="sticky top-0 z-30 bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3 -mx-6 mb-8">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-900">
            Modo de pruebas — Creación manual de OT
          </p>
          <p className="text-xs text-amber-700">
            Esta pantalla es temporal. En producción las OTs se crean automáticamente desde Pipefy.
          </p>
        </div>
        <FlaskConical className="w-5 h-5 text-amber-700 shrink-0" />
      </div>

      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Crear OT Manual</h1>
          <p className="text-slate-400 font-medium mt-1">
            Captura los mismos campos que llegarían desde Pipefy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Identificación ── */}
          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">Identificación</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Asocia la OT con la tarjeta correspondiente en Pipefy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Número de OT (Pipefy Card ID) <span className="text-slate-300 font-medium normal-case">(opcional)</span>
              </Label>
              <Input
                value={pipefyCardId}
                onChange={(e) => setPipefyCardId(e.target.value)}
                placeholder="Ej: 508058339 — dejar vacío si no aplica"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
              />
              <p className="text-xs text-slate-400 font-medium">
                ID de la tarjeta en Pipefy. Opcional para OTs creadas directamente en la plataforma.
              </p>
            </CardContent>
          </Card>

          {/* ── Titular (Empresa cliente) ── */}
          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">
                Titular (Empresa cliente)
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Selecciona una empresa existente o crea una nueva.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Buscar empresa existente
              </Label>
              <div className="relative">
                <Input
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    if (companyId) setCompanyId(null);
                    if (newCompanyData.name) {
                      setNewCompanyData((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="Empezá a escribir el nombre de la empresa..."
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                />
                {companySearch && !companyId && (
                  <div className="mt-2 border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                    {filteredCompanies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCompany(c.id, c.name)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                      >
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        {c.taxId && (
                          <p className="text-xs text-slate-400 font-medium">{c.taxId}</p>
                        )}
                      </button>
                    ))}
                    {!exactMatch && companySearch.trim().length >= 2 && (
                      <button
                        type="button"
                        onClick={() => handleStartNewCompany(companySearch.trim())}
                        className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors border-t border-blue-100"
                      >
                        <p className="text-sm font-bold text-blue-700 flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Crear nueva empresa: "{companySearch.trim()}"
                        </p>
                      </button>
                    )}
                    {filteredCompanies.length === 0 && exactMatch && (
                      <p className="px-4 py-3 text-xs text-slate-400 font-medium">
                        Sin coincidencias.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {companyId && selectedCompany && (
                <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">
                      Empresa seleccionada
                    </p>
                    <p className="text-sm font-bold text-emerald-900">{selectedCompany.name}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCompany}
                    className="text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold uppercase"
                  >
                    Cambiar
                  </Button>
                </div>
              )}

              {isCreatingNewCompany && (
                <div className="space-y-4 p-4 bg-blue-50/40 border border-blue-100 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-blue-700 tracking-widest">
                      Nueva empresa: {newCompanyData.name}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCompany}
                      className="text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold uppercase"
                    >
                      Cancelar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Email contacto cliente <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      required={isCreatingNewCompany}
                      value={newCompanyData.clientEmail}
                      onChange={(e) =>
                        setNewCompanyData((prev) => ({ ...prev, clientEmail: e.target.value }))
                      }
                      placeholder="contacto@empresa.com"
                      className="h-11 rounded-xl border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Nombre completo del contacto <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      required={isCreatingNewCompany}
                      value={newCompanyData.clientName}
                      onChange={(e) =>
                        setNewCompanyData((prev) => ({ ...prev, clientName: e.target.value }))
                      }
                      placeholder="Ej: Juan Pérez"
                      className="h-11 rounded-xl border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Teléfono contacto
                    </Label>
                    <Input
                      value={newCompanyData.clientPhone}
                      onChange={(e) =>
                        setNewCompanyData((prev) => ({ ...prev, clientPhone: e.target.value }))
                      }
                      placeholder="+56 9 1234 5678"
                      className="h-11 rounded-xl border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Encargado SPI ── */}
          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">Encargado SPI</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Persona responsable internamente de gestionar la OT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Asignar a
              </Label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Sin asignar</option>
                {spiUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.displayName || u.name || u.email) + ' (' + u.email + ')'}
                  </option>
                ))}
              </select>
              {selectedAssignee && (
                <p className="text-xs text-slate-500 font-medium">
                  Email del encargado: <span className="font-bold text-slate-700">{selectedAssignee.email}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Encargado Cliente ── */}
          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">Encargado Cliente</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Contacto del cliente responsable de esta OT. Selecciona una empresa primero.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Asignar a
              </Label>
              <select
                value={clientContactId}
                onChange={(e) => setClientContactId(e.target.value)}
                disabled={!companyId}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{companyId ? 'Sin encargado' : 'Selecciona una empresa primero'}</option>
                {clientUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.displayName || u.name || u.email) + ' (' + u.email + ')'}
                  </option>
                ))}
              </select>
              {companyId && clientUsers.length === 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  No hay usuarios cliente registrados para esta empresa.
                </p>
              )}
              {selectedClientContact && (
                <p className="text-xs text-slate-500 font-medium">
                  Email: <span className="font-bold text-slate-700">{selectedClientContact.email}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Detalles de la actividad ── */}
          <Card className="bg-white border-slate-200 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">
                Detalles de la actividad
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Información del trámite que se gestionará en esta OT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Área del trámite
                </Label>
                <select
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value as 'PI' | 'AR')}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="PI">Propiedad Intelectual</option>
                  <option value="AR">Asuntos Regulatorios</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Tipo de actuación <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={procedureTypeId}
                  onChange={(e) => setProcedureTypeId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Seleccionar tipo de actuación...</option>
                  {activeProcedureTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.code} — {pt.name}
                    </option>
                  ))}
                </select>
                {activeProcedureTypes.length === 0 && (
                  <p className="text-xs text-amber-600 font-medium">
                    No hay tipos de actuación activos. Configúralos en Ajustes.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Marca o asunto <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  value={marcaAsunto}
                  onChange={(e) => setMarcaAsunto(e.target.value)}
                  placeholder="Ej: FITBIOTIC"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  País del trámite
                </Label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Monto
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Honorarios
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Condiciones de pago
                  </Label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Contado"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Fecha límite
                  </Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/spi-admin')}
              className="h-12 px-6 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-bold uppercase text-xs tracking-widest"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Save className="h-4 w-4 animate-pulse" /> Guardando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Crear OT
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualOTPage;
