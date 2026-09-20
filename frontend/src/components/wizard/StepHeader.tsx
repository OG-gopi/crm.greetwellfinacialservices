import React from 'react';
import { WizardStepMeta } from '../../config/wizardConfig';

interface StepHeaderProps {
  step: WizardStepMeta;
  totalSteps: number;
}

export const StepHeader: React.FC<StepHeaderProps> = ({ step, totalSteps }) => {
  const StepIcon = step.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-3">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1d63ed] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
          <StepIcon className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <span className="text-[11px] font-extrabold text-[#1d63ed] uppercase tracking-wider">
            Step {step.id} of {totalSteps}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight mt-0.5">
            {step.title}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            {step.subtitle}
          </p>
        </div>
      </div>
      <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100/80 border border-[#E2E8F0] text-xs font-bold text-[#64748B] font-mono">
        Progress: {Math.round((step.id / totalSteps) * 100)}%
      </div>
    </div>
  );
};
