import React from 'react';
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  submitting: boolean;
  savingDraft?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft?: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  submitting,
  savingDraft = false,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="pt-6 border-t border-[#E2E8F0] flex flex-col-reverse sm:flex-row items-center justify-between gap-3 font-sans">
      {/* Left side: Previous Button */}
      {!isFirstStep ? (
        <button
          type="button"
          onClick={onPrevious}
          disabled={submitting}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#64748B]" />
          <span>Previous Step</span>
        </button>
      ) : (
        <div />
      )}

      {/* Right side: Save Draft & Next / Submit Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {onSaveDraft && !isLastStep && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={submitting || savingDraft}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/70 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-blue-600" />
            <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
          </button>
        )}

        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#1d63ed] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            onClick={onSubmit}
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0E8F6F] hover:bg-emerald-700 text-white font-black text-sm sm:text-base transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Application Now</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
