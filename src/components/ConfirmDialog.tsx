import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'destructive' | 'default';
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmVariant = 'destructive',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[2rem] bg-white border-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium pt-1">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl font-bold text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={
              confirmVariant === 'destructive'
                ? 'rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black px-6 disabled:opacity-60'
                : 'rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black px-6 disabled:opacity-60'
            }
          >
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
