import React from 'react';
import { UserCheck, Coins, FileText, Edit3, CheckCircle2 } from 'lucide-react';
import { ApplicationType } from '../../types';

interface StepSummaryProps {
  deskId: ApplicationType;
  selectedProduct: { id: string; name: string; sub: string; docs: string[] };
  customerName: string;
  email: string;
  phone: string;
  amount: string;
  term: string;
  purpose: string;
  formData: Record<string, any>;
  uploadedDocs: Array<{ type: string; name: string; size: number }>;
  onGoToStep: (stepId: number) => void;
}

export const StepSummary: React.FC<StepSummaryProps> = ({
  deskId,
  selectedProduct,
  customerName,
  email,
  phone,
  amount,
  term,
  purpose,
  formData,
  uploadedDocs,
  onGoToStep,
}) => {
  return (
    <div className="space-y-6 font-sans">
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-extrabold block">All Steps Validated & Ready</span>
          <span className="text-emerald-800 text-[11.5px]">
            Please review the application details below before final submission to Greetwell Financial Services.
          </span>
        </div>
      </div>

      {/* Section 1: Product & Applicant Info */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#1d63ed]" />
            <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
              1. Applicant & Desk Info
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#1d63ed] bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#64748B] block font-medium">Selected Desk</span>
            <span className="font-bold text-[#0F172A] text-sm">
              {deskId === 'LOAN' ? 'Loans Desk' : deskId === 'INSURANCE' ? 'Insurance Desk' : 'Investments & Chit Desk'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Product Category</span>
            <span className="font-bold text-[#1d63ed] text-sm">{selectedProduct.name}</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Full Name (PAN)</span>
            <span className="font-bold text-[#0F172A]">{customerName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Mobile Phone</span>
            <span className="font-bold text-[#0F172A] font-mono">{phone || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Email Address</span>
            <span className="font-bold text-[#0F172A]">{email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">PAN Number</span>
            <span className="font-bold text-[#0F172A] font-mono uppercase">{formData.panNumber || 'Not Specified'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">City / Pincode</span>
            <span className="font-bold text-[#0F172A]">{formData.cityPincode || 'Not Specified'}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Financial Details */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#0E8F6F]" />
            <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
              2. {selectedProduct.name} Financial Profile
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#0E8F6F] bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#64748B] block font-medium">
              {deskId === 'LOAN' ? 'Requested Loan Amount' : deskId === 'INSURANCE' ? 'Sum Assured Needed' : 'Investment Value'}
            </span>
            <span className="font-black text-emerald-700 text-base">
              ₹{amount ? Number(amount).toLocaleString('en-IN') : '0'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Tenure / Duration</span>
            <span className="font-bold text-[#0F172A]">{term}</span>
          </div>

          {deskId === 'LOAN' && (
            <>
              <div>
                <span className="text-[#64748B] block font-medium">Monthly Income</span>
                <span className="font-bold text-[#0F172A]">₹{formData.monthlyIncome ? Number(formData.monthlyIncome).toLocaleString('en-IN') : 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Employment Type</span>
                <span className="font-bold text-[#0F172A]">{formData.employmentStatus || 'Salaried'}</span>
              </div>
            </>
          )}

          {deskId === 'INSURANCE' && (
            <>
              <div>
                <span className="text-[#64748B] block font-medium">Nominee Name</span>
                <span className="font-bold text-[#0F172A]">{formData.nomineeName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Nominee Relation</span>
                <span className="font-bold text-[#0F172A]">{formData.nomineeRelation || 'N/A'}</span>
              </div>
            </>
          )}

          {purpose && (
            <div className="sm:col-span-2">
              <span className="text-[#64748B] block font-medium">Application Notes / Purpose</span>
              <span className="font-medium text-[#0F172A] italic">{purpose}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Uploaded Documents */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
              3. Uploaded Document Files
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer border border-purple-200"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Section
          </button>
        </div>

        <div className="space-y-2">
          {selectedProduct.docs.map((docTitle) => {
            const doc = uploadedDocs.find((d) => d.type === docTitle);
            return (
              <div
                key={docTitle}
                className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${doc ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {doc ? <CheckCircle2 className="w-4 h-4" /> : <span className="font-bold">?</span>}
                  </div>
                  <span className="font-bold text-[#0F172A]">{docTitle}</span>
                </div>
                {doc ? (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    ✓ {doc.name} ({doc.size} KB)
                  </span>
                ) : (
                  <span className="font-medium text-slate-400">Optional / Not Uploaded</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
