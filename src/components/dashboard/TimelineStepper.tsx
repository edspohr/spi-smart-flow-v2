import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface TimelineStepperProps {
  currentStage: string;
}

const STAGES = [
  { id: 'solicitud', label: 'Solicitud' },
  { id: 'pago_adelanto', label: 'Pago Inicial' },
  { id: 'gestion', label: 'En Gestión' },
  { id: 'pago_cierre', label: 'Pago Final' },
  { id: 'finalizado', label: 'Finalizado' },
];

const TimelineStepper = ({ currentStage }: TimelineStepperProps) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-slate-100 rounded-full" />
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-blue-600 rounded-full transition-all duration-700 ease-in-out" 
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                  isCompleted ? "bg-blue-600 border-white text-white shadow-lg" : 
                  isActive ? "bg-white border-blue-600 text-blue-600 shadow-xl scale-110" : 
                  "bg-white border-slate-100 text-slate-300 shadow-sm"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[4]" />
                ) : (
                  <span className="text-[10px] font-black">{idx + 1}</span>
                )}
              </div>
              <div className="absolute -bottom-6 w-20 text-center">
                <span 
                  className={cn(
                    "text-[9px] font-black uppercase tracking-tight transition-colors duration-300",
                    isActive ? "text-blue-600" : isCompleted ? "text-slate-500" : "text-slate-300"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineStepper;
