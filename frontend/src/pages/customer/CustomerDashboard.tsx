import React, { useState, useEffect } from 'react';
import { PlusCircle, FileText, FolderOpen, Bell, ArrowRight, ShieldCheck, Clock, CheckCircle2, Sparkles, DollarSign, Calculator, Landmark, Shield, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import DashboardFooter from '../../components/common/DashboardFooter';

export const CustomerDashboard: React.FC = () => {

  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // EMI Calculator widget state
  const [calcAmount, setCalcAmount] = useState('25000');
  const [calcRate, setCalcRate] = useState('8.5');
  const [calcTerm, setCalcTerm] = useState('36');
  const [estimatedMonthly, setEstimatedMonthly] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load customer dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Compute EMI when inputs change
  useEffect(() => {
    const p = parseFloat(calcAmount) || 0;
    const r = (parseFloat(calcRate) || 0) / 12 / 100;
    const n = parseFloat(calcTerm) || 1;
    if (p > 0 && r > 0 && n > 0) {
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setEstimatedMonthly(Math.round(emi));
    } else {
      setEstimatedMonthly(0);
    }
  }, [calcAmount, calcRate, calcTerm]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const { metrics, recentApps } = data || {};

  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];
  const hasLoans = userServices.includes('LOANS') || userServices.includes('LOAN');
  const hasInsurance = userServices.includes('INSURANCE');
  const hasInvestments = userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS');

  const enabledNames: string[] = [];
  if (hasLoans) enabledNames.push('loans');
  if (hasInsurance) enabledNames.push('insurance policies');
  if (hasInvestments) enabledNames.push('wealth investments');
  const heroServicesStr = enabledNames.length > 0 ? enabledNames.join(', ') : 'financial services';

  const enabledCategoryNames: string[] = [];
  if (hasLoans) enabledCategoryNames.push('Loan');
  if (hasInsurance) enabledCategoryNames.push('Insurance');
  if (hasInvestments) enabledCategoryNames.push('Investment');
  const step1ServicesStr = enabledCategoryNames.length > 0 ? enabledCategoryNames.join(', ') : 'financial services';

  return (
    <div className="space-y-6">
      {/* 1. Welcome Hero Banner with Gradient Glow */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0a1b33] via-[#0f2a52] to-[#163a70] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Welcome Back
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Hello, {user?.firstName} {user?.lastName}!</h2>
          <p className="text-xs text-blue-200 font-medium max-w-xl">
            Greetwell Financial Services Customer Hub — Access your {heroServicesStr} in one place.
          </p>
        </div>

        <Link
          to="/customer/create-application"
          className="z-10 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-xl hover:shadow-amber-500/20 flex items-center gap-2 uppercase tracking-wider flex-shrink-0"
        >
          <PlusCircle className="h-5 w-5" /> Create Application
        </Link>
      </div>

      {/* 2. Financial Service Selection Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-900">What financial service are you interested in?</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Choose a service to start a new application.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Loans Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-blue-50/50 to-white p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Landmark className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Loans</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Personal, Home, Education, and Business loans tailored to your goals with competitive rates.
              </p>
            </div>
            <Link
              to="/customer/create-application?type=LOAN"
              className="mt-6 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
            >
              Start Loan Application <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Insurance Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-purple-50/50 to-white p-6 flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all group">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Insurance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protect what matters most with customized Life, Health, Asset, and Vehicle coverage options.
              </p>
            </div>
            <Link
              to="/customer/create-application?type=INSURANCE"
              className="mt-6 w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
            >
              Explore Insurance <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Investments Card */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50/50 to-white p-6 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all group">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Wealth & Investments</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Grow your money with expert-managed Mutual Funds, SIP, and high-yield Investment options.
              </p>
            </div>
            <Link
              to="/customer/create-application?type=INVESTMENT"
              className="mt-6 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
            >
              Start Investment <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Visual 3-Step Application Process Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" /> Application Process Lifecycle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Submit Application</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Select {step1ServicesStr} and submit required details.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Agent Assignment & Verification</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Super Admin assigns a specialized agent to verify your uploaded ID & docs.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Approval & Completion</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Receive instant notification upon final approval and fund disbursement.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Stats & Interactive Calculator Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Summary Cards */}
        <div className={`${hasLoans ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Submissions</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.myApplications || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Docs</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{metrics?.pendingDocs || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <FolderOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unread Alerts</p>
                <p className="text-2xl font-black text-purple-600 mt-1">{metrics?.unreadNotifications || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Recent Submissions
              </h3>
              <Link to="/customer/applications" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentApps?.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  You have not submitted any applications yet. Click "Create Application" to begin.
                </div>
              ) : (
                recentApps?.map((app: any) => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-blue-700 text-sm">{app.id}</span>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-slate-700 font-bold mt-1">{app.type} Application • {app.purpose}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Assigned Agent: {app.assignedAgent ? `${app.assignedAgent.firstName} ${app.assignedAgent.lastName}` : 'Pending Agent Assignment'}
                      </p>
                    </div>
                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="font-black text-emerald-600 text-sm">
                        {app.amount ? `$${app.amount.toLocaleString()}` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Loan & Monthly Payment Estimator Widget */}
        {hasLoans && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="h-4 w-4 text-amber-500" /> Instant Loan Estimator
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loan Amount ($)</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tenure (Months)</label>
                <SearchableSelect
                  options={[
                    { value: '12', label: '12 Months (1 Year)' },
                    { value: '24', label: '24 Months (2 Years)' },
                    { value: '36', label: '36 Months (3 Years)' },
                    { value: '60', label: '60 Months (5 Years)' },
                  ]}
                  value={calcTerm}
                  onChange={setCalcTerm}
                  placeholder="Select tenure..."
                  searchPlaceholder="Search tenure..."
                  className="w-full"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-amber-400">Estimated Monthly Payment</span>
                <p className="text-2xl font-black text-white">${estimatedMonthly.toLocaleString()} / mo</p>
              </div>

              <Link
                to="/customer/create-application"
                className="block w-full py-2.5 text-center bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow"
              >
                Apply With These Terms
              </Link>
            </div>
          </div>
        )}
      </div>

      <DashboardFooter />
    </div>
  );
};

