import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDataStore, { Document } from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import TimelineStepper from '@/components/TimelineStepper';
import DocumentUpload from '@/components/DocumentUpload';
import SmartVaultModal from '@/components/SmartVaultModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const STEPS = ['Solicitud', 'Documentación', 'Revisión', 'Pago'];

const NewRequestPage = () => {
    const navigate = useNavigate();
    const { checkVaultForReuse } = useDataStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [vaultModalOpen, setVaultModalOpen] = useState(false);
    const [foundVaultDoc, setFoundVaultDoc] = useState<Document | null>(null);
    const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: boolean }>({});

    // Define required documents for this example flow
    const requiredDocs = [
        { type: 'poder_legal', label: 'Poder Legal' },
        { type: 'cedula', label: 'Cédula de Identidad' }
    ];

    // Check vault when entering Documentation step (Step 1)
    useEffect(() => {
        if (currentStep === 1) {
            // Check for the first missing document in the vault
            for (const doc of requiredDocs) {
                if (!uploadedDocs[doc.type]) {
                    const vaultDoc = checkVaultForReuse(doc.type);
                    if (vaultDoc) {
                        setFoundVaultDoc(vaultDoc);
                        setVaultModalOpen(true);
                        break; // Only show one at a time for simplicity
                    }
                }
            }
        }
    }, [currentStep, uploadedDocs, checkVaultForReuse]);

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
            if (currentStep + 1 === STEPS.length - 1) {
                 triggerConfetti();
                 
                 // Create OT in Firestore when reaching the final (payment/confirmation) step
                 // Or better, when clicking 'Finalizar' on the last step?
                 // User said: "when the user clicks 'Finalizar' on the last step"
            }
        } else {
            // Final Step - Create OT
            try {
                // Determine service type from local state or hardcode for now if not fully tracking selection
                // In a real app, 'Propiedad Intelectual' selection in step 0 should be stored in state
                const { user } = useAuthStore.getState();
                if (user) {
                     await useDataStore.getState().createOT({
                        clientId: user.uid,
                        companyId: user.companyId || 'unknown',
                        title: 'Nueva Solicitud Web', // Should be dynamic
                        serviceType: 'Propiedad Intelectual', // Should be dynamic based on Step 0
                        stage: 'solicitud',
                        amount: 0, // Pending quote
                        createdAt: new Date().toISOString()
                    });
                }
                navigate('/client');
            } catch (error) {
                console.error("Failed to create OT", error);
                // Handle error (show toast?)
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
        else navigate('/client');
    };

    const handleReuseVaultDoc = () => {
        if (foundVaultDoc) {
            setUploadedDocs(prev => ({ ...prev, [foundVaultDoc.type]: true }));
            
            // Log the reuse action
            useDataStore.getState().logAction(
                foundVaultDoc.clientId, 
                'new-request-flow', 
                `Documento Reutilizado de Bóveda: ${foundVaultDoc.type} (${foundVaultDoc.name})`
            );

            setFoundVaultDoc(null);
            setVaultModalOpen(false);
            
             // Trigger tiny confetti for reuse success
             confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });

            // Check if there are other docs in vault after a short delay
             setTimeout(() => {
                // The effect will run again due to uploadedDocs changing
             }, 500);
        }
    };

    const handleUploadComplete = (docType: string) => {
        setUploadedDocs(prev => ({ ...prev, [docType]: true }));
    };

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
            return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const canProceed = () => {
        if (currentStep === 1) {
            return requiredDocs.every(d => uploadedDocs[d.type]);
        }
        return true;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/client')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold text-slate-800">Nueva Solicitud</h1>
            </div>

            {/* Stepper */}
            <div className="py-6 px-4">
                <TimelineStepper steps={STEPS} currentStep={currentStep} />
            </div>

            {/* Content Area */}
            <Card className="glass-card min-h-[400px]">
                <CardContent className="p-8">
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800">Detalles de la Solicitud</h2>
                            <p className="text-slate-500">Por favor confirma el tipo de servicio que deseas solicitar.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button variant="outline" className="h-32 flex flex-col gap-2 border-2 hover:border-blue-500 hover:bg-blue-50">
                                    <span className="text-lg font-bold">Propiedad Intelectual</span>
                                    <span className="text-xs text-slate-500 font-normal">Registro de marcas y patentes</span>
                                </Button>
                                <Button variant="outline" className="h-32 flex flex-col gap-2 border-2 hover:border-blue-500 hover:bg-blue-50">
                                    <span className="text-lg font-bold">Asuntos Regulatorios</span>
                                    <span className="text-xs text-slate-500 font-normal">Permisos sanitarios y licencias</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6">
                             <h2 className="text-xl font-semibold text-slate-800">Documentación Requerida</h2>
                             <p className="text-slate-500">Sube los documentos necesarios. Nuestra IA validará la información automáticamente.</p>
                             
                             <div className="grid md:grid-cols-2 gap-6">
                                {requiredDocs.map(doc => (
                                    <div key={doc.type} className="space-y-2">
                                        <div className="flex justify-between">
                                             <label className="font-medium text-sm text-slate-700">{doc.label}</label>
                                             {uploadedDocs[doc.type] && <Check className="h-4 w-4 text-green-600" />}
                                        </div>
                                        {uploadedDocs[doc.type] ? (
                                            <div className="h-40 border-2 border-green-200 bg-green-50 rounded-lg flex flex-col items-center justify-center text-green-700">
                                                <Check className="h-8 w-8 mb-2" />
                                                <span className="text-sm font-semibold">Listo</span>
                                            </div>
                                        ) : (
                                            <DocumentUpload 
                                                documentType={doc.type} 
                                                documentLabel={doc.label} 
                                                onUploadComplete={() => handleUploadComplete(doc.type)} 
                                            />
                                        )}
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="text-center space-y-4 py-10">
                            <h2 className="text-2xl font-bold text-slate-800">¡Todo Listo!</h2>
                            <p className="text-slate-500">Hemos verificado tus documentos exitosamente.</p>
                            <div className="flex justify-center">
                                <div className="p-6 bg-blue-50 rounded-full animate-bounce">
                                    <Check className="h-12 w-12 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    )}

                     {currentStep === 3 && (
                        <div className="text-center py-10">
                            <h2 className="text-xl font-bold">Pasarela de Pago (Mock)</h2>
                            <p className="text-slate-500 mt-2">Simulando redirección...</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                    Atrás
                </Button>
                <Button onClick={handleNext} disabled={!canProceed()} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                    {currentStep === STEPS.length - 1 ? 'Finalizar' : 'Continuar'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* Smart Vault Modal */}
            {foundVaultDoc && (
                <SmartVaultModal 
                    isOpen={vaultModalOpen} 
                    onClose={() => setVaultModalOpen(false)} 
                    onReuse={handleReuseVaultDoc}
                    document={foundVaultDoc}
                />
            )}
        </div>
    );
};

export default NewRequestPage;
