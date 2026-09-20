import React from 'react';
import { Check } from 'lucide-react';
import { WizardStepMeta } from '../../config/wizardConfig';

interface StepProgressProps {
  steps: WizardStepMeta[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (stepId: number) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs font-sans">
      <div className="flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar pb-1">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step Pill Button */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable && !isCurrent}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  isClickable ? 'cursor-pointer hover:bg-slate-50' : isCurrent ? 'bg-blue-50/80 border border-blue-200' : 'opacity-70'
                }`}
              >
                {/* Status Indicator Circle */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-[#1d63ed] text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-blue-500/20 ring-2 ring-blue-200">
                      {step.id}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs">
                      {step.id}
                    </div>
                  )}
                </div>

                {/* Step Titles */}
                <div className="text-left min-w-0">
                  <div className="text-[9.5px] font-extrabold tracking-wider text-[#94A3B8] uppercase leading-none">
                    STEP {step.id}
                  </div>
                  <div
                    className={`text-xs font-extrabold truncate mt-0.5 max-w-[110px] sm:max-w-[140px] ${
                      isCurrent
                        ? 'text-[#1d63ed]'
                        : isCompleted
                        ? 'text-[#0F172A]'
                        : 'text-[#64748B]'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              </button>

              {/* Horizontal Connecting Line */}
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 min-w-[20px] transition-colors duration-300 rounded-full ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
