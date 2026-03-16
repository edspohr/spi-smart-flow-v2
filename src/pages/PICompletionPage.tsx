import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useOTStore from '../store/useOTStore';
import useDocumentStore from '../store/useDocumentStore';
import useAuthStore from '../store/useAuthStore';
import {
  Check,
  ChevronRight,
  Palette,
  Camera,
  Briefcase,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import DocumentUpload from '@/components/DocumentUpload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PICompletionPage = () => {
  const { otId } = useParams<{ otId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { ots, loading: otLoading, updateOTDetails } = useOTStore();
  const { checkVaultForReuse, linkVaultDocument } = useDocumentStore();
  
  const [ot, setOt] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [pantone, setPantone] = useState("");
  const [brandClass, setBrandClass] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vaultSuggestions, setVaultSuggestions] = useState<{
    cedula?: any;
    poder_legal?: any;
  }>({});

  useEffect(() => {
    const foundOt = ots.find(o => o.id === otId);
    if (foundOt) {
      setOt(foundOt);
      setPantone(foundOt.pantone || "");
      setBrandClass((foundOt as any).brandClass || "");
    }
  }, [ots, otId]);

  useEffect(() => {
    if (user?.companyId) {
      const cedula = checkVaultForReuse('cedula');
      const poder = checkVaultForReuse('poder_legal');
      setVaultSuggestions({ cedula, poder_legal: poder });
    }
  }, [user, checkVaultForReuse]);

  const handleUpdateBrandInfo = async () => {
    if (!otId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateOTDetails(otId, { pantone, brandClass } as any);
      setStep(2);
      toast.success("Información de marca actualizada");
    } catch (error) {
      toast.error("Error al actualizar información");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = () => {
    setStep(3);
    toast.success("Logotipo cargado");
  };

  const handleVaultLink = async (type: 'cedula' | 'poder_legal', doc: any) => {
    if (!otId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await linkVaultDocument(otId, doc);
      toast.success(`${type === 'cedula' ? 'Cédula' : 'Poder'} vinculado desde bóveda`);
      if (type === 'poder_legal') {
        setStep(4);
      } else {
        setStep(5);
      }
    } catch (error) {
      toast.error("Error al vincular documento");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (otLoading || !ot) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sections = [
    { id: 1, title: 'Información de Marca', icon: Palette, color: 'bg-amber-500' },
    { id: 2, title: 'Logotipo', icon: Camera, color: 'bg-blue-500' },
    { id: 3, title: 'Poder Legal', icon: Briefcase, color: 'bg-indigo-500' },
    { id: 4, title: 'Cédula de Identidad', icon: ShieldCheck, color: 'bg-emerald-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button 
            onClick={() => navigate('/client')}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Tablero
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Completar Solicitud PI</h1>
          <p className="text-slate-500 mt-2 font-medium">Marca: <span className="text-blue-600 font-black">{ot.brandName || ot.title}</span></p>
        </div>
        
        <div className="flex gap-2">
          {sections.map((s) => (
            <div 
              key={s.id}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                step >= s.id ? s.color + " text-white shadow-lg" : "bg-slate-100 text-slate-300"
              )}
            >
              <s.icon className="h-5 w-5" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {/* Step 1: Brand Info */}
        <Card className={cn(
          "rounded-[2.5rem] border-slate-100 transition-all duration-500 overflow-hidden",
          step === 1 ? "ring-4 ring-blue-50 shadow-2xl shadow-blue-200/50" : "opacity-60 scale-[0.98] pointer-events-none"
        )}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                <Palette className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Detalles de la Marca</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Color Pantone (Opcional)</Label>
                <Input 
                  value={pantone}
                  onChange={(e) => setPantone(e.target.value)}
                  placeholder="ej. 19-4052 Classic Blue"
                  className="h-14 rounded-2xl border-slate-100 focus:ring-blue-500 bg-slate-50 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Clase de Marca</Label>
                <Input 
                  value={brandClass}
                  onChange={(e) => setBrandClass(e.target.value)}
                  placeholder="ej. Clase 35 (Publicidad)"
                  className="h-14 rounded-2xl border-slate-100 focus:ring-blue-500 bg-slate-50 font-bold"
                />
              </div>
            </div>

            {step === 1 && (
              <div className="mt-10">
                <Button
                  onClick={handleUpdateBrandInfo}
                  disabled={isSubmitting}
                  className="w-full md:w-auto h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs group disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    <>Continuar al Siguiente Paso<ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Step 2: Logo */}
        <Card className={cn(
          "rounded-[2.5rem] border-slate-100 transition-all duration-500 overflow-hidden",
          step === 2 ? "ring-4 ring-blue-50 shadow-2xl shadow-blue-200/50" : step < 2 ? "opacity-40 grayscale" : "opacity-60"
        )}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Camera className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cargar Logotipo</h2>
            </div>

            {step === 2 && (
              <DocumentUpload 
                documentLabel="Logotipo"
                storagePath={`ots/${otId}/logo`}
                onUploadComplete={handleLogoUpload}
                accept=".png,.jpg,.jpeg,.svg"
              />
            )}
            {step > 2 && (
              <div className="flex items-center gap-3 text-emerald-600 font-bold">
                <Check className="h-5 w-5" /> Logotipo cargado correctamente
              </div>
            )}
            {step === 2 && (
               <button 
                  onClick={() => setStep(3)}
                  className="mt-6 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest"
               >
                  Omitir por ahora (No recomendado)
               </button>
            )}
          </div>
        </Card>

        {/* Step 3: Power of Attorney */}
        <Card className={cn(
          "rounded-[2.5rem] border-slate-100 transition-all duration-500 overflow-hidden",
          step === 3 ? "ring-4 ring-blue-50 shadow-2xl shadow-blue-200/50" : step < 3 ? "opacity-40 grayscale" : "opacity-60"
        )}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Poder Legal</h2>
            </div>

            {step === 3 && (
              <div className="space-y-6">
                {vaultSuggestions.poder_legal && (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-emerald-900">Documento en Bóveda Detectado</p>
                        <p className="text-xs font-bold text-emerald-700/70">Tienes un Poder Legal vigente. ¿Deseas reutilizarlo?</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleVaultLink('poder_legal', vaultSuggestions.poder_legal)}
                      disabled={isSubmitting}
                      className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-60"
                    >
                      Reutilizar de Bóveda
                    </Button>
                  </div>
                )}

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] bg-white px-4">ó cargar nuevo</div>
                </div>

                <DocumentUpload 
                  documentLabel="Poder Legal"
                  storagePath={`ots/${otId}/poder`}
                  onUploadComplete={() => setStep(4)}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </div>
            )}
            {step > 3 && (
              <div className="flex items-center gap-3 text-emerald-600 font-bold">
                <Check className="h-5 w-5" /> Poder Legal gestionado
              </div>
            )}
          </div>
        </Card>

        {/* Step 4: ID Card */}
        <Card className={cn(
          "rounded-[2.5rem] border-slate-100 transition-all duration-500 overflow-hidden",
          step === 4 ? "ring-4 ring-blue-50 shadow-2xl shadow-blue-200/50" : step < 4 ? "opacity-40 grayscale" : "opacity-60"
        )}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cédula de Identidad</h2>
            </div>

            {step === 4 && (
              <div className="space-y-6">
                {vaultSuggestions.cedula && (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-emerald-900">Cédula en Bóveda Detectada</p>
                        <p className="text-xs font-bold text-emerald-700/70">Tu identificación está vigente. ¿Deseas reutilizarla?</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleVaultLink('cedula', vaultSuggestions.cedula)}
                      disabled={isSubmitting}
                      className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-60"
                    >
                      Reutilizar de Bóveda
                    </Button>
                  </div>
                )}

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] bg-white px-4">ó cargar nuevo</div>
                </div>

                <DocumentUpload 
                  documentLabel="Cédula"
                  storagePath={`ots/${otId}/cedula`}
                  onUploadComplete={() => setStep(5)}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </div>
            )}
            {step > 4 && (
              <div className="flex items-center gap-3 text-emerald-600 font-bold">
                <Check className="h-5 w-5" /> Identificación gestionada
              </div>
            )}
          </div>
        </Card>

        {/* Final Step */}
        {step === 5 && (
          <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-blue-900/40 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20">
              <Check className="h-10 w-10 text-white stroke-[4]" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-4">¡Todo listos!</h2>
            <p className="text-slate-400 font-semibold max-w-sm mx-auto mb-10">
              Has completado toda la información requerida. El equipo de SPI revisará tus documentos en las próximas 24 horas.
            </p>
            <Button 
              onClick={() => navigate('/client')}
              className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20"
            >
              Finalizar y Volver al Tablero
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PICompletionPage;
