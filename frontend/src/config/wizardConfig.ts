import {
  Building2,
  Shield,
  TrendingUp,
  UserCheck,
  Coins,
  FileText,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Car,
  Plane,
  Home,
  Users,
  BarChart3,
  Lock,
  RefreshCw,
  LineChart,
  GraduationCap,
  Briefcase,
  Activity,
} from 'lucide-react';
import { ApplicationType } from '../types';

export interface ProductItem {
  id: string;
  name: string;
  sub: string;
  icon: any;
  docs: string[];
}

export interface DeskConfig {
  id: ApplicationType;
  label: string;
  typeLabel: string;
  icon: any;
  products: ProductItem[];
}

export interface WizardStepMeta {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  icon: any;
}

export const DESKS: Record<ApplicationType, DeskConfig> = {
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

export const WIZARD_STEPS: Record<ApplicationType, WizardStepMeta[]> = {
  LOAN: [
    { id: 1, key: 'desk_product', title: 'Loan Product & Desk', subtitle: 'Select loan desk & specific product category', icon: Building2 },
    { id: 2, key: 'applicant_info', title: 'Applicant Information', subtitle: 'Contact & KYC identity details', icon: UserCheck },
    { id: 3, key: 'financial_details', title: 'Loan & Financial Profile', subtitle: 'Loan amount, tenure & income details', icon: Coins },
    { id: 4, key: 'documents', title: 'Required Documents', subtitle: 'Upload KYC & financial proofs', icon: FileText },
    { id: 5, key: 'review_submit', title: 'Review & Submit', subtitle: 'Verify all details before final submission', icon: CheckCircle2 },
  ],
  INSURANCE: [
    { id: 1, key: 'desk_product', title: 'Insurance Cover & Desk', subtitle: 'Select policy desk & specific cover type', icon: Shield },
    { id: 2, key: 'applicant_info', title: 'Applicant Information', subtitle: 'Policyholder contact & identity info', icon: UserCheck },
    { id: 3, key: 'financial_details', title: 'Policy & Nominee Details', subtitle: 'Sum assured, tenure & nominee details', icon: Coins },
    { id: 4, key: 'documents', title: 'Required Documents', subtitle: 'Upload ID & policy verification docs', icon: FileText },
    { id: 5, key: 'review_submit', title: 'Review & Submit', subtitle: 'Verify policy details & submit', icon: CheckCircle2 },
  ],
  INVESTMENT: [
    { id: 1, key: 'desk_product', title: 'Investment Plan & Desk', subtitle: 'Select investment desk & scheme type', icon: TrendingUp },
    { id: 2, key: 'applicant_info', title: 'Investor Information', subtitle: 'Investor identity & contact details', icon: UserCheck },
    { id: 3, key: 'financial_details', title: 'Investment & Nominee Profile', subtitle: 'Plan amount, frequency & nominee details', icon: Coins },
    { id: 4, key: 'documents', title: 'Required Documents', subtitle: 'Upload KYC & bank verification docs', icon: FileText },
    { id: 5, key: 'review_submit', title: 'Review & Submit', subtitle: 'Review investment terms & submit', icon: CheckCircle2 },
  ],
};
