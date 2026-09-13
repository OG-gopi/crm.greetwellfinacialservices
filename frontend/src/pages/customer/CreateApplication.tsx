import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  DollarSign,
  Shield,
  TrendingUp,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Building,
  GraduationCap,
  Home,
  Briefcase,
  HeartPulse,
  Car,
  Coins,
  PiggyBank,
  PieChart,
} from 'lucide-react';
import { api } from '../../services/api';
import { ApplicationType } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const CreateApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const urlType = searchParams.get('type');
  const initialType: ApplicationType =
    urlType === 'INSURANCE' ? 'INSURANCE' : urlType === 'INVESTMENT' ? 'INVESTMENT' : 'LOAN';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [appType, setAppType] = useState<ApplicationType>(initialType);

  // Sub-product / Scheme Selection
  const [productType, setProductType] = useState<string>('Personal Loan');

  // Customer Contact Details
  const [customerName, setCustomerName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneError, setPhoneError] = useState('');

  // Primary Financial Fields
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('36 Months');
  const [purpose, setPurpose] = useState('');

  // Dynamic Product Form Fields
  const [formData, setFormData] = useState<Record<string, any>>({
    // Loan Specific
    educationCourseName: '',
    educationUniversity: '',
    educationCountry: 'India',
    educationStartDate: '',
    educationDurationMonths: '24',
    educationTuitionFee: '',
    educationLivingExpenses: '',
    employmentStatus: 'Full Time',
    annualIncome: '85000',
    existingEmi: '0',
    propertyAddress: '',
    propertyValue: '',
    constructionStatus: 'Ready to Move',
    businessName: '',
    businessType: 'Private Limited',
    yearsInBusiness: '3',
    annualRevenue: '',
    gstNumber: '',

    // Insurance Specific
    nomineeName: '',
    nomineeRelation: 'Spouse',
    preExistingConditions: 'None',
    sumInsured: '500000',
    smokerStatus: 'Non-Smoker',
    vehicleRegNo: '',
    vehicleMakeModel: '',

    // Investment Specific
    chitSchemeName: 'GFS Gold Monthly Chit',
    chitTotalAmount: '100000',
    chitMonthlyContribution: '5000',
    chitDurationMonths: '20',
    chitMembersCount: '20',
    chitStartDate: '',
    bankAccountNo: '',
    bankIfscCode: '',
    fdPayoutFrequency: 'On Maturity',
    investmentMode: 'SIP',
  });

  // Documents State
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ type: string; name: string; fileUrl: string; size: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successAppId, setSuccessAppId] = useState<string | null>(null);

  // Service Access Helper
  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];

  const isCategoryEnabled = (type: ApplicationType) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (user?.role === 'LOAN_AGENT') return type === 'LOAN';
    if (user?.role === 'INSURANCE_AGENT') return type === 'INSURANCE';
    if (user?.role === 'INVESTMENT_AGENT') return type === 'INVESTMENT';
    if (user?.role === 'CUSTOMER') {
      if (type === 'LOAN') return userServices.includes('LOAN') || userServices.includes('LOANS');
      if (type === 'INSURANCE') return userServices.includes('INSURANCE');
      if (type === 'INVESTMENT') return userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS');
      return false;
    }
    return true;
  };

  const [requestingService, setRequestingService] = useState(false);
  const [serviceRequestMsg, setServiceRequestMsg] = useState('');

  const handleRequestService = async (service: string) => {
    setRequestingService(true);
    setServiceRequestMsg('');
    try {
      const res = await api.post('/users/request-service', { requestedService: service });
      if (res.data.success) {
        setServiceRequestMsg(res.data.message || `Request for ${service} service submitted to Super Admin.`);
      }
    } catch (err: any) {
      setServiceRequestMsg(err.response?.data?.message || 'Failed to submit service request.');
    } finally {
      setRequestingService(false);
    }
  };

  // Ensure default appType is set to an enabled service on mount if current is disabled
  useEffect(() => {
    if (!isCategoryEnabled(appType)) {
      if (user?.role === 'LOAN_AGENT') setAppType('LOAN');
      else if (user?.role === 'INSURANCE_AGENT') setAppType('INSURANCE');
      else if (user?.role === 'INVESTMENT_AGENT') setAppType('INVESTMENT');
      else if (user?.role === 'CUSTOMER' && !urlType) {
        if (isCategoryEnabled('LOAN')) setAppType('LOAN');
        else if (isCategoryEnabled('INSURANCE')) setAppType('INSURANCE');
        else if (isCategoryEnabled('INVESTMENT')) setAppType('INVESTMENT');
      }
    }
  }, [user]);

  // Sync default sub-products on category change
  useEffect(() => {
    if (appType === 'LOAN') {
      setProductType('Personal Loan');
    } else if (appType === 'INSURANCE') {
      setProductType('Health Insurance');
    } else if (appType === 'INVESTMENT') {
      setProductType('Chit Investment');
    }
  }, [appType]);

  // Indian Mobile Validation (10-12 digits)
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

  const handleDocSimulatedUpload = (docTitle: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveDoc = (docTitle: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.type !== docTitle));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateMobileInput(phone)) {
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: appType,
        amount: amount ? parseFloat(amount) : undefined,
        term,
        purpose: purpose || `${productType} Application`,
        formData: {
          productType,
          customerName,
          email,
          phone,
          ...formData,
        },
        documents: uploadedDocs,
      };

      const res = await api.post('/applications', payload);
      if (res.data.success) {
        setSuccessAppId(res.data.data.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  interface DocumentSpec {
    title: string;
    required: boolean;
    description?: string;
  }

  const getRequiredDocsForProduct = (): DocumentSpec[] => {
    if (appType === 'LOAN') {
      if (productType === 'Education Loan') {
        return [
          { title: 'Identity Proof (Aadhaar/PAN)', required: true },
          { title: 'Address Proof', required: true },
          { title: 'Admission Letter', required: true },
          { title: 'Tuition Fee Structure', required: true },
          { title: 'Bank Statements (6 Months)', required: true },
        ];
      }
      if (productType === 'Home Loan') {
        return [
          { title: 'Identity Proof (Aadhaar/PAN)', required: true },
          { title: 'Address Proof', required: true },
          { title: 'Property Sale Agreement', required: true },
          { title: 'Income Proof / Salary Slips', required: true },
          { title: 'Bank Statements', required: true },
        ];
      }
      if (productType === 'Business Loan') {
        return [
          { title: 'Identity Proof', required: true },
          { title: 'Business Registration Certificate', required: true },
          { title: 'GST Return / Tax Filings', required: true },
          { title: '12 Months Bank Statements', required: true },
        ];
      }
      return [
        { title: 'Identity Proof (Aadhaar/PAN)', required: true },
        { title: 'Address Proof', required: true },
        { title: 'Income Proof / Salary Slips', required: true },
        { title: 'Bank Statements (6 Months)', required: true },
      ];
    }

    if (appType === 'INSURANCE') {
      if (productType === 'Motor Insurance') {
        return [
          { title: 'Identity Proof', required: true },
          { title: 'Vehicle RC Copy', required: true },
          { title: 'Previous Policy Copy', required: true },
          { title: 'Vehicle Inspection Photo', required: true },
        ];
      }
      return [
        { title: 'Identity Proof (Aadhaar/PAN)', required: true },
        { title: 'Address Proof', required: true },
        { title: 'Medical Examination Report', required: true },
        { title: 'Income Proof', required: true },
      ];
    }

    if (appType === 'INVESTMENT') {
      if (productType === 'Chit Investment') {
        return [
          { title: 'Aadhaar Card', required: true, description: 'Mandatory identity verification' },
          { title: 'PAN Card', required: false, description: 'Optional tax verification' },
          { title: 'Address Proof', required: false, description: 'Optional residential proof' },
          { title: 'Bank Passbook / Cancelled Cheque', required: false, description: 'Optional payout account proof' },
          { title: 'Nominee Identity Proof', required: false, description: 'Optional nominee proof' },
        ];
      }
      return [
        { title: 'Identity Proof (Aadhaar/PAN)', required: true },
        { title: 'Address Proof', required: false },
        { title: 'Bank Passbook / Cancelled Cheque', required: false },
      ];
    }

    return [
      { title: 'Identity Proof', required: true },
      { title: 'Address Proof', required: true },
    ];
  };

  const handleValidateStep3 = () => {
    setError('');
    const docSpecs = getRequiredDocsForProduct();
    const mandatorySpecs = docSpecs.filter((d) => d.required);

    for (const spec of mandatorySpecs) {
      const isUploaded = uploadedDocs.some(
        (d) =>
          d.type === spec.title ||
          d.type.includes(spec.title) ||
          (spec.title.includes('Aadhaar') && d.type.includes('Aadhaar'))
      );
      if (!isUploaded) {
        setError(`Please upload mandatory document: ${spec.title}`);
        return;
      }
    }

    setCurrentStep(4);
  };

  if (successAppId) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Application Submitted Successfully!</h2>
        <p className="text-sm text-slate-600">
          Your official <strong>{appType}</strong> application reference code is:
        </p>
        <div className="inline-block px-6 py-2.5 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-extrabold text-xl rounded-xl tracking-wider">
          {successAppId}
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          A confirmation email and WhatsApp notification have been sent to <strong>{email}</strong> and <strong>{phone}</strong>. Our designated agent will review your application.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <button
            onClick={() => navigate(user?.role === 'CUSTOMER' ? '/customer/applications' : '/superadmin/applications/all')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            View All Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Create Financial Application</h2>
        <p className="text-xs text-slate-500">
          Complete the step-based workflow to apply for Loans, Insurance, or Investments (including Chit Schemes).
        </p>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        {[
          { step: 1, label: '1. Select Scheme' },
          { step: 2, label: '2. Application Details' },
          { step: 3, label: '3. Required Documents' },
          { step: 4, label: '4. Review & Submit' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === s.step
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : currentStep > s.step
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500 border'
              }`}
            >
              {currentStep > s.step ? '✓' : s.step}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                currentStep === s.step ? 'text-blue-700 font-bold' : 'text-slate-500'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CATEGORY & PRODUCT SELECTION */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Step 1: Select Application Category</h3>

          {/* Category Tabs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { type: 'LOAN', title: 'Loans Desk', icon: DollarSign, color: 'border-emerald-500 bg-emerald-50/50 text-emerald-800' },
              { type: 'INSURANCE', title: 'Insurance Desk', icon: Shield, color: 'border-purple-500 bg-purple-50/50 text-purple-800' },
              { type: 'INVESTMENT', title: 'Investments & Chit', icon: TrendingUp, color: 'border-amber-500 bg-amber-50/50 text-amber-800' },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = appType === cat.type;
              const enabled = isCategoryEnabled(cat.type as ApplicationType);
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setAppType(cat.type as ApplicationType)}
                  className={`p-4 rounded-xl border-2 text-center flex flex-col items-center justify-center gap-2 transition-all relative ${
                    isSelected
                      ? `${cat.color} ring-2 ring-blue-500/20 shadow-md font-bold`
                      : enabled
                      ? 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                      : 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-80'
                  }`}
                >
                  {!enabled && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-extrabold text-[9px] uppercase">
                      Not Enabled
                    </span>
                  )}
                  <Icon className="w-7 h-7" />
                  <span className="text-xs font-bold">{cat.title}</span>
                </button>
              );
            })}
          </div>

          {/* If selected category is NOT enabled */}
          {!isCategoryEnabled(appType) ? (
            user?.role !== 'CUSTOMER' ? (
              <div className="p-8 rounded-2xl bg-rose-50 border-2 border-rose-200 text-center space-y-4 my-4">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto font-black">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-rose-900 text-base">
                    403 - Access Denied / Unauthorized
                  </h4>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    As a <strong>{user?.role?.replace('_', ' ')}</strong>, you are only authorized to create <strong>{user?.role === 'LOAN_AGENT' ? 'LOAN' : user?.role === 'INSURANCE_AGENT' ? 'INSURANCE' : user?.role === 'INVESTMENT_AGENT' ? 'INVESTMENT' : ''}</strong> applications.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allowed = user?.role === 'LOAN_AGENT' ? 'LOAN' : user?.role === 'INSURANCE_AGENT' ? 'INSURANCE' : 'INVESTMENT';
                    setAppType(allowed);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
                >
                  Switch to Allowed Category
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200 text-center space-y-4 my-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto font-black">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {appType} Service Not Enabled
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    You registered for only specific financial services. Would you like to request access for <strong>{appType}</strong> services?
                  </p>
                </div>

                {serviceRequestMsg ? (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl max-w-md mx-auto">
                    {serviceRequestMsg}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={requestingService}
                    onClick={() => handleRequestService(appType)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
                  >
                    {requestingService ? 'Submitting Request...' : `Request ${appType} Service Access`}
                  </button>
                )}
              </div>
            )
          ) : (
            <>
              {/* Sub-Product Type Cards */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Specific {appType} Scheme / Product Type:
                </label>

                {appType === 'LOAN' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Personal Loan', icon: Building, desc: 'Instant multi-purpose personal credit' },
                      { name: 'Education Loan', icon: GraduationCap, desc: 'Tuition fees & abroad study expenses' },
                      { name: 'Home Loan', icon: Home, desc: 'Property purchase & construction loan' },
                      { name: 'Business Loan', icon: Briefcase, desc: 'Working capital & business expansion' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = productType === item.name;
                      return (
                        <div
                          key={item.name}
                          onClick={() => setProductType(item.name)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            active ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {appType === 'INSURANCE' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Health Insurance', icon: HeartPulse, desc: 'Comprehensive medical protection' },
                      { name: 'Life Insurance', icon: Shield, desc: 'Family financial security & term cover' },
                      { name: 'Motor Insurance', icon: Car, desc: 'Vehicle comprehensive & third-party' },
                      { name: 'Property Insurance', icon: Building, desc: 'Asset & structural protection' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = productType === item.name;
                      return (
                        <div
                          key={item.name}
                          onClick={() => setProductType(item.name)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            active ? 'border-purple-600 bg-purple-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-purple-700' : 'text-slate-400'}`} />
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {appType === 'INVESTMENT' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Chit Investment', icon: Coins, desc: 'GFS Monthly Savings Chit Scheme' },
                      { name: 'Fixed Deposit', icon: PiggyBank, desc: 'High-yield guaranteed returns' },
                      { name: 'Mutual Funds', icon: PieChart, desc: 'SIP & Lumpsum wealth building' },
                      { name: 'Stock Portfolio', icon: TrendingUp, desc: 'Managed equity portfolios' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = productType === item.name;
                      return (
                        <div
                          key={item.name}
                          onClick={() => setProductType(item.name)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            active ? 'border-amber-600 bg-amber-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-amber-700' : 'text-slate-400'}`} />
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md"
                >
                  <span>Next: Application Form</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2: DYNAMIC FORM FIELDS */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Step 2: {productType} Details</h3>
              <p className="text-slate-500">Fill mandatory (* marked) customer and scheme information</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-lg border border-blue-200">
              {productType}
            </span>
          </div>

          {/* Common Customer Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">1. Applicant Contact Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Indian Mobile Number <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => validateMobileInput(e.target.value)}
                  placeholder="9876543210"
                  className={`w-full p-2.5 border rounded-lg font-medium ${phoneError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}
                />
                {phoneError && <p className="text-[11px] text-rose-600 font-bold mt-1">{phoneError}</p>}
              </div>
            </div>
          </div>

          {/* Product Specific Dynamic Form */}
          <div className="space-y-4 pt-2 border-t">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">2. {productType} Financial Inputs</h4>

            {/* EDUCATION LOAN DYNAMIC FIELDS */}
            {productType === 'Education Loan' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.educationCourseName}
                    onChange={(e) => setFormData({ ...formData, educationCourseName: e.target.value })}
                    placeholder="M.S. Computer Science"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">University / Institution <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.educationUniversity}
                    onChange={(e) => setFormData({ ...formData, educationUniversity: e.target.value })}
                    placeholder="Stanford University / IIT"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country of Study <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.educationCountry}
                    onChange={(e) => setFormData({ ...formData, educationCountry: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-white font-medium"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuition Fee Amount ($ / ₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.educationTuitionFee}
                    onChange={(e) => {
                      setFormData({ ...formData, educationTuitionFee: e.target.value });
                      setAmount(e.target.value);
                    }}
                    placeholder="25000"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
              </div>
            )}

            {/* CHIT INVESTMENT DYNAMIC FIELDS */}
            {productType === 'Chit Investment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chit Scheme Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.chitSchemeName}
                    onChange={(e) => setFormData({ ...formData, chitSchemeName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Chit Amount (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.chitTotalAmount}
                    onChange={(e) => {
                      setFormData({ ...formData, chitTotalAmount: e.target.value });
                      setAmount(e.target.value);
                    }}
                    placeholder="100000"
                    className="w-full p-2.5 border rounded-lg bg-white font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Contribution (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.chitMonthlyContribution}
                    onChange={(e) => setFormData({ ...formData, chitMonthlyContribution: e.target.value })}
                    placeholder="5000"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chit Duration (Months) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.chitDurationMonths}
                    onChange={(e) => {
                      setFormData({ ...formData, chitDurationMonths: e.target.value });
                      setTerm(`${e.target.value} Months`);
                    }}
                    placeholder="20"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payout Bank Account Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                    placeholder="9876543210123"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                    placeholder="SBIN0001234"
                    className="w-full p-2.5 border rounded-lg bg-white uppercase"
                  />
                </div>
              </div>
            )}

            {/* HEALTH / LIFE INSURANCE DYNAMIC FIELDS */}
            {(productType === 'Health Insurance' || productType === 'Life Insurance') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-50/40 rounded-xl border border-purple-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominee Full Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.nomineeName}
                    onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominee Relationship <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.nomineeRelation}
                    onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coverage Sum Insured ($ / ₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.sumInsured}
                    onChange={(e) => {
                      setFormData({ ...formData, sumInsured: e.target.value });
                      setAmount(e.target.value);
                    }}
                    placeholder="500000"
                    className="w-full p-2.5 border rounded-lg bg-white font-bold text-purple-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tobacco / Smoker Status <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.smokerStatus}
                    onChange={(e) => setFormData({ ...formData, smokerStatus: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Non-Smoker">Non-Smoker / Non-Tobacco</option>
                    <option value="Smoker">Smoker / Tobacco User</option>
                  </select>
                </div>
              </div>
            )}

            {/* DEFAULT AMOUNT & TERM FALLBACK FOR OTHER TYPES */}
            {productType !== 'Education Loan' && productType !== 'Chit Investment' && productType !== 'Health Insurance' && productType !== 'Life Insurance' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requested Amount ($ / ₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full p-2.5 border rounded-lg bg-white font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Term / Horizon <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="36 Months"
                    className="w-full p-2.5 border rounded-lg bg-white font-semibold"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Application Goal / Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={`e.g. ${productType} Enrollment & Processing`}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => {
                if (validateMobileInput(phone)) setCurrentStep(3);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md"
            >
              <span>Next: Document Upload</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DOCUMENT UPLOAD */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase">Step 3: Upload Required Documents</h3>
            <p className="text-slate-500">Provide official identity and scheme verification documents</p>
          </div>

          <div className="space-y-3">
            {getRequiredDocsForProduct().map((docSpec) => {
              const uploaded = uploadedDocs.find(
                (d) =>
                  d.type === docSpec.title ||
                  d.type.includes(docSpec.title) ||
                  (docSpec.title.includes('Aadhaar') && d.type.includes('Aadhaar'))
              );
              return (
                <div
                  key={docSpec.title}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    uploaded ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{docSpec.title}</span>
                      {docSpec.required ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-600 border border-slate-300">
                          Optional
                        </span>
                      )}
                    </div>
                    {uploaded ? (
                      <p className="text-[11px] text-emerald-700 font-medium mt-1">
                        ✓ File uploaded: <strong>{uploaded.name}</strong> ({uploaded.size} KB)
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {docSpec.description || 'Allowed formats: PDF, JPG, PNG (Max 5MB)'}
                      </p>
                    )}
                  </div>

                  <div>
                    {uploaded ? (
                      <button
                        onClick={() => handleRemoveDoc(docSpec.title)}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    ) : (
                      <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm">
                        <Upload className="w-3.5 h-3.5" /> Select File
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocSimulatedUpload(docSpec.title, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleValidateStep3}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md"
            >
              <span>Next: Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {currentStep === 4 && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase">Step 4: Review & Submit Application</h3>
            <p className="text-slate-500">Please review all submitted details before final submission</p>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-extrabold text-slate-900 text-sm">{productType} ({appType})</span>
              <span className="font-extrabold text-emerald-700 text-base">
                {amount ? `Amount: ₹ / $ ${parseFloat(amount).toLocaleString()}` : 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
              <p><strong>Customer:</strong> {customerName}</p>
              <p><strong>Email:</strong> {email}</p>
              <p><strong>Mobile:</strong> {phone}</p>
              <p><strong>Term:</strong> {term}</p>
              <p><strong>Uploaded Docs:</strong> {uploadedDocs.length} File(s)</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
            >
              {submitting ? 'Creating Application...' : 'Create Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
