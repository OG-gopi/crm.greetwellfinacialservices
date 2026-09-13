import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  FileText,
  Shield,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  MessageSquare,
  Bell,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  Filter,
  Download,
  RefreshCw,
  Eye,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appTypeFilter, setAppTypeFilter] = useState('ALL');

  const getGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load admin dashboard stats:', err);
      setError('Unable to fetch live dashboard metrics. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-12 text-slate-500 font-semibold text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span>Loading GFS Super Admin Live Dashboard Analytics...</span>
        </div>
      </div>
    );
  }

  const { metrics, charts, recentApplications = [], recentActivities = [] } = data || {};

  // Filter recent applications
  const filteredApplications = (recentApplications || []).filter((app: any) => {
    const matchesSearch =
      app.id.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
      `${app.customer?.firstName} ${app.customer?.lastName}`.toLowerCase().includes(appSearchTerm.toLowerCase());
    const matchesType = appTypeFilter === 'ALL' || app.type === appTypeFilter;
    return matchesSearch && matchesType;
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 text-slate-900 font-sans pb-10">


      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* 2. 12 Dashboard Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Customers */}
        <Link to="/superadmin/customers" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ 12%</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Customers</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.totalCustomers || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Verified user accounts</p>
          </div>
        </Link>

        {/* Card 2: Total Agents */}
        <Link to="/superadmin/agents/manage" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <UserCheck className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Agents</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.totalAgents || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Across 3 domains</p>
          </div>
        </Link>

        {/* Card 3: Loan Agents */}
        <Link to="/superadmin/agents/manage" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Loans</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Loan Agents</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.totalLoanAgents || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Credit advisors</p>
          </div>
        </Link>

        {/* Card 4: Insurance Agents */}
        <Link to="/superadmin/agents/manage" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Insurance</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Insurance Agents</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.totalInsuranceAgents || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Policy underwriters</p>
          </div>
        </Link>

        {/* Card 5: Investment Agents */}
        <Link to="/superadmin/agents/manage" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Investment</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Investment Agents</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.totalInvestmentAgents || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Wealth managers</p>
          </div>
        </Link>

        {/* Card 6: Total Applications */}
        <Link to="/superadmin/applications/all" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">All Files</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.totalApplications || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Portal submissions</p>
          </div>
        </Link>

        {/* Card 7: Pending Applications */}
        <Link to="/superadmin/applications/all" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Action Req</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Apps</p>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">{metrics?.pendingApplications || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Awaiting assignment</p>
          </div>
        </Link>

        {/* Card 8: In Review Applications */}
        <Link to="/superadmin/applications/all" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">In Process</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">In Review</p>
            <h3 className="text-xl font-black text-blue-600 mt-0.5">{metrics?.inReviewApplications || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Agent verification</p>
          </div>
        </Link>

        {/* Card 9: Approved Applications */}
        <Link to="/superadmin/applications/all" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Approved</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Approved Apps</p>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{metrics?.approvedApplications || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Cleared for payout</p>
          </div>
        </Link>

        {/* Card 10: Active Products */}
        <Link to="/superadmin/products/catalog" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded">Catalog</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Products</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.activeProducts || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Live CMS catalog</p>
          </div>
        </Link>

        {/* Card 11: Pending Complaints */}
        <Link to="/superadmin/enquiries" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Support</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Enquiries</p>
            <h3 className="text-xl font-black text-rose-600 mt-0.5">{metrics?.pendingEnquiries || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Open tickets</p>
          </div>
        </Link>

        {/* Card 12: Notifications */}
        <Link to="/superadmin/notifications" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Bell className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">Unread</span>
          </div>
          <div className="mt-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unread Alerts</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{metrics?.unreadNotificationsCount || 0}</h3>
            <p className="text-[10px] text-slate-500 mt-1">System broadcasts</p>
          </div>
        </Link>
      </div>

      {/* 3. DASHBOARD CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Application Growth Trends AreaChart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Monthly Applications Growth Trends</h3>
              <p className="text-[11px] text-slate-500">Volume tracking across Loans, Insurance, and Investments</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-blue-600 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Loans
              </span>
              <span className="flex items-center gap-1 font-bold text-purple-600 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Insurance
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-600 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Investments
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInsurance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="Loans" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLoans)" />
                <Area type="monotone" dataKey="Insurance" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorInsurance)" />
                <Area type="monotone" dataKey="Investments" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInvestments)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Status Distribution Donut PieChart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Application Status Breakdown</h3>
            <p className="text-[11px] text-slate-500">Live processing stage proportions</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.statusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700 pt-2 border-t border-slate-100">
            {(charts?.statusDistribution || []).map((s: any) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-mono text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. DASHBOARD CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Workload BarChart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Agent Workload & Performance</h3>
              <p className="text-[11px] text-slate-500">Assigned application count per specialized agent</p>
            </div>
            <Link to="/superadmin/agents/manage" className="text-xs font-bold text-blue-600 hover:underline">
              Manage Agents
            </Link>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.agentPerformance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="applications" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Registration Trends BarChart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Customer Registration Onboarding Growth</h3>
              <p className="text-[11px] text-slate-500">New verified customer accounts registered</p>
            </div>
            <Link to="/superadmin/customers" className="text-xs font-bold text-blue-600 hover:underline">
              View Customers
            </Link>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.registrationTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="Customers" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: RECENT APPLICATIONS & RECENT ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Recent Applications Command Center</h3>
              <p className="text-[11px] text-slate-500">Live submissions across Loans, Insurance, and Investments</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Type Filter */}
              <SearchableSelect
                options={[
                  { value: 'ALL', label: 'All Types' },
                  { value: 'LOAN', label: 'Loans' },
                  { value: 'INSURANCE', label: 'Insurance' },
                  { value: 'INVESTMENT', label: 'Investments' },
                ]}
                value={appTypeFilter}
                onChange={setAppTypeFilter}
                placeholder="All Types"
                searchPlaceholder="Search type..."
                className="w-36"
              />

              <Link
                to="/superadmin/applications/all"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Agent</th>
                  <th className="py-2.5 px-3">Created Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-extrabold text-blue-700">
                        {app.id}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {app.customer ? `${app.customer.firstName} ${app.customer.lastName}` : 'Customer'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          app.type === 'LOAN' ? 'bg-blue-50 text-blue-700' : app.type === 'INSURANCE' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {app.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {app.assignedAgent ? (
                          <span className="flex items-center gap-1 text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            {app.assignedAgent.firstName} {app.assignedAgent.lastName}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to="/superadmin/applications/all"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Activities Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">System Audit Activity</h3>
              <p className="text-[11px] text-slate-500">Live system events & logs</p>
            </div>
            <Link to="/superadmin/audit-logs" className="text-xs font-bold text-blue-600 hover:underline">
              All Logs
            </Link>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No recent audit activities logged yet.
              </div>
            ) : (
              recentActivities.map((act: any) => (
                <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System User'}
                    </span>
                    <span className="text-[9px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-bold">
                      {act.userRole || act.user?.role || 'ADMIN'}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium text-[11px] leading-snug">
                    {act.description}
                  </p>

                  <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400 font-mono">
                    <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                    <span>{act.action}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
