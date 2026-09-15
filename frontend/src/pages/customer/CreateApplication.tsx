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
  User,
  Coins,
  PieChart,
  PiggyBank,
} from 'lucide-react';
import { api } from '../../services/api';
import { ApplicationType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export const CreateApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const urlType = searchParams.get('type');
  const initialType: ApplicationType =
    urlType === 'INSURANCE' ? 'INSURANCE' : urlType === 'INVESTMENT' ? 'INVESTMENT' : 'LOAN';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [appType, setAppType] = useState<ApplicationType>(initialType);

  // Target Customer Selection for Staff Roles (SuperAdmin & Agents)
  const isStaffRole = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user?.role || '');
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);

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

    nomineeName: '',
    nomineeRelation: 'Spouse',
    preExistingConditions: 'None',
    sumInsured: '500000',
    smokerStatus: 'Non-Smoker',
    vehicleRegNo: '',
    vehicleMakeModel: '',

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

  // Fetch Customers List for Staff Roles on Component Mount
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

            if (!initialCus && list.length > 0) {
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

  useEffect(() => {
    if (appType === 'LOAN') {
      setProductType('Personal Loan');
    } else if (appType === 'INSURANCE') {
      setProductType('Health Insurance');
    } else if (appType === 'INVESTMENT') {
      setProductType('Chit Investment');
    }
  }, [appType]);

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

    if (isStaffRole && !selectedCustomerId) {
      setError('Please select a target Customer ID to create this application.');
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: appType,
        customerId: isStaffRole ? selectedCustomerId : undefined,
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
          { title: 'Identity Proof (Aadhaar/PAN)', required: false },
          { title: 'Address Proof', required: false },
          { title: 'Admission Letter', required: false },
          { title: 'Tuition Fee Structure', required: false },
          { title: 'Bank Statements (6 Months)', required: false },
        ];
      }
      if (productType === 'Home Loan') {
        return [
          { title: 'Identity Proof (Aadhaar/PAN)', required: false },
          { title: 'Address Proof', required: false },
          { title: 'Property Sale Agreement', required: false },
          { title: 'Income Proof / Salary Slips', required: false },
          { title: 'Bank Statements', required: false },
        ];
      }
      if (productType === 'Business Loan') {
        return [
          { title: 'Identity Proof', required: false },
          { title: 'Business Registration Certificate', required: false },
          { title: 'GST Return / Tax Filings', required: false },
          { title: '12 Months Bank Statements', required: false },
        ];
      }
      return [
        { title: 'Identity Proof (Aadhaar/PAN)', required: false },
        { title: 'Address Proof', required: false },
        { title: 'Income Proof / Salary Slips', required: false },
        { title: 'Bank Statements (6 Months)', required: false },
      ];
    }

    if (appType === 'INSURANCE') {
      if (productType === 'Motor Insurance') {
        return [
          { title: 'Identity Proof', required: false },
          { title: 'Vehicle RC Copy', required: false },
          { title: 'Previous Policy Copy', required: false },
          { title: 'Vehicle Inspection Photo', required: false },
        ];
      }
      return [
        { title: 'Identity Proof (Aadhaar/PAN)', required: false },
        { title: 'Address Proof', required: false },
        { title: 'Medical Examination Report', required: false },
        { title: 'Income Proof', required: false },
      ];
    }

    if (appType === 'INVESTMENT') {
      if (productType === 'Chit Investment') {
        return [
          { title: 'Aadhaar Card', required: false, description: 'Optional identity verification' },
          { title: 'PAN Card', required: false, description: 'Optional tax verification' },
          { title: 'Address Proof', required: false, description: 'Optional residential proof' },
          { title: 'Bank Passbook / Cancelled Cheque', required: false, description: 'Optional payout account proof' },
          { title: 'Nominee Identity Proof', required: false, description: 'Optional nominee proof' },
        ];
      }
      return [
        { title: 'Identity Proof (Aadhaar/PAN)', required: false },
        { title: 'Address Proof', required: false },
        { title: 'Bank Passbook / Cancelled Cheque', required: false },
      ];
    }

    return [
      { title: 'Identity Proof', required: false },
      { title: 'Address Proof', required: false },
    ];
  };

  const handleValidateStep3 = () => {
    setError('');
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
          Application registered for <strong>{customerName}</strong> ({email} / {phone}). Confirmation notifications sent.
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
    <div className="max-w-4xl mx-auto space-y-6 font-['Inter',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-blue-600" />
            <span>Create New Financial Application</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isStaffRole 
              ? 'Select target Customer ID and complete scheme application entry' 
              : 'Submit your request for Loans, Insurance, or Investment schemes'}
          </p>
        </div>

        {/* STEP PROGRESS BADGES */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === step
                  ? 'bg-blue-600 text-white shadow-md'
                  : currentStep > step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CATEGORY & PRODUCT SELECTION */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Step 1: Select Application Category</h3>

          {/* Category Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
                      { name: 'Chit Investment', icon: Coins, desc: 'GFS monthly savings & auction chit' },
                      { name: 'Mutual Funds', icon: PieChart, desc: 'High growth equity portfolios' },
                      { name: 'Fixed Deposit', icon: PiggyBank, desc: 'Guaranteed high yield returns' },
                      { name: 'SIP Wealth', icon: TrendingUp, desc: 'Systematic monthly wealth builder' },
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

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
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

          {/* TARGET CUSTOMER SELECTION FOR STAFF ROLES */}
          {isStaffRole && (
            <div className="p-4 bg-blue-50/80 border-2 border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-black text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Select Target Customer Account</span>
                  <span className="text-rose-500">*</span>
                </label>
                {loadingCustomers && (
                  <span className="text-[11px] text-blue-600 font-bold animate-pulse">Loading Customers...</span>
                )}
              </div>
              <SearchableSelect
                options={customersList.map((c) => ({
                  value: c.id,
                  label: `${c.firstName} ${c.lastName || ''}`,
                  sublabel: `${c.customerIdCode ? `Customer ID: ${c.customerIdCode} | ` : ''}${c.email}${c.phone ? ` | Mobile: ${c.phone}` : ''}`,
                }))}
                value={selectedCustomerId}
                onChange={handleCustomerSelectChange}
                placeholder="Select Target Customer ID..."
                searchPlaceholder="Search Customer ID code, name, email, phone..."
                className="w-full"
              />
              <p className="text-[11px] text-blue-700 font-medium">
                This application will be officially registered under the selected Customer's ID and account profile.
              </p>
            </div>
          )}

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
                  <SearchableSelect
                    options={[
                      { value: 'India', label: 'India' },
                      { value: 'United States', label: 'United States' },
                      { value: 'United Kingdom', label: 'United Kingdom' },
                      { value: 'Canada', label: 'Canada' },
                      { value: 'Australia', label: 'Australia' },
                      { value: 'Germany', label: 'Germany' },
                    ]}
                    value={formData.educationCountry}
                    onChange={(val) => setFormData({ ...formData, educationCountry: val })}
                    placeholder="Select country..."
                    searchPlaceholder="Search country..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuition Fee Amount ($ / ₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.educationTuitionFee}
                    onChange={(e) => setFormData({ ...formData, educationTuitionFee: e.target.value })}
                    placeholder="25000"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
              </div>
            )}

            {/* HOME LOAN DYNAMIC FIELDS */}
            {productType === 'Home Loan' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-200">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Property Address <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    placeholder="Plot No 42, Jubilee Hills, Hyderabad"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Property Value (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.propertyValue}
                    onChange={(e) => setFormData({ ...formData, propertyValue: e.target.value })}
                    placeholder="7500000"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Construction Status</label>
                  <SearchableSelect
                    options={[
                      { value: 'Ready to Move', label: 'Ready to Move' },
                      { value: 'Under Construction', label: 'Under Construction' },
                      { value: 'Plot Purchase', label: 'Plot Purchase' },
                    ]}
                    value={formData.constructionStatus}
                    onChange={(val) => setFormData({ ...formData, constructionStatus: val })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* BUSINESS LOAN DYNAMIC FIELDS */}
            {productType === 'Business Loan' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Registered Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Greetwell Enterprises Pvt Ltd"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Years in Operation <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.yearsInBusiness}
                    onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}
                    placeholder="4"
                    className="w-full p-2.5 border rounded-lg bg-white"
                  />
                </div>
              </div>
            )}

            {/* CHIT INVESTMENT DYNAMIC FIELDS */}
            {productType === 'Chit Investment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/40 rounded-xl border border-amber-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selected Chit Scheme</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.chitSchemeName}
                    className="w-full p-2.5 border rounded-lg bg-slate-100 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Subscription (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹ ${formData.chitMonthlyContribution} / Month`}
                    className="w-full p-2.5 border rounded-lg bg-slate-100 font-bold text-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Standard Amount & Tenure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Requested Amount / Investment Sum (₹) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Tenure / Duration</label>
                <SearchableSelect
                  options={[
                    { value: '12 Months', label: '12 Months (1 Year)' },
                    { value: '24 Months', label: '24 Months (2 Years)' },
                    { value: '36 Months', label: '36 Months (3 Years)' },
                    { value: '60 Months', label: '60 Months (5 Years)' },
                    { value: '120 Months', label: '120 Months (10 Years)' },
                    { value: '240 Months', label: '240 Months (20 Years)' },
                  ]}
                  value={term}
                  onChange={setTerm}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Next: Document Attachments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DOCUMENT ATTACHMENTS */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Step 3: Verification Documents</h3>
              <p className="text-slate-500">Upload optional or required verification files for {productType}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded-lg border border-emerald-200">
              Optional Uploads
            </span>
          </div>

          <div className="space-y-4">
            {getRequiredDocsForProduct().map((doc, idx) => {
              const uploaded = uploadedDocs.find((d) => d.type === doc.title);
              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{doc.title}</p>
                    {doc.description && <p className="text-[11px] text-slate-500 mt-0.5">{doc.description}</p>}
                    {uploaded && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {uploaded.name} ({uploaded.size} KB)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploaded ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.title)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-lg hover:bg-rose-100 transition-all text-[11px]"
                      >
                        Remove
                      </button>
                    ) : (
                      <label className="cursor-pointer px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 font-bold text-slate-700 rounded-lg shadow-2xs transition-all inline-flex items-center gap-1.5 text-xs">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleDocSimulatedUpload(doc.title, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleValidateStep3}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
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
            <h3 className="text-sm font-extrabold text-slate-900 uppercase">Step 4: Final Summary Review</h3>
            <p className="text-slate-500">Please review your application details before final submission</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-3 border-b border-slate-200">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Category</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{appType}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Scheme / Product</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{productType}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Requested Amount</p>
                <p className="font-extrabold text-emerald-700 text-sm mt-0.5">₹ {amount ? parseFloat(amount).toLocaleString('en-IN') : '0'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Tenure</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{term}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Customer Name</p>
                <p className="font-bold text-slate-800">{customerName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Email Address</p>
                <p className="font-bold text-slate-800">{email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Mobile Phone</p>
                <p className="font-bold text-slate-800">{phone}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Application Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
