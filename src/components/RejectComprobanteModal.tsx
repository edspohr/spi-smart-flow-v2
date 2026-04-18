import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import useDocumentStore from '@/store/useDocumentStore';

interface Props {
  docId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RejectComprobanteModal = ({ docId, open, onOpenChange }: Props) => {
  const { reviewComprobantePago } = useDocumentStore();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!docId || !reason.trim()) return;
    setSubmitting(true);
    try {
      await reviewComprobantePago(docId, {
        status: 'rejected',
        rejectionReason: reason.trim(),
      });
      toast.success('Comprobante rechazado');
      setReason('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al rechazar el comprobante');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-md rounded-[2rem] bg-white border-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
            Rechazar comprobante
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium pt-1">
            ¿Por qué rechazás este comprobante? El cliente podrá subir uno nuevo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <Label htmlFor="reason" className="text-xs font-black uppercase text-slate-500 tracking-widest">
            Motivo *
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            disabled={submitting}
            placeholder="Ej: El monto no coincide con el facturado. Por favor subir nuevamente."
            className="rounded-xl font-semibold resize-none"
            rows={4}
          />
          <p className="text-xs font-medium text-slate-400">{reason.length}/500</p>
        </div>

        <DialogFooter className="pt-4 gap-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl font-bold text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black px-6 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rechazando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar comprobante
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectComprobanteModal;
