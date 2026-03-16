import { useState, useRef } from 'react';
import {
  Upload, FileText, AlertCircle, X,
  Image as ImageIcon, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadFileWithProgress } from '@/lib/uploadFile';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const MIME_MAP: Record<string, string> = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.pdf':  'application/pdf',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
};

function validateFile(file: File, accept: string): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El máximo es 10 MB.`;
  }
  const exts = accept.split(',').map(s => s.trim().toLowerCase());
  const allowedMimes = exts.flatMap(ext => MIME_MAP[ext] ? [MIME_MAP[ext]] : []);
  if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
    const labels = exts.join(', ').toUpperCase();
    return `Formato no permitido. Los formatos aceptados son: ${labels}`;
  }
  return null;
}

interface DocumentUploadProps {
  documentLabel: string;
  storagePath: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
}

const DocumentUpload = ({
  documentLabel,
  storagePath,
  onUploadComplete,
  accept = '.png,.jpg,.jpeg',
}: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = async (uploadedFile: File) => {
    setError(null);
    const validationError = validateFile(uploadedFile, accept);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(uploadedFile);
    setIsUploading(true);
    setProgress(0);

    try {
      const url = await uploadFileWithProgress(
        uploadedFile,
        `${storagePath}/${Date.now()}_${uploadedFile.name}`,
        (pct) => setProgress(pct)
      );
      setProgress(100);
      setUploadedUrl(url);
      onUploadComplete(url);
    } catch (err) {
      setError('Error al subir el archivo. Intenta nuevamente.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadedUrl(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const acceptedFormats = accept
    .split(',')
    .map(e => e.trim().replace('.', '').toUpperCase())
    .join(', ');

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
      />

      {/* Validation error shown before file selection */}
      {error && !file && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold text-rose-800">{error}</p>
        </div>
      )}

      {!file ? (
        <div
          className={cn(
            'relative group flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden',
            isDragging ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-blue-300'
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
          <p className="relative z-10 text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
            {acceptedFormats} · máx. 10 MB
          </p>

          <div className="mt-8 flex gap-3">
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploadedUrl && !isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetUpload}
                className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="bg-blue-50/50 p-6 rounded-[1.5rem] border border-blue-100/50 space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                <span>Subiendo archivo...</span>
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
              <Button
                variant="outline"
                onClick={resetUpload}
                className="w-full h-10 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[10px] tracking-widest"
              >
                Reintentar Carga
              </Button>
            </div>
          )}

          {uploadedUrl && (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] shadow-xl shadow-emerald-200/20 animate-fade-scale">
              <div className="flex gap-3 items-center text-emerald-800 font-black uppercase tracking-widest text-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <Check className="h-4 w-4 stroke-[4]" />
                </div>
                Archivo Subido Exitosamente
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
