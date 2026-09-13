import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, UserPlus, ArrowRight, ArrowLeft, Mail, Phone, User as UserIcon, Lock, Building2, Check, AlertCircle, Copy } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';

interface InviteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SERVICE_OPTIONS = [
  { id: 'LOANS', name: 'Loan Services', description: 'Personal, Business, & Mortgage Loans', icon: '💰' },
  { id: 'INSURANCE', name: 'Insurance Services', description: 'Life, Health, Property & General Insurance', icon: '🛡️' },
  { id: 'INVESTMENT', name: 'Investment Services', description: 'Wealth Management & Portfolio Solutions', icon: '📈' },
];

export const InviteCustomerModal: React.FC<InviteCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState('');

  // Result state
  const [createdResult, setCreatedResult] = useState<{
    customerIdCode: string;
    email: string;
    firstName: string;
    lastName: string;
    serviceTypes: string[];
  } | null>(null);

  const [copiedToken, setCopiedToken] = useState(false);

  // Initialize service defaults based on agent role
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
      setApiError('');
      setCreatedResult(null);

      if (user?.role === 'LOAN_AGENT') {
        setSelectedServices(['LOANS']);
      } else if (user?.role === 'INSURANCE_AGENT') {
        setSelectedServices(['INSURANCE']);
      } else if (user?.role === 'INVESTMENT_AGENT') {
        setSelectedServices(['INVESTMENT']);
      } else {
        // Super admin defaults to Loans selected
        setSelectedServices(['LOANS']);
      }
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
    }
  }, [isOpen, user?.role]);

  const isRoleRestricted =
    user?.role === 'LOAN_AGENT' ||
    user?.role === 'INSURANCE_AGENT' ||
    user?.role === 'INVESTMENT_AGENT';

  const handleToggleService = (serviceId: string) => {
    if (isRoleRestricted) return; // Agents restricted to their assigned domain

    if (selectedServices.includes(serviceId)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== serviceId));
      }
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const validateStep1 = () => {
    if (selectedServices.length === 0) {
      setErrors({ services: 'Please select at least one service for the customer.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const errs: { [key: string]: string } = {};
    if (!firstName.trim()) errs.firstName = 'First Name is required.';
    
    if (!email.trim()) {
      errs.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      errs.phone = 'Mobile Phone Number is required.';
    } else if (phone.trim().replace(/\D/g, '').length < 7) {
      errs.phone = 'Please enter a valid mobile phone number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleSendInvitation = async () => {
    setSending(true);
    setApiError('');
    try {
      const res = await api.post('/users/invite-customer', {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        serviceTypes: selectedServices,
      });

      if (res.data.success) {
        const invData = res.data.data;
        setCreatedResult({
          customerIdCode: invData.customerIdCode || 'CUS-2026-000000',
          email: invData.email || email,
          firstName: invData.firstName || firstName,
          lastName: invData.lastName || lastName,
          serviceTypes: invData.serviceTypes || selectedServices,
        });
        setStep(4);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to send customer invitation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyId = () => {
    if (createdResult?.customerIdCode) {
      navigator.clipboard.writeText(createdResult.customerIdCode);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Onboarding & Invitation">
      <div className="space-y-5">
        {/* Step Indicator Header */}
        {step < 4 && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span className={step === 1 ? 'text-blue-600 font-extrabold' : step > 1 ? 'text-emerald-600' : ''}>
                1. Select Services
              </span>
              <span className="text-slate-300">•</span>
              <span className={step === 2 ? 'text-blue-600 font-extrabold' : step > 2 ? 'text-emerald-600' : ''}>
                2. Customer Details
              </span>
              <span className="text-slate-300">•</span>
              <span className={step === 3 ? 'text-blue-600 font-extrabold' : ''}>
                3. Review & Invite
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* STEP 1: SERVICE SELECTION */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Customer Interested Services</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the financial service offering(s) for this customer invitation.
              </p>
            </div>

            {isRoleRestricted && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  As a <strong>{user?.role.replace('_', ' ')}</strong>, your invitation is pre-assigned to your specialized service scope.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {SERVICE_OPTIONS.map((srv) => {
                const isSelected = selectedServices.includes(srv.id);
                return (
                  <div
                    key={srv.id}
                    onClick={() => handleToggleService(srv.id)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    } ${isRoleRestricted && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{srv.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{srv.name}</p>
                        <p className="text-[11px] text-slate-500">{srv.description}</p>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.services && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.services}
              </p>
            )}

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
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 flex items-center gap-1.5"
              >
                Next: Customer Info <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CUSTOMER DETAILS FORM */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Contact Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide customer contact details to pre-register profile & send security invite.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors({ ...errors, firstName: '' });
                    }}
                    placeholder="John"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 ${
                      errors.firstName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.firstName && <p className="text-[11px] text-rose-600 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe (Optional)"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="john.doe@example.com"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mobile Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="+1 (555) 234-5678"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
            </div>

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
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 flex items-center gap-1.5"
              >
                Next: Review <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & INVITATION SUMMARY */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Review Invitation Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify customer profile & service assignments before dispatching email invitation.
              </p>
            </div>

            {apiError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    Customer ID Preview
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">CUS-2026-XXXXXX</p>
                  <p className="text-[11px] text-slate-500">Auto-generated sequential GFS customer identifier</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    72 Hours Expiry
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Full Name</p>
                  <p className="font-bold text-slate-900">{firstName} {lastName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Email Address</p>
                  <p className="font-bold text-slate-900">{email}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Phone Number</p>
                  <p className="font-bold text-slate-900">{phone}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Invited By</p>
                  <p className="font-bold text-slate-900">
                    {user?.firstName} {user?.lastName} ({user?.role.replace('_', ' ')})
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Assigned Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedServices.map((srv) => (
                    <span
                      key={srv}
                      className="px-2.5 py-1 bg-blue-600 text-white font-bold text-[10px] rounded-md uppercase tracking-wider"
                    >
                      {srv}
                    </span>
                  ))}
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
                Edit Details
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSendInvitation}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating Customer ID & Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Confirm & Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS RESULT MODAL */}
        {step === 4 && createdResult && (
          <div className="space-y-4 text-center py-2">
            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-extrabold text-[11px] uppercase tracking-wider">
                Invitation Sent Successfully
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                Customer Onboarded!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Branded GFS invitation email delivered to <strong>{createdResult.email}</strong>.
              </p>
            </div>

            {/* Generated Customer ID Highlight Box */}
            <div className="bg-slate-900 text-white rounded-xl p-4 max-w-sm mx-auto shadow-md space-y-2">
              <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">
                Assigned GFS Customer ID
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black text-amber-300 font-mono tracking-wider">
                  {createdResult.customerIdCode}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 hover:bg-slate-800 rounded-md text-slate-300 hover:text-white transition-colors"
                  title="Copy Customer ID"
                >
                  {copiedToken ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Customer: <strong>{createdResult.firstName} {createdResult.lastName}</strong>
              </p>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 max-w-sm mx-auto">
              <p className="font-semibold text-slate-700">Next Steps for Customer:</p>
              <p className="mt-1">
                Customer can click the secure email link (expires in 72 hours) to verify identity, set password, and access their Customer Portal.
              </p>
            </div>

            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Done / Return to Directory
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
