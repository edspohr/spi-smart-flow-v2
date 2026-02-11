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
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 p-2 bg-slate-50/50 rounded-lg border border-slate-100 min-h-0">
                        {logs.length === 0 ? (
                             <div className="text-center py-10 text-slate-400 text-sm">
                                No hay actividad registrada aún.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className={cn(
                                    "flex gap-3 mb-4 w-full",
                                    log.type === 'system' ? "justify-start" : "justify-end"
                                )}>
                                    {log.type === 'system' && (
                                        <div className="mt-1 p-2 rounded-full h-fit bg-blue-100 text-blue-600 shrink-0">
                                            {getIconForType(log.type)}
                                        </div>
                                    )}
                                    
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl p-3 shadow-sm border",
                                        log.type === 'system' 
                                            ? "bg-white border-slate-200 rounded-tl-none text-slate-700" 
                                            : "bg-blue-600 border-blue-600 text-white rounded-tr-none"
                                    )}>
                                        <div className="flex justify-between items-center gap-4 mb-1">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                log.type === 'system' ? "text-slate-400" : "text-blue-200"
                                            )}>
                                                {log.type === 'system' ? 'Sistema / IA' : `Usuario (${log.userId.slice(0,6)}...)`}
                                            </span>
                                            <span className={cn(
                                                "text-[10px]",
                                                log.type === 'system' ? "text-slate-400" : "text-blue-100"
                                            )}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-sm leading-relaxed",
                                            log.type === 'system' ? "text-slate-600" : "text-white"
                                        )}>
                                            {log.action}
                                        </p>
                                    </div>

                                    {log.type !== 'system' && (
                                        <div className="mt-1 p-2 rounded-full h-fit bg-slate-100 text-slate-600 shrink-0">
                                            {getIconForType(log.type)}
                                        </div>
                                    )}
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
