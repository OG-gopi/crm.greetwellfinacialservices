import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Building2,
  GraduationCap,
  Home,
  Briefcase,
  Car,
  Coins,
  Heart,
  ShieldCheck,
  Plane,
  Activity,
  Users,
  BarChart3,
  Lock,
  RefreshCw,
  LineChart,
  Check,
  Copy,
  Upload,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  UserCheck,
  Search,
  Sparkles,
  DollarSign,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { ApplicationType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SearchableSelect } from '../../components/common/SearchableSelect';

interface ProductItem {
  id: string;
  name: string;
  sub: string;
  icon: any;
  docs: string[];
}

interface DeskConfig {
  id: ApplicationType;
  label: string;
  typeLabel: string;
  icon: any;
  products: ProductItem[];
}

const DESKS: Record<ApplicationType, DeskConfig> = {
  LOAN: {
    id: 'LOAN',
    label: 'Loans Desk',
    typeLabel: 'Choose a loan type',
    icon: Building2,
    products: [
      { id: 'Personal Loan', name: 'Personal Loan', sub: 'Instant multi-purpose credit & personal needs', icon: Building2, docs: ['PAN Card', 'Aadhaar Card', "Last 3 Months' Salary Slips", 'Bank Statement (6 Months)', 'Passport Photo'] },
      { id: 'Education Loan', name: 'Education Loan', sub: 'Tuition fees & study abroad assistance', icon: GraduationCap, docs: ['PAN Card', 'Aadhaar Card', 'Admission Letter', 'Fee Structure', 'Co-applicant Income Proof', 'Academic Marksheets'] },
      { id: 'Home Loan', name: 'Home Loan', sub: 'Purchase, construction & home renovation', icon: Home, docs: ['PAN Card', 'Aadhaar Card', 'Property Documents', 'Income Proof', 'Bank Statement (6 Months)', 'Sale Agreement'] },
      { id: 'Business Loan', name: 'Business Loan', sub: 'Working capital & business expansion', icon: Briefcase, docs: ['PAN Card', 'Aadhaar Card', 'Business Registration Proof', 'GST Returns', 'Bank Statement (12 Months)', 'ITR (Last 2 Years)'] },
      { id: 'Gold Loan', name: 'Gold Loan', sub: 'Quick liquid funds against gold ornaments', icon: Coins, docs: ['PAN Card', 'Aadhaar Card', 'Gold Ornament Details', 'Passport Photo'] },
      { id: 'Vehicle Loan', name: 'Vehicle Loan', sub: 'New & used car or two-wheeler financing', icon: Car, docs: ['PAN Card', 'Aadhaar Card', 'Driving Licence', 'Income Proof', 'Vehicle Quotation'] },
    ],
  },
  INSURANCE: {
    id: 'INSURANCE',
    label: 'Insurance Desk',
    typeLabel: 'Choose a cover type',
    icon: Shield,
    products: [
      { id: 'Health Insurance', name: 'Health Insurance', sub: 'Hospitalisation & comprehensive medical cover', icon: Heart, docs: ['Aadhaar Card', 'PAN Card', 'Age Proof', 'Recent Medical Reports (if any)', 'Passport Photo'] },
      { id: 'Term Life Insurance', name: 'Term Life Insurance', sub: 'Income protection & financial security for family', icon: ShieldCheck, docs: ['Aadhaar Card', 'PAN Card', 'Income Proof', 'Nominee ID Proof', 'Medical Reports (if required)'] },
      { id: 'Vehicle Insurance', name: 'Vehicle Insurance', sub: 'Third-party & comprehensive vehicle cover', icon: Car, docs: ['RC Book', 'Driving Licence', 'Previous Policy Copy (if renewing)', 'Aadhaar Card'] },
      { id: 'Travel Insurance', name: 'Travel Insurance', sub: 'Domestic & international trip safety', icon: Plane, docs: ['Passport Copy', 'Travel Itinerary', 'Aadhaar Card'] },
      { id: 'Home Insurance', name: 'Home Insurance', sub: 'Structure & household contents protection', icon: Home, docs: ['Property Documents', 'Aadhaar Card', 'PAN Card', 'Property Valuation Report'] },
      { id: 'Personal Accident Insurance', name: 'Personal Accident', sub: 'Cover for accidental disability & injury', icon: Activity, docs: ['Aadhaar Card', 'PAN Card', 'Income Proof', 'Nominee Details'] },
    ],
  },
  INVESTMENT: {
    id: 'INVESTMENT',
    label: 'Investments & Chit',
    typeLabel: 'Choose an investment type',
    icon: TrendingUp,
    products: [
      { id: 'Chit Funds', name: 'Chit Funds', sub: 'Community savings with monthly bidding payouts', icon: Users, docs: ['PAN Card', 'Aadhaar Card', 'Bank Passbook Copy', 'Passport Photo', 'Address Proof'] },
      { id: 'Mutual Funds / SIP', name: 'Mutual Funds / SIP', sub: 'Market-linked wealth creation & SIP plans', icon: BarChart3, docs: ['PAN Card', 'Aadhaar Card', 'Cancelled Cheque', 'FATCA Declaration'] },
      { id: 'Fixed Deposit', name: 'Fixed Deposit', sub: 'Guaranteed fixed returns with flexible tenure', icon: Lock, docs: ['PAN Card', 'Aadhaar Card', 'Bank Passbook Copy'] },
      { id: 'Recurring Deposit', name: 'Recurring Deposit', sub: 'Save monthly & earn compound interest', icon: RefreshCw, docs: ['PAN Card', 'Aadhaar Card', 'Bank Passbook Copy'] },
      { id: 'Gold Investment', name: 'Gold Investment', sub: 'Digital & physical gold accumulation plans', icon: Coins, docs: ['PAN Card', 'Aadhaar Card', 'Address Proof'] },
      { id: 'Stocks & Equity', name: 'Stocks & Equity', sub: 'Direct equity market investment guidance', icon: LineChart, docs: ['PAN Card', 'Aadhaar Card', 'Cancelled Cheque', 'Demat Account Proof (if existing)'] },
    ],
  },
};

export const CreateApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const agentRoleDomain: ApplicationType | null =
    user?.role === 'LOAN_AGENT' ? 'LOAN' : user?.role === 'INSURANCE_AGENT' ? 'INSURANCE' : user?.role === 'INVESTMENT_AGENT' ? 'INVESTMENT' : null;

  const urlType = searchParams.get('type');
  const initialType: ApplicationType = agentRoleDomain
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

  useEffect(() => {
    if (agentRoleDomain && deskId !== agentRoleDomain) {
      setDeskId(agentRoleDomain);
      setSelectedProduct(DESKS[agentRoleDomain].products[0]);
    }
  }, [agentRoleDomain]);

  // Target Customer Selection for Staff Roles (SuperAdmin & Agents)
  const isStaffRole = ['SUPER_ADMIN', 'LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(user?.role || '');
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
  const [isLockedFromUrl, setIsLockedFromUrl] = useState<boolean>(false);

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

  // Documents State
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ type: string; name: string; fileUrl: string; size: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successAppId, setSuccessAppId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateMobileInput(phone)) {
      return;
    }

    if (isStaffRole && !selectedCustomerId) {
      setError('Please select a target Customer Account to create this application.');
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

  const currentDesk = DESKS[deskId];

  // Success Confirmation Screen
  if (successAppId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 font-sans">
        <div className="bg-white border border-[#E2E7EE] rounded-2xl p-8 sm:p-12 text-center shadow-md">
          <div className="w-16 h-16 rounded-full bg-[#0E8F6F] text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-600/30 animate-bounce">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#16202E] mb-2">
            {selectedProduct.name} Application Submitted!
          </h2>
          <p className="text-sm text-[#5C6B82] max-w-md mx-auto mb-6 leading-relaxed">
            Your application details have been registered with our {currentDesk.label} team. An agent will review your documents and contact you shortly.
          </p>

          <div className="bg-[#F3F5F8] border border-[#E2E7EE] rounded-xl p-4 flex items-center justify-between max-w-md mx-auto mb-8">
            <span className="text-xs font-semibold text-[#5C6B82] uppercase tracking-wider">Reference ID:</span>
            <span className="font-mono font-bold text-base text-[#16202E] tracking-wide">{successAppId}</span>
            <button
              onClick={copyReferenceCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E7EE] text-xs font-bold text-[#0E8F6F] hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(getMyAppsRoute())}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0E1A2B] text-white font-bold text-sm hover:bg-[#16273D] transition-colors cursor-pointer shadow-sm"
            >
              View My Applications
            </button>
            <button
              onClick={() => {
                setSuccessAppId(null);
                setAmount('');
                setPurpose('');
                setUploadedDocs([]);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-[#E2E7EE] text-[#16202E] font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Start Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-4 font-sans space-y-8">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E7EE] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16202E] tracking-tight">
            Start a new application
          </h1>
          <p className="text-sm text-[#5C6B82] mt-1">
            Pick a desk, then a product, to begin your application.
          </p>
        </div>
        {user?.role === 'CUSTOMER' && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Fast-track KYC Enabled</span>
          </div>
        )}
      </div>

      {/* Staff Target Customer Selector Card */}
      {isStaffRole && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Target Customer Account (Mandatory for Staff)</span>
            </label>
            {isLockedFromUrl && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Locked from Customer Record
              </span>
            )}
          </div>
          {loadingCustomers ? (
            <div className="text-xs text-slate-500 py-2">Loading Customer Accounts...</div>
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

      {/* Step 1: Desk Selector Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[#5C6B82]">
            Step 1: Select Portal Desk
          </label>
          {agentRoleDomain && (
            <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
              Domain Locked to {agentRoleDomain === 'LOAN' ? 'Loans' : agentRoleDomain === 'INSURANCE' ? 'Insurance' : 'Investments'} Desk Agent Workspace
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(agentRoleDomain ? [agentRoleDomain] : (Object.keys(DESKS) as ApplicationType[])).map((key) => {
            const desk = DESKS[key];
            const DeskIcon = desk.icon;
            const isActive = deskId === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => !agentRoleDomain && handleDeskChange(key)}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  agentRoleDomain ? 'cursor-default' : 'cursor-pointer'
                } flex flex-col items-center sm:items-start text-center sm:text-left ${
                  isActive
                    ? 'border-[#0E8F6F] bg-[#E8F6F1] shadow-md shadow-emerald-600/10'
                    : 'border-[#E2E7EE] bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    isActive ? 'bg-[#0E8F6F] text-white shadow-sm' : 'bg-slate-100 text-[#5C6B82]'
                  }`}
                >
                  <DeskIcon className="w-6 h-6" />
                </div>
                <div className="font-extrabold text-base text-[#16202E]">{desk.label}</div>
                <div className="text-xs text-[#5C6B82] mt-0.5">
                  {key === 'LOAN'
                    ? 'Loans & Financing'
                    : key === 'INSURANCE'
                    ? 'Policies & Protection'
                    : 'Chit Funds & Wealth'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Product Type Grid */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[#5C6B82]">
          Step 2: {currentDesk.typeLabel}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDesk.products.map((prod) => {
            const ProdIcon = prod.icon;
            const isSelected = selectedProduct.id === prod.id;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => setSelectedProduct(prod)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0E8F6F] bg-white ring-2 ring-[#0E8F6F]/20 shadow-md'
                    : 'border-[#E2E7EE] bg-white hover:border-[#0E8F6F]/60 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#E8F6F1] text-[#0E8F6F]' : 'bg-slate-100 text-[#5C6B82]'
                    }`}
                  >
                    <ProdIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#16202E] truncate">{prod.name}</div>
                    <div className="text-xs text-[#5C6B82] leading-snug mt-0.5 line-clamp-2">
                      {prod.sub}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Full Page Application Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E2E7EE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Product Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E7EE] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E8F6F1] text-[#0E8F6F] flex items-center justify-center shrink-0">
              {React.createElement(selectedProduct.icon, { className: 'w-6 h-6' })}
            </div>
            <div>
              <span className="text-xs font-bold text-[#0E8F6F] uppercase tracking-wider">{currentDesk.label}</span>
              <h2 className="text-xl font-extrabold text-[#16202E]">{selectedProduct.name}</h2>
            </div>
          </div>
          <div className="text-xs text-[#5C6B82] bg-slate-50 px-3 py-1.5 rounded-lg border border-[#E2E7EE]">
            Product Code: <span className="font-mono font-bold text-[#16202E]">{selectedProduct.id.replace(/\s+/g, '-').toUpperCase()}</span>
          </div>
        </div>

        {/* Applicant Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-[#16202E] uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#0E8F6F]" />
            <span>1. Applicant Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C6B82]">Full Name (as per PAN) *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C6B82]">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => validateMobileInput(e.target.value)}
                placeholder="10-digit mobile number"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none bg-white ${
                  phoneError ? 'border-rose-400 focus:border-rose-500' : 'border-[#E2E7EE] focus:border-[#0E8F6F]'
                }`}
              />
              {phoneError && <span className="text-[11px] text-rose-600 font-semibold">{phoneError}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C6B82]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C6B82]">PAN Number</label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white uppercase font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C6B82]">City / Pincode</label>
              <input
                type="text"
                value={formData.cityPincode}
                onChange={(e) => setFormData({ ...formData, cityPincode: e.target.value })}
                placeholder="e.g. Hyderabad, 500081"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
              />
            </div>
          </div>
        </div>

        {/* Product Specific Financial Details */}
        <div className="space-y-4 pt-4 border-t border-[#E2E7EE]">
          <h3 className="text-sm font-extrabold text-[#16202E] uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#0E8F6F]" />
            <span>2. {selectedProduct.name} Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C6B82]">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C6B82]">Preferred Tenure / Duration</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white font-medium"
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
                  <label className="text-xs font-semibold text-[#5C6B82]">Monthly Income (₹)</label>
                  <input
                    type="number"
                    value={formData.monthlyIncome}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                    placeholder="e.g. 45000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#5C6B82]">Employment Type</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
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
                  <label className="text-xs font-semibold text-[#5C6B82]">Nominee Full Name</label>
                  <input
                    type="text"
                    value={formData.nomineeName}
                    onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                    placeholder="Nominee Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#5C6B82]">Relation with Nominee</label>
                  <select
                    value={formData.nomineeRelation}
                    onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
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
              <label className="text-xs font-semibold text-[#5C6B82]">Application Notes / Purpose</label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Optional notes regarding this application..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EE] text-sm focus:outline-none focus:border-[#0E8F6F] bg-white"
              />
            </div>
          </div>
        </div>

        {/* Documents to Upload */}
        <div className="space-y-4 pt-4 border-t border-[#E2E7EE]">
          <h3 className="text-sm font-extrabold text-[#16202E] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0E8F6F]" />
            <span>3. Documents to Upload</span>
          </h3>

          <div className="space-y-2">
            {selectedProduct.docs.map((docTitle) => {
              const uploaded = uploadedDocs.find((d) => d.type === docTitle);
              return (
                <div
                  key={docTitle}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    uploaded ? 'border-[#0E8F6F] bg-[#E8F6F1]' : 'border-[#E2E7EE] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? 'bg-[#0E8F6F] text-white' : 'bg-slate-100 text-[#5C6B82]'}`}>
                      {uploaded ? <Check className="w-4 h-4 stroke-[3]" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#16202E]">{docTitle}</div>
                      {uploaded ? (
                        <div className="text-[11px] text-[#0E8F6F] font-semibold truncate max-w-[200px]">
                          Attached: {uploaded.name} ({uploaded.size} KB)
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#5C6B82]">Upload PDF, JPG or PNG</div>
                      )}
                    </div>
                  </div>

                  <label className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors text-center shrink-0 ${
                    uploaded ? 'border-[#0E8F6F] text-[#0E8F6F] bg-white' : 'border-[#E2E7EE] text-[#5C6B82] hover:border-[#0E8F6F] hover:text-[#0E8F6F]'
                  }`}>
                    {uploaded ? 'Replace File' : 'Choose File'}
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

        {/* Form Submission Action */}
        <div className="pt-4 border-t border-[#E2E7EE] flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#B4862E] hover:bg-[#9C7526] text-white font-extrabold text-base transition-colors shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Application</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateApplication;
