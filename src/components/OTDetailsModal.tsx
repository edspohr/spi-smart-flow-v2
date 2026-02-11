import { useEffect } from 'react';
import useDataStore, { OT } from '../store/useDataStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from "@/components/ui/scroll-area" // Removed
import { Clock, CheckCircle2, User, Bot, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OTDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ot: OT;
}

const OTDetailsModal = ({ isOpen, onClose, ot }: OTDetailsModalProps) => {
    const { logs, subscribeToOTLogs } = useDataStore();

    useEffect(() => {
        if (isOpen && ot) {
            const unsubscribe = subscribeToOTLogs(ot.id); // Or ot.companyId + ot.id if needed? using ot.id
            return () => unsubscribe();
        }
    }, [isOpen, ot]);

    const getIconForType = (type: string) => {
        if (type === 'system') return <Bot className="h-4 w-4" />;
        return <User className="h-4 w-4" />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col glass-card border-none text-slate-800">
                <DialogHeader className="border-b border-slate-200 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                {ot.title}
                                <Badge variant="outline" className="text-xs uppercase bg-blue-50 text-blue-700 border-blue-200">
                                    {ot.serviceType}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="mt-1 flex items-center gap-4 text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> 
                                    Vence: {new Date(ot.deadline).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    ID: {ot.id}
                                </span>
                            </DialogDescription>
                        </div>
                        <div className="text-right">
                             <Badge className={cn(
                                "capitalize",
                                ot.stage === 'finalizado' ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            )}>
                                {ot.stage.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col mt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-slate-400" /> 
                        Bitácora de Actividad
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        {logs.length === 0 ? (
                             <div className="text-center py-10 text-slate-400 text-sm">
                                No hay actividad registrada aún.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className={cn(
                                    "flex gap-3 text-sm p-3 rounded-lg border transition-all hover:bg-white hover:shadow-sm",
                                    log.type === 'system' 
                                        ? "bg-blue-50/50 border-blue-100" 
                                        : "bg-white border-slate-100"
                                )}>
                                    <div className={cn(
                                        "mt-1 p-1.5 rounded-full h-fit",
                                        log.type === 'system' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {getIconForType(log.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                                                {log.type === 'system' ? 'Sistema / IA' : `Usuario (${log.userId.slice(0,6)}...)`}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-slate-600 leading-relaxed">
                                            {log.action}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OTDetailsModal;
