import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Check, Loader2, PenTool, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addDays } from 'date-fns';

const LEGAL_TEXT = "Por el presente instrumento, otorgo poder especial a SPI Americas para que en mi nombre y representación, inicie, prosiga y termine todas las gestiones necesarias para el registro de mi marca ante las autoridades competentes. Declaro que la información proporcionada es veraz.";

const NewRequestPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { createOT } = useDataStore();

    // Form state
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

    const handleSignatureSave = async (signatureDataUrl: string) => {
        setIsUploadingSignature(true);
        try {
            const res = await fetch(signatureDataUrl);
            const blob = await res.blob();
            const url = await uploadFile(blob, `signatures/${user?.uid}/${Date.now()}_firma.png`);
            setSignatureUrl(url);
            setIsSigning(false);
        } catch (err) {
            console.error("Error uploading signature:", err);
        } finally {
            setIsUploadingSignature(false);
        }
    };

    const canSubmit = () => {
        return brandName.trim() !== '' && 
               description.trim() !== '' && 
               signatureUrl !== '' && 
               logoUrl !== '';
    };

    const handleSubmit = async () => {
        if (!canSubmit() || !user) return;
        
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
                title: `Registro de Marca: ${brandName}`,
                serviceType: 'Propiedad Intelectual',
                area: 'PI',
                stage: 'solicitud',
                clientId: user.uid,
                companyId: user.companyId || '',
                amount: 0,
                createdAt: now.toISOString(),
                deadline: addDays(now, 90).toISOString(),
            });

            // Success confetti
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

            setTimeout(() => navigate('/client'), 1500);
        } catch (error) {
            console.error("Failed to create OT", error);
            setSubmitError('Error al crear la solicitud. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/client')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Nueva Solicitud de Propiedad Intelectual</h1>
                    <p className="text-sm text-slate-500 mt-1">completa todos los campos para iniciar tu trámite de registro de marca</p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-8">

                {/* 1. Poder Simple (Signature) */}
                <Card className="glass-card overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <PenTool className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">1. Poder Simple</h2>
                                <p className="text-xs text-slate-500">Firma digital del poder legal</p>
                            </div>
                            {signatureUrl && <Check className="h-5 w-5 text-emerald-600 ml-auto" />}
                        </div>

                        {/* Legal Text */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-sm text-slate-700 leading-relaxed italic">
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
                                            <label className="text-sm font-bold text-slate-700 cursor-pointer">
                                                He leído y acepto los términos del poder legal
                                            </label>
                                        </div>

                                        <Button
                                            disabled={!hasReadLegalText}
                                            onClick={() => setIsSigning(true)}
                                            className="w-full btn-primary h-12 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 disabled:grayscale disabled:opacity-50"
                                        >
                                            <ShieldCheck className="mr-2 h-4 w-4" /> Continuar a la Firma
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-700">Panel de Firma</h4>
                                            <Button variant="ghost" size="sm" onClick={() => setIsSigning(false)} className="text-xs text-slate-400">
                                                Volver
                                            </Button>
                                        </div>
                                        {isUploadingSignature ? (
                                            <div className="flex items-center justify-center py-12 gap-3">
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                <span className="text-sm font-medium text-slate-500">Subiendo firma...</span>
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl overflow-hidden bg-slate-50 ring-1 ring-slate-100">
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
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <Check className="h-4 w-4 stroke-[3]" />
                                </div>
                                <span className="text-sm font-bold text-emerald-800">Firma registrada exitosamente</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Marca o producto a registrar */}
                <Card className="glass-card">
                    <CardContent className="p-8 space-y-4">
                        <h2 className="text-lg font-bold text-slate-800">2. Marca o producto a registrar</h2>
                        <p className="text-xs text-slate-500">Nombre de la marca que deseas registrar</p>
                        <div className="space-y-2">
                            <Label htmlFor="brandName" className="text-slate-700 font-semibold">Nombre de la Marca</Label>
                            <Input
                                id="brandName"
                                type="text"
                                placeholder="Ej: Mi Marca Premium"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="h-12 rounded-xl border-slate-200 text-base"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Descripción */}
                <Card className="glass-card">
                    <CardContent className="p-8 space-y-4">
                        <h2 className="text-lg font-bold text-slate-800">3. Descripción</h2>
                        <p className="text-xs text-slate-500">Describe la marca o producto que deseas registrar</p>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-700 font-semibold">Descripción del producto o servicio</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe los productos o servicios asociados a tu marca..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[120px] rounded-xl border-slate-200 text-sm resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Logo (File Upload) */}
                <Card className="glass-card">
                    <CardContent className="p-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-800">4. Logo</h2>
                            {logoUrl && <Check className="h-5 w-5 text-emerald-600" />}
                        </div>
                        <p className="text-xs text-slate-500">Sube el logo de tu marca en formato PNG o JPG</p>
                        {!logoUrl ? (
                            <DocumentUpload
                                documentLabel="Logo de la Marca"
                                storagePath={`logos/${user?.uid}`}
                                onUploadComplete={(url) => setLogoUrl(url)}
                                accept=".png,.jpg,.jpeg"
                            />
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <Check className="h-4 w-4 stroke-[3]" />
                                </div>
                                <span className="text-sm font-bold text-emerald-800">Logo subido exitosamente</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 5. Pantón de colores */}
                <Card className="glass-card">
                    <CardContent className="p-8 space-y-4">
                        <h2 className="text-lg font-bold text-slate-800">5. Pantón de Colores</h2>
                        <p className="text-xs text-slate-500">Selecciona los colores de tu marca (código hex o Pantone)</p>
                        <ColorPicker colors={colors} onChange={setColors} />
                    </CardContent>
                </Card>
            </div>

            {/* Submit */}
            {submitError && (
                <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl text-center">{submitError}</p>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => navigate('/client')}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    disabled={!canSubmit() || isSubmitting} 
                    className="bg-blue-600 hover:bg-blue-700 min-w-[180px] h-12 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                        </>
                    ) : (
                        <>
                            Finalizar Solicitud <Check className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default NewRequestPage;
