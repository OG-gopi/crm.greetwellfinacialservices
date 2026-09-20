import React from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { WizardStepMeta } from '../../config/wizardConfig';

interface StepSidebarProps {
  steps: WizardStepMeta[];
  currentStep: number;
  completedSteps: number[];
  errorSteps: number[];
  onStepClick: (stepId: number) => void;
}

export const StepSidebar: React.FC<StepSidebarProps> = ({
  steps,
  currentStep,
  completedSteps,
  errorSteps,
  onStepClick,
}) => {
  return (
    <aside className="w-full lg:w-72 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm flex flex-col shrink-0 font-sans">
      {/* Header Branding (Pinned Top) */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#E2E8F0] shrink-0">
        <div className="w-9 h-9 rounded-2xl bg-[#1d63ed] text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/20">
          GFS
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-[#0F172A] tracking-tight">Application Wizard</h3>
          <p className="text-[11px] text-[#64748B] font-medium">Greetwell Financial Services</p>
        </div>
      </div>

      {/* Vertical Stepper List */}
      <div className="space-y-0.5">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isPending = !isCompleted && !isCurrent;
          const hasError = errorSteps.includes(step.id);
          const StepIcon = step.icon;

          const isClickable = isCompleted || step.id < currentStep;

          return (
            <div key={step.id} className="relative flex items-start group">
              {/* Vertical Connector Line */}
              {!isLast && (
                <div
                  className={`absolute left-5 top-10 bottom-0 w-0.5 transition-colors duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Step Item Button */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable && !isCurrent}
                className={`w-full flex items-start gap-3.5 py-3 px-2.5 rounded-2xl transition-all text-left ${
                  isClickable
                    ? 'cursor-pointer hover:bg-slate-50'
                    : isCurrent
                    ? 'cursor-default bg-blue-50/50'
                    : 'cursor-not-allowed opacity-80'
                } ${hasError ? 'ring-2 ring-rose-500/40 bg-rose-50/40' : ''}`}
              >
                {/* Circular Step Icon */}
                <div className="relative z-10 shrink-0">
                  {isCompleted ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 animate-in zoom-in-75">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-9 h-9 rounded-full bg-[#1d63ed] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-blue-100">
                      <StepIcon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  ) : hasError ? (
                    <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                      <span className="font-extrabold text-xs">!</span>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs">
                      {step.id}
                    </div>
                  )}
                </div>

                {/* Step Text Labels & Badges */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold tracking-wider text-[#94A3B8] uppercase">
                      STEP {step.id}
                    </span>
                    {isCompleted && (
                      <span className="text-[9px] font-extrabold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                        Completed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] font-extrabold text-[#1d63ed] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 animate-pulse">
                        In Progress
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[9px] font-medium text-slate-400">
                        Pending
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-xs sm:text-sm font-extrabold truncate mt-0.5 ${
                      isCurrent
                        ? 'text-[#1d63ed]'
                        : isCompleted
                        ? 'text-[#0F172A]'
                        : 'text-[#64748B]'
                    }`}
                  >
                    {step.title}
                  </h4>

                  <p className="text-[11px] text-[#94A3B8] truncate leading-tight mt-0.5">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Support Card Footer (Pinned Bottom) */}
      <div className="mt-4 pt-3.5 border-t border-[#E2E8F0] bg-slate-50/80 rounded-2xl p-3.5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-slate-500 flex items-center justify-center shrink-0 shadow-2xs">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#0F172A]">Need Help?</div>
          <div className="text-[11px] text-[#64748B] truncate">Contact GFS Support</div>
        </div>
      </div>
    </aside>
  );
};
