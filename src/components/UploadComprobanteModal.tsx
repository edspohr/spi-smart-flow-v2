import { useRef, useState, type DragEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useDocumentStore from '@/store/useDocumentStore';
import type { OT } from '@/store/types';
import { cn } from '@/lib/utils';

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface Props {
  ot: OT;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UploadComprobanteModal = ({ ot, open, onOpenChange }: Props) => {
  const { uploadComprobantePago } = useDocumentStore();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [amount, setAmount] = useState<string>(
    typeof ot.amount === 'number' ? String(ot.amount) : '',
  );
  const [note, setNote] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const paymentType: 'adelanto' | 'cierre' =
    ot.stage === 'pago_adelanto' ? 'adelanto' : 'cierre';
  const currency = ot.billingCurrency || 'USD';

  const resetState = () => {
    setFile(null);
    setPreviewUrl(null);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAmount(typeof ot.amount === 'number' ? String(ot.amount) : '');
    setNote('');
    setDragging(false);
  };

  const handleClose = () => {
    if (uploading) return;
    resetState();
    onOpenChange(false);
  };

  const validateAndSetFile = (f: File | null) => {
    if (!f) return;
    if (!ACCEPTED_MIME.includes(f.type)) {
      toast.error('Formato no válido. Aceptado: JPG, PNG o PDF.');
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error('Archivo muy grande (máximo 10 MB).');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !paymentDate) return;
    setUploading(true);
    try {
      const parsedAmount = parseFloat(amount);
      const declaredAmount =
        isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : ot.amount || 0;

      await uploadComprobantePago({
        otId: ot.id,
        companyId: ot.companyId,
        file,
        paymentType,
        amount: declaredAmount,
        currency,
        paymentDate,
        receiptNote: note.trim() || undefined,
      });

      toast.success('Comprobante subido — SPI lo revisará en breve');
      resetState();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir el comprobante');
    } finally {
      setUploading(false);
    }
  };

  const title = ot.brandName || ot.procedureTypeName || ot.title || 'Solicitud';

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg rounded-[2rem] bg-white border-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
            Subir comprobante de pago
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium pt-1">
            {title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Amount read-only */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
              Monto esperado
            </p>
            <p className="text-lg font-black text-slate-900">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency,
                maximumFractionDigits: 0,
              }).format(ot.amount || 0)}
            </p>
          </div>

          {/* File upload */}
          <div>
            <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">
              Comprobante *
            </Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'mt-2 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors',
                dragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50',
              )}
              onClick={() => inputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center gap-3 text-left">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    disabled={uploading}
                    className="text-slate-500 hover:text-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-2">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-900">
                    Arrastrá tu comprobante aquí
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    o hacé click para seleccionarlo · JPG, PNG, PDF · máx 10 MB
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => validateAndSetFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Fecha del pago */}
          <div>
            <Label htmlFor="paymentDate" className="text-xs font-black uppercase text-slate-500 tracking-widest">
              Fecha del pago *
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={uploading}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-2 rounded-xl font-semibold"
            />
          </div>

          {/* Monto pagado */}
          <div>
            <Label htmlFor="amount" className="text-xs font-black uppercase text-slate-500 tracking-widest">
              Monto pagado ({currency})
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={uploading}
              className="mt-2 rounded-xl font-semibold"
            />
            <p className="text-xs font-medium text-slate-400 mt-1">
              Ajustá si pagaste un monto diferente al facturado.
            </p>
          </div>

          {/* Nota */}
          <div>
            <Label htmlFor="note" className="text-xs font-black uppercase text-slate-500 tracking-widest">
              Nota opcional
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              disabled={uploading}
              placeholder="Ej: Pago desde cuenta Banco de Chile"
              className="mt-2 rounded-xl font-semibold resize-none"
              rows={3}
            />
            <p className="text-xs font-medium text-slate-400 mt-1">
              {note.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 gap-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={uploading}
            className="rounded-xl font-bold text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !paymentDate || uploading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-6 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir comprobante
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadComprobanteModal;
