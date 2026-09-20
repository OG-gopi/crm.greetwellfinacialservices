import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  UserCheck,
  FileText,
  Upload,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { ApplicationType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SearchableSelect } from '../common/SearchableSelect';
import { DESKS, WIZARD_STEPS, ProductItem } from '../../config/wizardConfig';
import { StepSidebar } from './StepSidebar';
import { StepProgress } from './StepProgress';
import { StepHeader } from './StepHeader';
import { StepNavigation } from './StepNavigation';
import { StepSummary } from './StepSummary';

interface ApplicationWizardProps {
  forcedType?: ApplicationType;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({ forcedType }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const agentRoleDomain: ApplicationType | null =
    user?.role === 'LOAN_AGENT' ? 'LOAN' : user?.role === 'INSURANCE_AGENT' ? 'INSURANCE' : user?.role === 'INVESTMENT_AGENT' ? 'INVESTMENT' : null;

  const urlType = searchParams.get('type');
  const initialType: ApplicationType = forcedType
    ? forcedType
    : agentRoleDomain
    ? agentRoleDomain
    : urlType === 'INSURANCE'
    ? 'INSURANCE'
    : urlType === 'INVESTMENT'
    ? 'INVESTMENT'
    : 'LOAN';

  const [deskId, setDeskId] = useState<ApplicationType>(initialType);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(
    DESKS[initialType].products[0]
  );

  // Wizard Step State (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errorSteps, setErrorSteps] = useState<number[]>([]);

  // Staff Target Customer Selection
  const isStaffRole = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user?.role || '');
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
  const [isLockedFromUrl, setIsLockedFromUrl] = useState<boolean>(false);

  // Form Field State
  const [customerName, setCustomerName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('36 Months');
  const [purpose, setPurpose] = useState('');

  const [formData, setFormData] = useState<Record<string, any>>({
    employmentStatus: 'Salaried',
    monthlyIncome: '45000',
    cityPincode: '',
    panNumber: '',
    dob: '',
    nomineeName: '',
    nomineeRelation: 'Spouse',
    chitGroupValue: '₹1,00,000 group',
    contributionFrequency: 'Monthly',
  });

  const [uploadedDocs, setUploadedDocs] = useState<Array<{ type: string; name: string; fileUrl: string; size: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [successAppId, setSuccessAppId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync Agent Domain
  useEffect(() => {
    if (agentRoleDomain && deskId !== agentRoleDomain) {
      setDeskId(agentRoleDomain);
      setSelectedProduct(DESKS[agentRoleDomain].products[0]);
    }
  }, [agentRoleDomain]);

  // Fetch Customers List for Staff Roles
  useEffect(() => {
    if (isStaffRole) {
      setLoadingCustomers(true);
      api.get('/users?role=CUSTOMER&limit=500')
        .then((res) => {
          if (res.data.success) {
            const list = res.data.data || [];
            setCustomersList(list);

            const paramCusId = searchParams.get('customerId') || searchParams.get('customerIdCode') || searchParams.get('email');
            let initialCus = list.find((c: any) => c.id === paramCusId || c.customerIdCode === paramCusId || c.email === paramCusId);

            if (initialCus) {
              setIsLockedFromUrl(true);
            } else if (list.length > 0) {
              initialCus = list[0];
            }

            if (initialCus) {
              setSelectedCustomerId(initialCus.id);
              setCustomerName(`${initialCus.firstName || ''} ${initialCus.lastName || ''}`.trim());
              setEmail(initialCus.email || '');
              setPhone(initialCus.phone || '');
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoadingCustomers(false));
    }
  }, [user?.role]);

  const handleCustomerSelectChange = (cusId: string) => {
    setSelectedCustomerId(cusId);
    const selectedCus = customersList.find((c) => c.id === cusId);
    if (selectedCus) {
      setCustomerName(`${selectedCus.firstName || ''} ${selectedCus.lastName || ''}`.trim());
      setEmail(selectedCus.email || '');
      setPhone(selectedCus.phone || '');
    }
  };

  const handleDeskChange = (type: ApplicationType) => {
    setDeskId(type);
    setSelectedProduct(DESKS[type].products[0]);
  };

  const validateMobileInput = (val: string) => {
    setPhone(val);
    if (!val.trim()) {
      setPhoneError('Mobile number is required.');
      return false;
    }
    const clean = val.replace(/^\+/, '').replace(/\s+/g, '');
    if (!/^\d+$/.test(clean) || clean.length < 10 || clean.length > 12) {
      setPhoneError('Please enter a valid Indian mobile number using 10–12 digits.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleFileUpload = (docTitle: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc = {
        type: docTitle,
        name: file.name,
        fileUrl: URL.createObjectURL(file),
        size: Math.round(file.size / 1024),
      };
      setUploadedDocs((prev) => [...prev.filter((d) => d.type !== docTitle), newDoc]);
    }
  };

  // Validate active step before proceeding to next
  const validateStep = (stepId: number): boolean => {
    const errors: Record<string, string> = {};
    setError('');

    if (stepId === 1) {
      if (isStaffRole && !selectedCustomerId) {
        errors.customer = 'Please select a target customer account.';
      }
    } else if (stepId === 2) {
      if (!customerName.trim()) {
        errors.customerName = 'Full Name is required.';
      }
      if (!validateMobileInput(phone)) {
        errors.phone = 'Valid 10–12 digit mobile number is required.';
      }
    } else if (stepId === 3) {
      if (!amount || parseFloat(amount) <= 0) {
        errors.amount = 'Please enter a valid positive amount.';
      }
    }

    setStepErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      setErrorSteps((prev) => Array.from(new Set([...prev, stepId])));
      return false;
    }

    setErrorSteps((prev) => prev.filter((id) => id !== stepId));
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => Array.from(new Set([...prev, currentStep])));
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepId: number) => {
    if (completedSteps.includes(stepId) || stepId < currentStep) {
      setCurrentStep(stepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Save Progress Draft functionality
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setError('');
    try {
      const payload = {
        type: deskId,
        customerId: isStaffRole ? selectedCustomerId : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        term,
        purpose: purpose || `${selectedProduct.name} Draft Application`,
        formData: {
          productType: selectedProduct.name,
          customerName,
          email,
          phone,
          isDraft: true,
          ...formData,
        },
        documents: uploadedDocs,
      };

      const res = await api.post('/applications', payload);
      if (res.data.success) {
        setCompletedSteps((prev) => Array.from(new Set([...prev, currentStep])));
        alert('Application draft saved successfully. You can resume at any time.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save application draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all steps before submission
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: deskId,
        customerId: isStaffRole ? selectedCustomerId : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        term,
        purpose: purpose || `${selectedProduct.name} Application`,
        formData: {
          productType: selectedProduct.name,
          customerName,
          email,
          phone,
          ...formData,
        },
        documents: uploadedDocs,
      };

      const res = await api.post('/applications', payload);
      if (res.data.success) {
        setSuccessAppId(res.data.data.idCode || res.data.data.id || 'APP-RECEIVED');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application. Please check form inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferenceCode = () => {
    if (successAppId) {
      navigator.clipboard.writeText(successAppId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getMyAppsRoute = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN': return '/superadmin/applications/all';
      case 'LOAN_AGENT': return '/loan-agent/applications';
      case 'INSURANCE_AGENT': return '/insurance-agent/applications';
      case 'INVESTMENT_AGENT': return '/investment-agent/applications';
      default: return '/customer/applications';
    }
  };

  const stepsMeta = WIZARD_STEPS[deskId];
  const activeStepMeta = stepsMeta.find((s) => s.id === currentStep) || stepsMeta[0];
  const currentDesk = DESKS[deskId];

  // Success Confirmation View
  if (successAppId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 font-sans">
        <div className="bg-white border border-[#E2E7EE] rounded-3xl p-8 sm:p-12 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#0E8F6F] text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-600/30 animate-bounce">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mb-2">
            {selectedProduct.name} Application Submitted!
          </h2>
          <p className="text-sm text-[#64748B] max-w-md mx-auto mb-6 leading-relaxed font-medium">
            Your application details have been registered with our {currentDesk.label} team. An assigned advisor will review your documents and contact you shortly.
          </p>

          <div className="bg-slate-50 border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between max-w-md mx-auto mb-8">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Application ID:</span>
            <span className="font-mono font-black text-base text-[#1d63ed] tracking-wide">{successAppId}</span>
            <button
              onClick={copyReferenceCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0E8F6F] hover:bg-emerald-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(getMyAppsRoute())}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0F172A] text-white font-extrabold text-sm hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
            >
              View Application Status
            </button>
            <button
              onClick={() => {
                setSuccessAppId(null);
                setCurrentStep(1);
                setCompletedSteps([]);
                setAmount('');
                setPurpose('');
                setUploadedDocs([]);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] font-extrabold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Start Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto py-2 sm:py-3 px-2 sm:px-4 font-sans flex flex-col space-y-3 w-full">
      {/* Top Header & Staff Customer Selector */}
      <div className="shrink-0 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              New Application Wizard
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              Complete the 5-step application process for {currentDesk.label}.
            </p>
          </div>
          {user?.role === 'CUSTOMER' && (
            <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant Application Portal</span>
            </div>
          )}
        </div>

        {/* Staff Target Customer Selector Card */}
        {isStaffRole && (
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-2.5 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Target Customer Account (Required for Staff Submission)</span>
              </label>
              {isLockedFromUrl && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Locked from Customer Record
                </span>
              )}
            </div>
            {loadingCustomers ? (
              <div className="text-xs text-slate-500 py-1">Loading Customer Accounts...</div>
            ) : (
              <SearchableSelect
                options={customersList.map((c) => ({
                  value: c.id,
                  label: `${c.firstName || ''} ${c.lastName || ''} (${c.email}) - ID: ${c.customerIdCode || c.id.slice(0, 8)}`,
                }))}
                value={selectedCustomerId}
                onChange={handleCustomerSelectChange}
                placeholder="Search Customer by Name, Email, or Customer ID..."
                disabled={isLockedFromUrl}
              />
            )}
          </div>
        )}
      </div>

      {/* Main Two-Column Review / Wizard Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row items-start gap-5 w-full">
        {/* Left Vertical Stepper Panel (Desktop >= 1024px) */}
        <div className="hidden lg:flex flex-col shrink-0">
          <StepSidebar
            steps={stepsMeta}
            currentStep={currentStep}
            completedSteps={completedSteps}
            errorSteps={errorSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Right Main Review & Form Area Container */}
        <div className="flex-1 w-full flex flex-col min-w-0 space-y-3">
          {/* Form Container Card - Natural vertical flow without internal scrollbar */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 w-full">
            <StepHeader step={activeStepMeta} totalSteps={stepsMeta.length} />

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Desk & Product Selection */}
            {currentStep === 1 && (
              <div className="space-y-6 font-sans">
                {/* Desk Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Select Financial Desk
                    </label>
                    {agentRoleDomain && (
                      <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Domain Locked to {agentRoleDomain === 'LOAN' ? 'Loans' : agentRoleDomain === 'INSURANCE' ? 'Insurance' : 'Investments'} Desk
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(agentRoleDomain ? [agentRoleDomain] : (Object.keys(DESKS) as ApplicationType[])).map((key) => {
                      const desk = DESKS[key];
                      const DeskIcon = desk.icon;
                      const isActive = deskId === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => !agentRoleDomain && handleDeskChange(key)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            agentRoleDomain ? 'cursor-default' : 'cursor-pointer'
                          } flex items-center gap-3 ${
                            isActive
                              ? 'border-[#1d63ed] bg-blue-50/70 shadow-xs'
                              : 'border-[#E2E8F0] bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-[#1d63ed] text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <DeskIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm text-[#0F172A]">{desk.label}</div>
                            <div className="text-[11px] text-[#64748B] truncate">
                              {key === 'LOAN' ? 'Loans' : key === 'INSURANCE' ? 'Policies' : 'Chits & SIP'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Type Grid */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    {currentDesk.typeLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentDesk.products.map((prod) => {
                      const ProdIcon = prod.icon;
                      const isSelected = selectedProduct.id === prod.id;
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedProduct(prod)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#1d63ed] bg-white ring-2 ring-blue-500/20 shadow-sm'
                              : 'border-[#E2E8F0] bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-blue-100 text-[#1d63ed]' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <ProdIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#0F172A] truncate">{prod.name}</div>
                              <div className="text-[11px] text-[#64748B] leading-snug mt-0.5 line-clamp-2">
                                {prod.sub}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Applicant Information */}
            {currentStep === 2 && (
              <div className="space-y-4 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[#64748B]">Full Name (as per PAN Card) *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter full legal name"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none bg-white ${
                        stepErrors.customerName ? 'border-rose-400 focus:border-rose-500' : 'border-[#E2E8F0] focus:border-[#1d63ed]'
                      }`}
                    />
                    {stepErrors.customerName && <span className="text-[11px] text-rose-600 font-semibold">{stepErrors.customerName}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#64748B]">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => validateMobileInput(e.target.value)}
                      placeholder="10-digit mobile number"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none bg-white ${
                        phoneError ? 'border-rose-400 focus:border-rose-500' : 'border-[#E2E8F0] focus:border-[#1d63ed]'
                      }`}
                    />
                    {phoneError && <span className="text-[11px] text-rose-600 font-semibold">{phoneError}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#64748B]">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#64748B]">PAN Card Number</label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white uppercase font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#64748B]">City / Pincode</label>
                    <input
                      type="text"
                      value={formData.cityPincode}
                      onChange={(e) => setFormData({ ...formData, cityPincode: e.target.value })}
                      placeholder="e.g. Hyderabad, 500081"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Financial & Product Details */}
            {currentStep === 3 && (
              <div className="space-y-4 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#64748B]">
                      {deskId === 'LOAN'
                        ? 'Required Loan Amount (₹) *'
                        : deskId === 'INSURANCE'
                        ? 'Sum Assured Needed (₹) *'
                        : 'Investment Amount / Chit Value (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none bg-white font-medium ${
                        stepErrors.amount ? 'border-rose-400 focus:border-rose-500' : 'border-[#E2E8F0] focus:border-[#1d63ed]'
                      }`}
                    />
                    {stepErrors.amount && <span className="text-[11px] text-rose-600 font-semibold">{stepErrors.amount}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#64748B]">Preferred Tenure / Duration</label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white font-medium"
                    >
                      <option value="12 Months">12 Months (1 Year)</option>
                      <option value="24 Months">24 Months (2 Years)</option>
                      <option value="36 Months">36 Months (3 Years)</option>
                      <option value="48 Months">48 Months (4 Years)</option>
                      <option value="60 Months">60 Months (5 Years)</option>
                    </select>
                  </div>

                  {deskId === 'LOAN' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#64748B]">Monthly Net Income (₹)</label>
                        <input
                          type="number"
                          value={formData.monthlyIncome}
                          onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                          placeholder="e.g. 45000"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#64748B]">Employment Type</label>
                        <select
                          value={formData.employmentStatus}
                          onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white"
                        >
                          <option value="Salaried">Salaried Employee</option>
                          <option value="Self-Employed Professional">Self-Employed Professional</option>
                          <option value="Business Owner">Business Owner</option>
                        </select>
                      </div>
                    </>
                  )}

                  {deskId === 'INSURANCE' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#64748B]">Nominee Full Name</label>
                        <input
                          type="text"
                          value={formData.nomineeName}
                          onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                          placeholder="Nominee Name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#64748B]">Relation with Nominee</label>
                        <select
                          value={formData.nomineeRelation}
                          onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Child">Child</option>
                          <option value="Sibling">Sibling</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[#64748B]">Application Notes / Purpose</label>
                    <textarea
                      rows={2}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Optional notes regarding this application..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1d63ed] bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Required Documents */}
            {currentStep === 4 && (
              <div className="space-y-4 font-sans">
                <p className="text-xs text-[#64748B] font-medium">
                  Please upload the required verification document files for <strong>{selectedProduct.name}</strong>.
                </p>

                <div className="space-y-2.5">
                  {selectedProduct.docs.map((docTitle) => {
                    const uploaded = uploadedDocs.find((d) => d.type === docTitle);
                    return (
                      <div
                        key={docTitle}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          uploaded ? 'border-emerald-500 bg-emerald-50/50' : 'border-[#E2E8F0] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${uploaded ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {uploaded ? <Check className="w-4 h-4 stroke-[3]" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0F172A]">{docTitle}</div>
                            {uploaded ? (
                              <div className="text-[11px] text-emerald-700 font-semibold truncate max-w-[220px]">
                                Attached: {uploaded.name} ({uploaded.size} KB)
                              </div>
                            ) : (
                              <div className="text-[11px] text-[#64748B]">Supported formats: PDF, JPG, PNG</div>
                            )}
                          </div>
                        </div>

                        <label className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors text-center shrink-0 shadow-2xs ${
                          uploaded ? 'border-emerald-500 text-emerald-700 bg-white hover:bg-emerald-50' : 'border-[#E2E8F0] text-[#0F172A] hover:border-blue-500 hover:text-[#1d63ed]'
                        }`}>
                          {uploaded ? 'Replace File' : 'Upload File'}
                          <input
                            type="file"
                            hidden
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(docTitle, e)}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Review & Submit */}
            {currentStep === 5 && (
              <StepSummary
                deskId={deskId}
                selectedProduct={selectedProduct}
                customerName={customerName}
                email={email}
                phone={phone}
                amount={amount}
                term={term}
                purpose={purpose}
                formData={formData}
                uploadedDocs={uploadedDocs}
                onGoToStep={handleStepClick}
              />
            )}

            {/* Wizard Action Navigation Footer */}
            <StepNavigation
              currentStep={currentStep}
              totalSteps={stepsMeta.length}
              submitting={submitting}
              savingDraft={savingDraft}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
