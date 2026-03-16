import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useDataStore, { uploadFile } from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import SignaturePad from '@/components/SignaturePad';
import DocumentUpload from '@/components/DocumentUpload';
import ColorPicker from '@/components/ColorPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check, Loader2, PenTool, ShieldCheck, UserCircle2, AlertCircle, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addDays } from 'date-fns';

const LEGAL_TEXT = "Por el presente instrumento, otorgo poder especial a SPI Americas para que en mi nombre y representación, inicie, prosiga y termine todas las gestiones necesarias para el registro de mi marca ante las autoridades competentes. Declaro que la información proporcionada es veraz.";

const NewRequestPage = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const { createOT, users, subscribeToUsers, companies, subscribeToCompanies } = useDataStore();

    // Form state
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [otTitle, setOtTitle] = useState('');
    const [brandName, setBrandName] = useState('');
    const [description, setDescription] = useState('');
    const [colors, setColors] = useState<string[]>([]);
    const [logoUrl, setLogoUrl] = useState('');
    const [signatureUrl, setSignatureUrl] = useState('');
    
    // UI state
    const [hasReadLegalText, setHasReadLegalText] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isUploadingSignature, setIsUploadingSignature] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        const unsubscribeUsers = subscribeToUsers();
        const unsubscribeCompanies = subscribeToCompanies();
        return () => {
            unsubscribeUsers();
            unsubscribeCompanies();
        };
    }, [subscribeToUsers, subscribeToCompanies]);

    // Filter only clients for the selected company
    const clientUsers = users.filter(u => u.role === 'client' && (selectedCompanyId === '' || u.companyId === selectedCompanyId));

    const handleSignatureSave = async (signatureDataUrl: string) => {
        if (!selectedClientId) return;
        setIsUploadingSignature(true);
        try {
            const res = await fetch(signatureDataUrl);
            const blob = await res.blob();
            const url = await uploadFile(blob, `signatures/${selectedClientId}/${Date.now()}_firma.png`);
            setSignatureUrl(url);
            setIsSigning(false);
        } catch (err) {
            console.error("Error uploading signature:", err);
            toast.error("Error al guardar la firma. Intenta nuevamente.");
        } finally {
            setIsUploadingSignature(false);
        }
    };

    const canSubmit = () => {
        // Now only requires identity and brand info.
        // Documents and signature can be completed later by the client.
        return selectedCompanyId !== '' &&
               selectedClientId !== '' &&
               otTitle.trim() !== '' &&
               brandName.trim() !== '' && 
               description.trim() !== '';
    };

    const handleSubmit = async () => {
        if (!canSubmit() || !currentUser) return;
        
        setIsSubmitting(true);
        setSubmitError('');
        
        try {
            const now = new Date();
            await createOT({
                brandName,
                description,
                colors,
                logoUrl,
                signatureUrl,
                title: otTitle,
                serviceType: 'Propiedad Intelectual',
                area: 'PI',
                stage: 'solicitud',
                clientId: selectedClientId,
                companyId: selectedCompanyId,
                amount: 0,
                createdAt: now.toISOString(),
                deadline: addDays(now, 90).toISOString(),
            });

            // Success confetti
// ... existing confetti logic ...
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const random = (min: number, max: number) => Math.random() * (max - min) + min;
            const interval: any = setInterval(function() {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            setTimeout(() => navigate('/spi-admin'), 1500);
        } catch (error) {
            console.error("Failed to create OT", error);
            setSubmitError('Error al crear la solicitud. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/spi-admin')} className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-slate-50 tracking-tight">Nueva Operación <span className="text-blue-500">SPI</span></h1>
                    <p className="text-sm font-semibold text-slate-400 mt-1">Alta de trámite de Propiedad Intelectual para cliente.</p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
                
                {/* 0. Selección de Empresa y Cliente */}
                <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-blue-600 rounded-2xl">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Vínculo Corporativo</h2>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Identificación Obligatoria</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Empresa Cliente</Label>
                                <select 
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 outline-none"
                                    value={selectedCompanyId}
                                    onChange={(e) => {
                                        setSelectedCompanyId(e.target.value);
                                        setSelectedClientId(''); // Reset client when company changes
                                    }}
                                >
                                    <option value="" disabled>Seleccionar Empresa...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Contacto / Representante</Label>
                                <select 
                                    disabled={!selectedCompanyId}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 outline-none disabled:opacity-50"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                >
                                    <option value="" disabled>Seleccionar Persona...</option>
                                    {clientUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.displayName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedCompanyId && clientUsers.length === 0 && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                                <UserCircle2 className="h-5 w-5 text-amber-500" />
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight">
                                    No hay usuarios asignados a esta empresa aún.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 1. Poder Simple (Signature) */}
                <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500 rounded-2xl">
                                <PenTool className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Firma de Poder Legal</h2>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Opcional para Admin (Completado por cliente)</p>
                            </div>
                            {signatureUrl && <Check className="h-6 w-6 text-emerald-600 ml-auto" />}
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 border-l-4 border-l-blue-600 shadow-sm">
                            <p className="text-sm text-slate-700 leading-relaxed font-semibold italic">
                                "{LEGAL_TEXT}"
                            </p>
                        </div>

                        {!signatureUrl ? (
                            <>
                                {!isSigning ? (
                                    <div className="space-y-4">
                                        <div 
                                            onClick={() => setHasReadLegalText(!hasReadLegalText)}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                                                hasReadLegalText ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 hover:border-blue-200"
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                hasReadLegalText ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                            }`}>
                                                {hasReadLegalText && <Check className="h-4 w-4 text-white" />}
                                            </div>
                                            <label className="text-sm font-black text-slate-700 cursor-pointer">
                                                He validado la aceptación de los términos con el cliente
                                            </label>
                                        </div>

                                        <Button
                                            disabled={!hasReadLegalText || !selectedClientId}
                                            onClick={() => setIsSigning(true)}
                                            className="w-full btn-primary h-12 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20"
                                        >
                                            <ShieldCheck className="mr-2 h-4 w-4" /> Proceder a la Firma
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panel de Dibujo</h4>
                                            <Button variant="ghost" size="sm" onClick={() => setIsSigning(false)} className="text-xs font-bold text-blue-600">
                                                Cancelar
                                            </Button>
                                        </div>
                                        {isUploadingSignature ? (
                                            <div className="flex items-center justify-center py-12 gap-3">
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                <span className="text-sm font-black text-slate-500">Guardando firma...</span>
                                            </div>
                                        ) : (
                                            <div className="rounded-3xl overflow-hidden bg-white ring-2 ring-slate-100 shadow-inner">
                                                <SignaturePad 
                                                    onSave={handleSignatureSave}
                                                    onCancel={() => setIsSigning(false)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex items-center gap-4 animate-scale-in">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                    <Check className="h-6 w-6 stroke-[4]" />
                                </div>
                                <span className="text-sm font-black text-emerald-800 uppercase tracking-tighter">Firma Registrada correctamente</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Información de Marca */}
                <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 bg-white">
                    <CardContent className="p-8 space-y-6">
                        <div className="grid gap-6">
                             <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-600 uppercase tracking-[0.1em] ml-1">Título de la Operación (OT)</Label>
                                <Input
                                    type="text"
                                    placeholder="Ej: Registro de Marca 2026..."
                                    value={otTitle}
                                    onChange={(e) => setOtTitle(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold focus:bg-white transition-all"
                                />
                            </div>

                             <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-600 uppercase tracking-[0.1em] ml-1">Nombre Comercial de la Marca</Label>
                                <Input
                                    type="text"
                                    placeholder="Nombre de la marca..."
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-600 uppercase tracking-[0.1em] ml-1">Descripción de Actividades</Label>
                                <Textarea
                                    placeholder="Describe los productos o servicios asociados..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 font-semibold focus:bg-white transition-all resize-none"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Multimedia */}
                <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 bg-white">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Logo y Pantón</h2>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Opcional (Puede cargarlo el cliente)</p>
                            </div>
                            {logoUrl && <Check className="h-6 w-6 text-emerald-600 ml-auto" />}
                        </div>
                        
                        {!logoUrl ? (
                            <DocumentUpload
                                documentLabel="Subir Logo (PNG/JPG)"
                                storagePath={`logos/${selectedClientId || 'temp'}`}
                                onUploadComplete={(url) => setLogoUrl(url)}
                                accept=".png,.jpg,.jpeg"
                            />
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[2rem] flex items-center gap-4">
                                <img src={logoUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-md" />
                                <div className="flex-1">
                                    <p className="text-xs font-black text-emerald-800">Logo Verificado</p>
                                    <Button variant="ghost" size="sm" onClick={() => setLogoUrl('')} className="text-[10px] font-black uppercase text-slate-400 h-6 p-0 hover:text-rose-500">Eliminar</Button>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100">
                             <Label className="text-xs font-black text-slate-600 uppercase tracking-[0.1em] mb-4 block">Paleta de Colores</Label>
                             <ColorPicker colors={colors} onChange={setColors} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-fade-in">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-bold">{submitError}</p>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-900/10">
                <Button variant="ghost" onClick={() => navigate('/spi-admin')} className="font-black text-slate-400 uppercase tracking-widest text-xs">
                    Descartar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    disabled={!canSubmit() || isSubmitting} 
                    className="bg-slate-900 hover:bg-slate-800 min-w-[240px] h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2rem] shadow-2xl shadow-slate-900/30 text-white transition-all active:scale-95 disabled:grayscale"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Procesando...
                        </>
                    ) : (
                        <>
                            Confirmar Operación <Check className="ml-3 h-5 w-5 stroke-[3]" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default NewRequestPage;
