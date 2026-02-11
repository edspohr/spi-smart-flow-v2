import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Calendar } from "lucide-react";
import { Document } from "@/store/useDataStore";

interface SmartVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReuse: () => void;
  document: Document;
}

const SmartVaultModal = ({ isOpen, onClose, onReuse, document }: SmartVaultModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            ¡Documento Encontrado en Bóveda!
          </DialogTitle>
          <DialogDescription>
            Hemos detectado un documento válido en tu Bóveda Smart. ¿Deseas reutilizarlo y saltar este paso?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <div className="p-2 bg-white rounded-full border border-slate-100 shadow-sm">
             <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none text-slate-700">{document.name}</p>
            <div className="flex items-center text-xs text-slate-500">
                <Calendar className="mr-1 h-3 w-3" />
                Vence: {document.validUntil ? new Date(document.validUntil).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start gap-2">
           <Button type="button" onClick={onReuse} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg">
            Sí, Reutilizar
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} className="w-full">
            No, subir uno nuevo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartVaultModal;
