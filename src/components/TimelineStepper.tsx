import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStepperProps {
  steps: string[];
  currentStep: number;
}

const TimelineStepper = ({ steps, currentStep }: TimelineStepperProps) => {
  return (
    <div className="relative flex justify-between w-full">
      {/* Connecting Line */}
      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 px-4">
        <div className="h-1 w-full bg-slate-200 rounded-full"></div>
        <div 
            className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: \`\${(currentStep / (steps.length - 1)) * 100}%\` }}
        ></div>
      </div>

      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="relative z-10 flex flex-col items-center group">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all duration-500 bg-white",
                isCompleted ? "border-blue-600 bg-blue-600 text-white" : 
                isCurrent ? "border-blue-600 text-blue-600 scale-110" : "border-slate-300 text-slate-400"
              )}
            >
              {isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
            </div>
            <span
              className={cn(
                "absolute -bottom-8 w-32 text-center text-xs font-semibold transition-colors duration-300",
                isCompleted || isCurrent ? "text-blue-700" : "text-slate-400"
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineStepper;
