import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, UserPlus, ArrowRight, ArrowLeft, Mail, Phone, Calendar, GraduationCap, Briefcase, FileText, Lock, AlertCircle, Copy, Check, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from './Modal';
import { SearchableSelect } from './SearchableSelect';

interface InviteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EDUCATION_OPTIONS = [
  "High School Diploma / Secondary Education",
  "Bachelor's Degree (B.Com / B.A. / B.Sc / B.Tech)",
  "Master's Degree (M.Com / MBA / M.Sc / M.Tech)",
  "Doctorate / Ph.D.",
  "Professional Certification (CA / CS / CFA / CFP)",
  "Diploma / Vocational Certificate",
];

export const InviteAgentModal: React.FC<InviteAgentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [agentType, setAgentType] = useState<'LOAN_AGENT' | 'INSURANCE_AGENT' | 'INVESTMENT_AGENT'>('LOAN_AGENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(''); // Optional!
  const [dob, setDob] = useState('');
  const [education, setEducation] = useState(EDUCATION_OPTIONS[1]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Experience State
  const [hasExperience, setHasExperience] = useState<boolean>(false);
  const [previousCompany, setPreviousCompany] = useState('');
  const [previousJobRole, setPreviousJobRole] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [previousJobStartDate, setPreviousJobStartDate] = useState('');
  const [previousJobEndDate, setPreviousJobEndDate] = useState('');

  // Documents State
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState('https://storage.greetwell.com/docs/aadhaar_default.pdf');
  const [educationDocUrl, setEducationDocUrl] = useState('');
  const [experienceDocUrl, setExperienceDocUrl] = useState('');
  const [otherDocUrl, setOtherDocUrl] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState('');

  // Success Result State
  const [createdResult, setCreatedResult] = useState<{
    agentIdCode: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
    token: string;
    emailOtp: string;
    mobileOtp: string;
  } | null>(null);

  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
      setApiError('');
      setCreatedResult(null);
      setAgentType('LOAN_AGENT');
      setFirstName('');
      setLastName('');
      setDob('');
      setEducation(EDUCATION_OPTIONS[1]);
      setEmail('');
      setPhone('');
      setHasExperience(false);
      setPreviousCompany('');
      setPreviousJobRole('');
      setYearsOfExperience('');
      setPreviousJobStartDate('');
      setPreviousJobEndDate('');
      setAadhaarDocUrl('https://storage.greetwell.com/docs/aadhaar_default.pdf');
      setEducationDocUrl('');
      setExperienceDocUrl('');
      setOtherDocUrl('');
    }
  }, [isOpen]);

  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};

    if (!firstName.trim()) errs.firstName = 'First Name is mandatory.';
    if (!dob) errs.dob = 'Date of Birth is mandatory.';
    if (!education.trim()) errs.education = 'Highest Education is mandatory.';

    if (!email.trim()) {
      errs.email = 'Email Address is mandatory.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      errs.phone = 'Mobile Phone Number is mandatory.';
    } else if (phone.trim().replace(/\D/g, '').length < 7) {
      errs.phone = 'Please enter a valid phone number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: { [key: string]: string } = {};

    if (hasExperience) {
      if (!previousCompany.trim()) errs.previousCompany = 'Previous Company Name is required when experience is selected.';
      if (!previousJobRole.trim()) errs.previousJobRole = 'Previous Job Role is required when experience is selected.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: { [key: string]: string } = {};

    if (!aadhaarDocUrl || !aadhaarDocUrl.trim()) {
      errs.aadhaarDocUrl = 'Aadhaar Document is mandatory.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) setStep(3);
  };

  const handleSendAgentInvitation = async () => {
    if (!validateStep3()) return;

    setSending(true);
    setApiError('');

    try {
      const payload = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim() ? lastName.trim() : undefined,
        phone: phone.trim(),
        agentType,
        dob,
        education: education.trim(),
        aadhaarDocUrl: aadhaarDocUrl.trim(),
        hasExperience,
        previousCompany: hasExperience ? previousCompany.trim() : undefined,
        previousJobRole: hasExperience ? previousJobRole.trim() : undefined,
        yearsOfExperience: hasExperience ? yearsOfExperience.trim() : undefined,
        previousJobStartDate: hasExperience && previousJobStartDate ? previousJobStartDate : undefined,
        previousJobEndDate: hasExperience && previousJobEndDate ? previousJobEndDate : undefined,
        educationDocUrl: educationDocUrl.trim() ? educationDocUrl.trim() : undefined,
        experienceDocUrl: experienceDocUrl.trim() ? experienceDocUrl.trim() : undefined,
        otherDocUrl: otherDocUrl.trim() ? otherDocUrl.trim() : undefined,
      };

      const res = await api.post('/users/create-agent', payload);

      if (res.data.success) {
        setCreatedResult(res.data.data);
        setStep(4);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to dispatch agent invitation. Please verify details and try again.');
    } finally {
      setSending(false);
    }
  };

  const copyInviteUrl = () => {
    if (createdResult?.token) {
      const url = `${window.location.origin}/invite/${createdResult.token}`;
      navigator.clipboard.writeText(url);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Super Admin – Invite Financial Agent">
      <div className="space-y-5 font-sans">
        {/* Step Indicator Bar */}
        {step < 4 && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
              <span className={step === 1 ? 'text-emerald-700 font-black' : step > 1 ? 'text-blue-600' : ''}>
                1. Role & Details
              </span>
              <span className="text-slate-300">•</span>
              <span className={step === 2 ? 'text-emerald-700 font-black' : step > 2 ? 'text-blue-600' : ''}>
                2. Experience
              </span>
              <span className="text-slate-300">•</span>
              <span className={step === 3 ? 'text-emerald-700 font-black' : ''}>
                3. Documents & Send
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0c5837] h-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* STEP 1: AGENT ROLE & MANDATORY PERSONAL DETAILS */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Agent Role & Personal Info</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select pre-assigned agent role and fill mandatory personal details.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Designated Agent Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'LOAN_AGENT', label: 'Loan Agent', desc: 'Loans Desk' },
                  { id: 'INSURANCE_AGENT', label: 'Insurance Agent', desc: 'Insurance Desk' },
                  { id: 'INVESTMENT_AGENT', label: 'Investment Agent', desc: 'Investments Desk' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAgentType(r.id as any)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      agentType === r.id
                        ? 'border-[#0c5837] bg-emerald-50 text-[#0c5837] ring-2 ring-[#0c5837]/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="text-xs">{r.label}</p>
                    <p className="text-[10px] font-normal text-slate-500 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  placeholder="First Name"
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0c5837] ${
                    errors.firstName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {errors.firstName && <p className="text-[11px] text-rose-600 mt-0.5">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name (Optional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0c5837]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (errors.dob) setErrors({ ...errors, dob: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0c5837] ${
                    errors.dob ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {errors.dob && <p className="text-[11px] text-rose-600 mt-0.5">{errors.dob}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Highest Education <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={EDUCATION_OPTIONS.map((edu) => ({ value: edu, label: edu }))}
                  value={education}
                  onChange={setEducation}
                  placeholder="Select education qualification..."
                  searchPlaceholder="Search education..."
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="agent@greetwell.com"
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0c5837] ${
                    errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-rose-600 mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#0c5837] ${
                    errors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {errors.phone && <p className="text-[11px] text-rose-600 mt-0.5">{errors.phone}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextToStep2}
                className="px-4 py-2 bg-[#0c5837] text-white text-xs font-bold rounded-lg hover:bg-[#09432a] flex items-center gap-1.5"
              >
                Next: Experience <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WORK EXPERIENCE (OPTIONAL TOGGLE) */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Work Experience Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Capture previous financial sector employment history if applicable.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-bold text-slate-800">
                Do you have previous work experience?
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hasExperience"
                    checked={hasExperience === true}
                    onChange={() => setHasExperience(true)}
                    className="h-4 w-4 text-[#0c5837] focus:ring-[#0c5837]"
                  />
                  Yes, I have previous work experience
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hasExperience"
                    checked={hasExperience === false}
                    onChange={() => setHasExperience(false)}
                    className="h-4 w-4 text-[#0c5837] focus:ring-[#0c5837]"
                  />
                  No, I am a fresher
                </label>
              </div>
            </div>

            {/* Conditional Fields if Yes */}
            {hasExperience ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Previous Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={previousCompany}
                      onChange={(e) => setPreviousCompany(e.target.value)}
                      placeholder="e.g., HDFC Bank / ICICI Prudential"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                    {errors.previousCompany && <p className="text-[11px] text-rose-600 mt-0.5">{errors.previousCompany}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Previous Job Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={previousJobRole}
                      onChange={(e) => setPreviousJobRole(e.target.value)}
                      placeholder="e.g., Senior Loan Relationship Manager"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                    {errors.previousJobRole && <p className="text-[11px] text-rose-600 mt-0.5">{errors.previousJobRole}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Years of Experience</label>
                    <input
                      type="text"
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      placeholder="e.g., 3.5 Years"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={previousJobStartDate}
                      onChange={(e) => setPreviousJobStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={previousJobEndDate}
                      onChange={(e) => setPreviousJobEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-lg text-slate-500 text-xs italic">
                Work experience fields are hidden because "No" was selected.
              </div>
            )}

            <div className="flex justify-between gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextToStep3}
                className="px-4 py-2 bg-[#0c5837] text-white text-xs font-bold rounded-lg hover:bg-[#09432a] flex items-center gap-1.5"
              >
                Next: Documents <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DOCUMENTS & INVITATION SUMMARY */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Documents & Final Dispatch</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach mandatory Aadhaar document and optional certificates.
              </p>
            </div>

            {apiError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Mandatory Aadhaar */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Aadhaar Document Attachment <span className="text-rose-500">* (Mandatory)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aadhaarDocUrl}
                    onChange={(e) => {
                      setAadhaarDocUrl(e.target.value);
                      if (errors.aadhaarDocUrl) setErrors({ ...errors, aadhaarDocUrl: '' });
                    }}
                    placeholder="https://storage.greetwell.com/docs/aadhaar.pdf"
                    className={`flex-1 px-3 py-2 border rounded-lg text-xs font-mono ${
                      errors.aadhaarDocUrl ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setAadhaarDocUrl(`https://storage.greetwell.com/docs/aadhaar_${Date.now()}.pdf`)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border rounded-lg font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <Upload className="h-3.5 w-3.5" /> Attached
                  </button>
                </div>
                {errors.aadhaarDocUrl && <p className="text-[11px] text-rose-600 mt-0.5">{errors.aadhaarDocUrl}</p>}
              </div>

              {/* Optional Documents */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Optional Certificates & Supporting Docs (Will not block invitation)
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500">Educational Certificate (Optional)</span>
                    <input
                      type="text"
                      value={educationDocUrl}
                      onChange={(e) => setEducationDocUrl(e.target.value)}
                      placeholder="Doc URL or file link (Optional)"
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs font-mono bg-white mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Experience Certificate (Optional)</span>
                    <input
                      type="text"
                      value={experienceDocUrl}
                      onChange={(e) => setExperienceDocUrl(e.target.value)}
                      placeholder="Doc URL or file link (Optional)"
                      className="w-full px-2.5 py-1.5 border rounded-md text-xs font-mono bg-white mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-emerald-950/5 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="font-mono text-emerald-800 font-extrabold text-[11px] uppercase">
                    Generated Agent ID Preview:
                  </span>
                  <span className="font-mono font-black text-[#0c5837] text-sm">AGT-2026-XXXXXX</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <p>Agent Name: <strong className="text-slate-900">{firstName} {lastName}</strong></p>
                  <p>Role: <strong className="text-[#0c5837] uppercase">{agentType.replace('_', ' ')}</strong></p>
                  <p>Email: <strong className="text-slate-900">{email}</strong></p>
                  <p>Mobile: <strong className="text-slate-900">{phone}</strong></p>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-3 border-t">
              <button
                type="button"
                disabled={sending}
                onClick={() => setStep(2)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back to Experience
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSendAgentInvitation}
                className="px-5 py-2.5 bg-[#0c5837] hover:bg-[#084229] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating Agent ID & Dispatching OTP...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Confirm & Send Agent Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS RESULT MODAL */}
        {step === 4 && createdResult && (
          <div className="space-y-4 text-center py-2">
            <div className="h-14 w-14 bg-emerald-100 text-[#0c5837] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-extrabold text-[11px] uppercase tracking-wider">
                Agent Invitation Dispatched
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                Agent Account Onboarded!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Branded GFS invitation email sent to <strong>{createdResult.email}</strong>.
              </p>
            </div>

            {/* Agent ID Highlight Card */}
            <div className="bg-[#091526] text-white rounded-xl p-4 max-w-sm mx-auto shadow-md space-y-2">
              <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">
                Assigned GFS Agent ID
              </p>
              <p className="text-2xl font-black text-emerald-300 font-mono tracking-wider">
                {createdResult.agentIdCode}
              </p>
              <p className="text-[11px] text-slate-300 font-bold uppercase">
                {createdResult.role.replace(/_/g, ' ')}
              </p>
            </div>

            {/* OTP Security Code Preview Helper */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 max-w-sm mx-auto text-xs text-left space-y-1">
              <div className="font-bold text-[#0c5837] flex items-center justify-between">
                <span>Dispatched Verification Security OTPs:</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-extrabold">30 MINS EXPIRY</span>
              </div>
              <div className="font-mono font-bold text-slate-800 pt-1 flex justify-between">
                <span>Email OTP: <strong className="text-emerald-700">{createdResult.emailOtp}</strong></span>
                <span>Mobile OTP: <strong className="text-blue-700">{createdResult.mobileOtp}</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={copyInviteUrl}
                className="px-4 py-2 border rounded-lg font-semibold text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedToken ? 'URL Copied' : 'Copy Invitation Link'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#0c5837] hover:bg-[#084229] text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
