import { useState, useRef } from 'react';
import { 
  Upload, FileText, AlertCircle, X, Eye, 
  PenTool, ShieldCheck, FileType, Image as ImageIcon, Sparkles,
  ChevronRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { analyzeDocument, ExtractedData } from '@/lib/gemini';
import useDataStore from '@/store/useDataStore';
import useAuthStore from '@/store/useAuthStore';
import SignaturePad from './SignaturePad';

interface DocumentUploadProps {
  documentType: string;
  documentLabel: string;
  onUploadComplete: (data: ExtractedData) => void;
  enableSigning?: boolean;
  templatePreviewUrl?: string;
}

const DocumentUpload = ({ 
  documentType: _documentType, 
  documentLabel, 
  onUploadComplete, 
  enableSigning = false, 
  templatePreviewUrl 
}: DocumentUploadProps) => {
  const { addToVault } = useDataStore();
  const { user } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'upload' | 'sign'>('upload');
  const [hasViewed, setHasViewed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (activeTab === 'upload' && e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsAnalyzing(true);
    setError(null);
    setProgress(10);

    const interval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 10));
    }, 200);

    try {
        const data = await analyzeDocument(uploadedFile);
        clearInterval(interval);
        setProgress(100);
        
        if (data.confidence < 0.7) {
             setError("No pudimos validar el documento con total confianza. Asegúrate de que la imagen no esté borrosa.");
             setResult(null);
        } else {
             setResult(data);
             if (user) {
                addToVault({
                    id: `doc-${Date.now()}`,
                    clientId: user.uid,
                    name: data.name,
                    type: data.documentType,
                    status: 'validated',
                    isVaultEligible: true,
                    validUntil: data.validUntil || undefined,
                    url: URL.createObjectURL(uploadedFile)
                });
             }
             onUploadComplete(data);
        }
    } catch (err) {
        setError("Ocurrió un error al procesar el documento con la IA.");
        console.error(err);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSignatureSave = async (signatureDataUrl: string) => {
      setIsAnalyzing(true);
      setProgress(50);
      const res = await fetch(signatureDataUrl);
      const blob = await res.blob();
      const signedFile = new File([blob], `${documentLabel}_firmado.png`, { type: 'image/png' });
      processFile(signedFile);
  };

  const resetUpload = () => {
      setFile(null);
      setResult(null);
      setError(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderUploadContent = () => (
    <div className="space-y-6">
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
        />

        {!file ? (
            <div 
                className={cn(
                    "relative group flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden",
                    isDragging ? "border-blue-500 bg-blue-50/50 scale-[0.98]" : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-blue-300",
                    isAnalyzing && "ai-pulse border-blue-400 pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="relative z-10 text-xl font-black text-slate-800 tracking-tight">Cargar {documentLabel}</h3>
                <p className="relative z-10 text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">PDF, JPG o PNG hasta 10MB</p>
                
                <div className="mt-8 flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <FileType className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-5">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                            {file.type.includes('image') ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                         </div>
                         <div>
                             <p className="font-black text-slate-800 truncate max-w-[240px] leading-tight">{file.name}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{(file.size / 1024 / 1024).toFixed(2)} Megabytes</p>
                         </div>
                    </div>
                    {!result && !isAnalyzing && (
                        <Button variant="ghost" size="icon" onClick={resetUpload} className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors">
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {isAnalyzing && (
                    <div className="bg-blue-50/50 p-6 rounded-[1.5rem] border border-blue-100/50 space-y-4 shadow-inner">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse"/> Analizando con Smart IA...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-blue-100 shadow-none" />
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-[1.5rem] flex flex-col gap-4">
                        <div className="flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold text-rose-800">{error}</p>
                        </div>
                        <Button variant="outline" onClick={resetUpload} className="w-full h-10 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px] tracking-widest">Reintentar Carga</Button>
                    </div>
                )}

                {result && (
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] shadow-xl shadow-emerald-200/20 animate-fade-scale">
                        <div className="flex gap-3 items-center text-emerald-800 font-black mb-4 uppercase tracking-widest text-xs">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                <Check className="h-4 w-4 stroke-[4]" />
                            </div>
                            Validación Completada
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/50 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tipo Detectado</p>
                                <p className="text-sm font-bold text-emerald-700">{result.documentType}</p>
                            </div>
                            <div className="bg-white/50 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Confianza</p>
                                <p className="text-sm font-bold text-emerald-700">{(result.confidence * 100).toFixed(0)}% AI Score</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );

  return (
    <div className="space-y-6">
        {enableSigning ? (
            <Tabs defaultValue="upload" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1.5 bg-slate-100/50 rounded-2xl gap-2 h-14">
                    <TabsTrigger value="upload" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-700 transition-all">
                        <Upload className="h-3.5 w-3.5 mr-2" /> Subir Archivo
                    </TabsTrigger>
                    <TabsTrigger value="sign" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-700 transition-all">
                        <PenTool className="h-3.5 w-3.5 mr-2" /> Firma Digital
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-8">
                    {renderUploadContent()}
                </TabsContent>

                <TabsContent value="sign" className="mt-8 h-full">
                    <div className="space-y-6 h-full">
                        {!hasViewed ? (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 text-center animate-fade-in">
                                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="h-10 w-10 text-blue-600" />
                                </div>
                                <h4 className="font-black text-slate-900 text-2xl tracking-tight">Revisión de Seguridad</h4>
                                <p className="text-slate-500 font-semibold mt-2 mb-8 px-4">Debes confirmar que has leído y apruebas el contenido de la plantilla antes de firmar.</p>
                                
                                <div className="space-y-6">
                                     <Button 
                                        variant="outline" 
                                        className="w-full h-14 rounded-2xl gap-3 border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 font-black uppercase text-xs tracking-widest transition-all group" 
                                        onClick={() => window.open(templatePreviewUrl || '#', '_blank')}
                                    >
                                        <Eye className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" /> Vista Previa del Documento
                                    </Button>

                                    <div 
                                        onClick={() => setHasViewed(!hasViewed)}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer select-none",
                                            hasViewed ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 hover:border-blue-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            hasViewed ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                        )}>
                                            {hasViewed && <Check className="h-4 w-4 text-white font-black" />}
                                        </div>
                                        <label className="text-sm font-black text-slate-700 cursor-pointer">
                                            He leído y acepto los términos
                                        </label>
                                    </div>

                                    <Button 
                                        disabled={!hasViewed}
                                        onClick={() => setHasViewed(true)}
                                        className="w-full btn-primary h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20 disabled:grayscale disabled:opacity-50"
                                    >
                                        Continuar a la Firma <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-slide-up bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-8 h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Panel de Firma</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Utilice el ratón o touchpad para firmar</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600" onClick={() => setHasViewed(false)}>
                                        Volver a leer
                                    </Button>
                                </div>
                                <div className="rounded-[1.5rem] overflow-hidden bg-slate-50 ring-1 ring-slate-100">
                                    <SignaturePad 
                                        onSave={handleSignatureSave}
                                        onCancel={() => setActiveTab('upload')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        ) : (
            renderUploadContent()
        )}
    </div>
  );
};

export default DocumentUpload;
