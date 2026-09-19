import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Search, Filter, Eye, UserCheck, Briefcase, PlusCircle, ArrowUpDown, ChevronLeft, ChevronRight, Clock, CheckCircle2, FileText, User as UserIcon, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { Application, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApplicationDetailsModal } from './ApplicationDetailsModal';
import { useAuth } from '../../context/AuthContext';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export const AgentApplications: React.FC<{ forcedType?: string }> = ({ forcedType }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: paramAppId } = useParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(forcedType || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  // Lazy Loading Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const urlAppId = paramAppId || searchParams.get('appId') || searchParams.get('id') || searchParams.get('applicationId');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(urlAppId);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!urlAppId);

  // Available Agents for Super Admin assignment
  const [availableAgents, setAvailableAgents] = useState<User[]>([]);

  const fetchApplications = async (pageToFetch = 1, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let url = `/applications?search=${encodeURIComponent(search)}&page=${pageToFetch}&limit=15`;
      const activeType = forcedType || typeFilter;
      if (activeType) url += `&type=${activeType}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (assignedFilter) url += `&assigned=${assignedFilter}`;

      const res = await api.get(url);
      if (res.data.success) {
        let fetchedList = res.data.data || [];
        if (sortOrder === 'oldest') {
          fetchedList = [...fetchedList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
          fetchedList = [...fetchedList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        if (isInitial) {
          setApplications(fetchedList);
        } else {
          setApplications((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newUnique = fetchedList.filter((a: Application) => !existingIds.has(a.id));
            return [...prev, ...newUnique];
          });
        }

        if (res.data.pagination) {
          const totalPages = res.data.pagination.totalPages || 1;
          setHasMore(pageToFetch < totalPages);
          setTotalCount(res.data.pagination.total || fetchedList.length);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (urlAppId) {
      setSelectedAppId(urlAppId);
      setIsModalOpen(true);
    }
  }, [urlAppId]);

  // Reset and fetch initial on filter change
  useEffect(() => {
    setPage(1);
    fetchApplications(1, true);
  }, [search, typeFilter, statusFilter, assignedFilter, forcedType, sortOrder]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchApplications(nextPage, false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      const fetchAgents = async () => {
        try {
          const res = await api.get('/users?role=LOAN_AGENT');
          const resIns = await api.get('/users?role=INSURANCE_AGENT');
          const resInv = await api.get('/users?role=INVESTMENT_AGENT');

          setAvailableAgents([
            ...(res.data.data || []),
            ...(resIns.data.data || []),
            ...(resInv.data.data || []),
          ]);
        } catch (err) {
          console.error('Failed to load agents list:', err);
        }
      };
      fetchAgents();
    }
  }, [user]);

  const handleAssignAgent = async (appId: string, agentId: string) => {
    try {
      await api.put(`/applications/${appId}/assign`, { agentId });
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const handleOpenModal = (appId: string) => {
    setSelectedAppId(appId);
    setIsModalOpen(true);
  };

  const getProductSchemeLabel = (app: Application) => {
    if (app.formData) {
      try {
        const parsed = typeof app.formData === 'string' ? JSON.parse(app.formData) : app.formData;
        if (parsed.productType) return parsed.productType;
        if (parsed.educationCourseName) return `Edu: ${parsed.educationCourseName}`;
        if (parsed.chitSchemeName) return `Chit: ${parsed.chitSchemeName}`;
      } catch (e) {
        // Fallback
      }
    }
    return app.purpose || app.type;
  };

  const activeCategory = forcedType || (user?.role === 'LOAN_AGENT' ? 'LOAN' : user?.role === 'INSURANCE_AGENT' ? 'INSURANCE' : user?.role === 'INVESTMENT_AGENT' ? 'INVESTMENT' : typeFilter);

  const getDeskTitle = () => {
    if (activeCategory === 'LOAN') return 'Loan Applications Desk';
    if (activeCategory === 'INSURANCE') return 'Insurance Applications Desk';
    if (activeCategory === 'INVESTMENT') return 'Investment Applications Desk';
    return 'All Applications Directory';
  };

  const getCreateButtonText = () => {
    if (activeCategory === 'LOAN') return 'Create LOAN Application';
    if (activeCategory === 'INSURANCE') return 'Create Insurance Application';
    if (activeCategory === 'INVESTMENT') return 'Create Investment Application';
    return 'Create Application';
  };

  const handleCreateClick = () => {
    if (!user) return;
    const targetType = activeCategory || 'LOAN';
    switch (user.role) {
      case 'SUPER_ADMIN':
        navigate(`/superadmin/create-application?type=${targetType}`);
        break;
      case 'LOAN_AGENT':
        navigate('/loan-agent/create-application?type=LOAN');
        break;
      case 'INSURANCE_AGENT':
        navigate('/insurance-agent/create-application?type=INSURANCE');
        break;
      case 'INVESTMENT_AGENT':
        navigate('/investment-agent/create-application?type=INVESTMENT');
        break;
      case 'CUSTOMER':
        navigate(`/customer/create-application${targetType ? `?type=${targetType}` : ''}`);
        break;
      default:
        navigate(`/create-application?type=${targetType}`);
    }
  };

  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];
  const hasLoans = userServices.includes('LOANS') || userServices.includes('LOAN');
  const hasInsurance = userServices.includes('INSURANCE');
  const hasInvestments = userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS');

  const getDeskSubtitle = () => {
    if (activeCategory === 'LOAN') return 'End-to-end lifecycle tracking for Loan applications';
    if (activeCategory === 'INSURANCE') return 'End-to-end lifecycle tracking for Insurance applications';
    if (activeCategory === 'INVESTMENT') return 'End-to-end lifecycle tracking for Investment applications';
    return 'End-to-end lifecycle tracking for Loans, Insurance, and Investments';
  };

  const getProgressPercent = (status: string): number => {
    switch (status) {
      case 'DRAFT': return 15;
      case 'SUBMITTED': return 30;
      case 'ASSIGNED': return 45;
      case 'UNDER_REVIEW': return 60;
      case 'INFORMATION_REQUIRED':
      case 'DOCUMENTS_REQUIRED': return 75;
      case 'VERIFICATION': return 88;
      case 'APPROVED':
      case 'COMPLETED':
      case 'DISBURSED': return 100;
      case 'REJECTED': return 100;
      default: return 25;
    }
  };

  // Metrics summary values
  const inProgressCount = applications.filter((a) =>
    ['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'INFORMATION_REQUIRED', 'DOCUMENTS_REQUIRED', 'VERIFICATION'].includes(a.status)
  ).length;
  const approvedCount = applications.filter((a) => ['APPROVED', 'COMPLETED', 'DISBURSED'].includes(a.status)).length;
  const overallTotal = totalCount || applications.length;

  if (isModalOpen && selectedAppId) {
    return (
      <ApplicationDetailsModal
        applicationId={selectedAppId}
        isOpen={true}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppId(null);
        }}
        onStatusUpdated={fetchApplications}
        isFullPage={true}
      />
    );
  }

  const getCreatorInfo = (app: Application) => {
    if (!app.createdBy) {
      return {
        name: app.customer ? `${app.customer.firstName} ${app.customer.lastName || ''}`.trim() : 'Customer',
        idCode: app.customer?.customerIdCode || '',
        roleLabel: 'CUSTOMER',
      };
    }
    const creator = app.createdBy;
    const name = `${creator.firstName || ''} ${creator.lastName || ''}`.trim();
    const idCode = creator.customerIdCode || creator.agentIdCode || creator.superAdminIdCode || creator.adminIdCode || '';
    const roleLabel = creator.role === 'SUPER_ADMIN' ? 'Super Admin' : creator.role.replace('_AGENT', ' Agent').replace('_', ' ');
    return { name, idCode, roleLabel };
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {getDeskTitle()}
          </h2>
          <p className="text-xs text-slate-500">
            {getDeskSubtitle()}
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{getCreateButtonText()}</span>
        </button>
      </div>

      {/* Top Metric Summary Cards matching Reference Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider block">IN PROGRESS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{inProgressCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Under active review & verification</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider block">OFFERS / APPROVED</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{approvedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Sanctioned & completed</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">TOTAL APPLICATIONS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{overallTotal}</span>
            <span className="text-[10px] text-slate-500 font-medium">Across selected services</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Customer Header Card if user is CUSTOMER matching Reference Image 1 */}
      {user?.role === 'CUSTOMER' && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 font-black text-xl flex items-center justify-center border-2 border-white/20 shadow-inner">
              {user.firstName ? user.firstName[0].toUpperCase() : 'C'}
              {user.lastName ? user.lastName[0].toUpperCase() : ''}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/40">
                  {user.customerIdCode || 'CUST-2026-000001'}
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Verified Customer
                </span>
              </div>
              <h3 className="text-lg font-black mt-0.5">{user.firstName} {user.lastName || ''}</h3>
              <p className="text-xs text-slate-300">{user.email} • {user.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            {hasLoans && <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-extrabold border border-white/10">Loans Enabled</span>}
            {hasInsurance && <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-extrabold border border-white/10">Insurance Enabled</span>}
            {hasInvestments && <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-extrabold border border-white/10">Investments Enabled</span>}

            <button
              onClick={handleCreateClick}
              className="ml-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Application</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Application ID, Customer ID/Name, Creator ID/Name, Agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {!forcedType && (
            <SearchableSelect
              options={[
                { value: '', label: 'All Categories' },
                ...((user?.role === 'SUPER_ADMIN' || hasLoans) ? [{ value: 'LOAN', label: 'LOAN' }] : []),
                ...((user?.role === 'SUPER_ADMIN' || hasInsurance) ? [{ value: 'INSURANCE', label: 'INSURANCE' }] : []),
                ...((user?.role === 'SUPER_ADMIN' || hasInvestments) ? [{ value: 'INVESTMENT', label: 'INVESTMENT' }] : []),
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All Categories"
              searchPlaceholder="Search category..."
              className="w-36"
            />
          )}

          <SearchableSelect
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'SUBMITTED', label: 'SUBMITTED' },
              { value: 'ASSIGNED', label: 'ASSIGNED' },
              { value: 'UNDER_REVIEW', label: 'UNDER REVIEW' },
              { value: 'INFORMATION_REQUIRED', label: 'INFORMATION REQUIRED' },
              { value: 'DOCUMENTS_REQUIRED', label: 'DOCUMENTS REQUIRED' },
              { value: 'VERIFICATION', label: 'VERIFICATION' },
              { value: 'APPROVED', label: 'APPROVED' },
              { value: 'REJECTED', label: 'REJECTED' },
              { value: 'COMPLETED', label: 'COMPLETED' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            searchPlaceholder="Search status..."
            className="w-40"
          />

          {user?.role === 'SUPER_ADMIN' && (
            <SearchableSelect
              options={[
                { value: '', label: 'All Assignments' },
                { value: 'unassigned', label: 'Unassigned Only' },
              ]}
              value={assignedFilter}
              onChange={setAssignedFilter}
              placeholder="All Assignments"
              searchPlaceholder="Search assignment..."
              className="w-36"
            />
          )}

          <SearchableSelect
            options={[
              { value: 'latest', label: 'Latest First' },
              { value: 'oldest', label: 'Oldest First' },
            ]}
            value={sortOrder}
            onChange={(val) => setSortOrder(val as 'latest' | 'oldest')}
            placeholder="Sort Order"
            searchPlaceholder="Search sort..."
            className="w-32"
          />
        </div>
      </div>      {/* Applications Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium border-collapse min-w-[1250px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-extrabold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-5">APPLICATION ID</th>
                <th className="py-4 px-5">CUSTOMER NAME & ID</th>
                <th className="py-4 px-5">CREATED BY</th>
                <th className="py-4 px-5">CATEGORY & SCHEME</th>
                <th className="py-4 px-5">AMOUNT</th>
                <th className="py-4 px-5">STATUS & PROGRESS</th>
                <th className="py-4 px-5">ASSIGNED AGENT</th>
                <th className="py-4 px-5">SUBMISSION DATE</th>
                <th className="py-4 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                    {user?.role === 'CUSTOMER' ? (
                      <div className="space-y-1 py-4">
                        <p className="font-extrabold text-slate-800 text-sm">No applications found</p>
                        <p className="text-xs text-slate-500">Create your first application to get started.</p>
                      </div>
                    ) : (
                      'No applications match criteria.'
                    )}
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const pct = getProgressPercent(app.status);
                  const creator = getCreatorInfo(app);
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5 align-top">
                        <span className="font-extrabold text-blue-700 text-xs sm:text-sm font-mono block">{app.id}</span>
                        <span className="inline-block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          Priority: {app.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="py-4 px-5 align-top max-w-[220px]">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {app.customer?.firstName} {app.customer?.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {app.customer?.customerIdCode && (
                            <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                              {app.customer.customerIdCode}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 truncate">{app.customer?.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 align-top max-w-[200px]">
                        <p className="font-bold text-slate-900 text-xs truncate">{creator.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider whitespace-nowrap">
                            {creator.roleLabel}
                          </span>
                          {creator.idCode && (
                            <span className="font-mono text-[11px] text-slate-600 font-medium whitespace-nowrap">
                              {creator.idCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 align-top max-w-[180px]">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                          {app.type}
                        </span>
                        <p className="text-xs text-slate-800 font-extrabold truncate mt-1">
                          {getProductSchemeLabel(app)}
                        </p>
                      </td>
                      <td className="py-4 px-5 align-top font-black text-sm text-emerald-700 whitespace-nowrap">
                        {app.amount ? `₹ ${app.amount.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="py-4 px-5 align-top min-w-[150px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <StatusBadge status={app.status} />
                            <span className="text-[10px] font-black text-slate-600">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                app.status === 'REJECTED'
                                  ? 'bg-rose-500'
                                  : pct === 100
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 align-top min-w-[170px]">
                        {user?.role === 'SUPER_ADMIN' ? (
                          <SearchableSelect
                            options={[
                              { value: '', label: '-- Assign Agent --' },
                              ...availableAgents
                                .filter((ag) => {
                                  if (app.type === 'LOAN') return ag.role === 'LOAN_AGENT';
                                  if (app.type === 'INSURANCE') return ag.role === 'INSURANCE_AGENT';
                                  if (app.type === 'INVESTMENT') return ag.role === 'INVESTMENT_AGENT';
                                  return false;
                                })
                                .map((ag) => ({
                                  value: ag.id,
                                  label: `${ag.firstName} ${ag.lastName || ''} (${ag.agentIdCode || ag.role.replace('_', ' ')})`,
                                })),
                            ]}
                            value={app.assignedAgentId || ''}
                            onChange={(val) => handleAssignAgent(app.id, val)}
                            placeholder="-- Assign Agent --"
                            searchPlaceholder="Search agent..."
                            className="w-48 text-xs"
                          />
                        ) : (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800">
                              {app.assignedAgent ? `${app.assignedAgent.firstName} ${app.assignedAgent.lastName}` : 'Unassigned'}
                            </p>
                            {app.assignedAgent?.agentIdCode && (
                              <span className="text-[10px] font-mono text-slate-500">
                                {app.assignedAgent.agentIdCode}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 align-top text-slate-600 font-semibold text-xs whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenModal(app.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="h-4 w-4" /> View & Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infinite Scroll Lazy Loading Trigger */}
      <LazyLoadTrigger
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={loadingMore}
        totalItems={totalCount}
        endMessage="You're all caught up."
      />

      {/* Application Details & Action Modal */}
      <ApplicationDetailsModal
        applicationId={selectedAppId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdated={fetchApplications}
      />
    </div>
  );
};
