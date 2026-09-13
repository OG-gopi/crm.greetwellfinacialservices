import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  Calendar,
  ShieldCheck,
  Layers,
  Code,
  Eye,
  ArrowRight,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Clock,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { Modal } from '../../components/common/Modal';

export const AuditLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MENU' | 'METHOD'>('ALL');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Selected Log for Inspection Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async (pageToFetch = 1, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `/audit-logs?page=${pageToFetch}&limit=15&search=${encodeURIComponent(search)}`;
      if (categoryFilter !== 'ALL') url += `&category=${categoryFilter}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (actionFilter) url += `&action=${actionFilter}`;

      const res = await api.get(url);
      if (res.data.success) {
        const fetchedList = res.data.data || [];
        if (isInitial) {
          setLogs(fetchedList);
        } else {
          setLogs((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const newUnique = fetchedList.filter((l: AuditLogItem) => !existingIds.has(l.id));
            return [...prev, ...newUnique];
          });
        }
        if (res.data.pagination) {
          setHasMore(pageToFetch < (res.data.pagination.totalPages || 1));
        } else {
          setHasMore(fetchedList.length === 15);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchLogs(1, true);
  }, [search, categoryFilter, roleFilter, actionFilter]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage, false);
    }
  };

  const getActionBadge = (action: string) => {
    const actUpper = action.toUpperCase();
    if (actUpper.includes('ADD') || actUpper.includes('CREATE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (actUpper.includes('REMOVE') || actUpper.includes('DELETE')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (actUpper.includes('ENABLE') || actUpper.includes('ACTIVATE') || actUpper.includes('DISABLE') || actUpper.includes('DEACTIVATE')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  // Extract structured inspection details from log entry
  const parseLogDetails = (log: AuditLogItem) => {
    const isMenu = log.entityType.includes('MENU') || log.action.includes('MENU');
    const isMethod = log.entityType.includes('METHOD') || log.action.includes('METHOD');

    let title = log.entityType.replace(/_/g, ' ');
    let pathOrEndpoint = '';

    const singleQuoteMatch = log.description.match(/'([^']+)'/);
    if (singleQuoteMatch && singleQuoteMatch[1]) {
      title = singleQuoteMatch[1];
    }

    const pathMatch = log.description.match(/\(([^)]+)\)/) || log.description.match(/\[([^\]]+)\]/);
    if (pathMatch && pathMatch[1]) {
      pathOrEndpoint = pathMatch[1];
    }

    const rolesList = [
      { code: 'SUPER_ADMIN', label: 'Super Admin' },
      { code: 'LOAN_AGENT', label: 'Loan Agent' },
      { code: 'INSURANCE_AGENT', label: 'Insurance Agent' },
      { code: 'INVESTMENT_AGENT', label: 'Investment Agent' },
      { code: 'CUSTOMER', label: 'Customer' },
    ];

    const roleStatuses: Record<string, 'ALLOWED' | 'DENIED' | 'NOT_SPECIFIED'> = {};
    rolesList.forEach(({ code }) => {
      if (log.description.includes(`${code}:ALLOWED`) || (log.description.includes(`role '${code}'`) && log.description.includes('ALLOWED'))) {
        roleStatuses[code] = 'ALLOWED';
      } else if (log.description.includes(`${code}:DENIED`) || (log.description.includes(`role '${code}'`) && log.description.includes('DENIED'))) {
        roleStatuses[code] = 'DENIED';
      } else {
        roleStatuses[code] = 'NOT_SPECIFIED';
      }
    });

    const targetTab = isMenu ? 'menu-items' : 'method-permissions';
    const redirectUrl = `/superadmin/permissions/${targetTab}?search=${encodeURIComponent(title)}`;

    return {
      isMenu,
      isMethod,
      title,
      pathOrEndpoint,
      rolesList,
      roleStatuses,
      redirectUrl,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Menu & Method Permission Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail recording all additions, updates, modifications, and removals of Menu Permissions and Method Permissions
          </p>
        </div>
      </div>

      {/* Filter Toolbar & Category Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> All Permission Logs
          </button>
          <button
            onClick={() => setCategoryFilter('MENU')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'MENU'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Menu Permissions
          </button>
          <button
            onClick={() => setCategoryFilter('METHOD')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              categoryFilter === 'METHOD'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Method Permissions
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search permission descriptions, entity IDs, roles, actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <SearchableSelect
              options={[
                { value: '', label: 'All Roles' },
                { value: 'SUPER_ADMIN', label: 'SUPER ADMIN' },
                { value: 'LOAN_AGENT', label: 'LOAN AGENT' },
                { value: 'INSURANCE_AGENT', label: 'INSURANCE AGENT' },
                { value: 'INVESTMENT_AGENT', label: 'INVESTMENT AGENT' },
                { value: 'CUSTOMER', label: 'CUSTOMER' },
              ]}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="All Roles"
              searchPlaceholder="Search role..."
              className="w-44"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="bg-slate-900 text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Permission Target</th>
                <th className="py-3.5 px-4">Step-by-Step Description</th>
                <th className="py-3.5 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading permission audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">No permission audit log entries matching filters.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </p>
                      <p className="text-[10px] text-slate-500">{log.user?.email || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase">
                        {log.userRole || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border uppercase inline-block ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-extrabold text-slate-900 block">{log.entityType}</span>
                      {log.entityId && <span className="text-[10px] font-mono text-slate-400">ID: {log.entityId}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all border border-blue-200 cursor-pointer shadow-2xs shrink-0"
                        title="Inspect exact permission change details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <LazyLoadTrigger
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={loadingMore}
          totalItems={logs.length}
          endMessage="You're all caught up with permission audit logs."
        />
      </div>

      {/* Permission Change Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Permission Change Inspection"
          maxWidth="max-w-2xl"
        >
          {(() => {
            const parsed = parseLogDetails(selectedLog);
            return (
              <div className="space-y-5 text-xs font-sans">
                {/* Header Banner */}
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white text-blue-700 border border-blue-200 shadow-2xs shrink-0">
                    {parsed.isMenu ? <Layers className="w-5 h-5" /> : <Code className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                        {parsed.isMenu ? 'Menu Permission Target' : 'Method Permission Target'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border uppercase ${getActionBadge(selectedLog.action)}`}>
                        {selectedLog.action}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{parsed.title}</h3>
                    {parsed.pathOrEndpoint && (
                      <p className="text-xs font-mono font-semibold text-blue-700 mt-0.5 bg-white/70 px-2 py-0.5 rounded border border-blue-100 inline-block">
                        {parsed.pathOrEndpoint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Access Status Grid */}
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" /> Role Permission Access Grid
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {parsed.rolesList.map(({ code, label }) => {
                      const status = parsed.roleStatuses[code];
                      return (
                        <div
                          key={code}
                          className={`p-3 rounded-xl border flex flex-col justify-between ${
                            status === 'ALLOWED'
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              : status === 'DENIED'
                              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="text-[11px] font-bold text-slate-800">{label}</span>
                          <div className="mt-2 flex items-center gap-1 font-extrabold text-[10.5px]">
                            {status === 'ALLOWED' && (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="text-emerald-700">ALLOWED</span>
                              </>
                            )}
                            {status === 'DENIED' && (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span className="text-rose-700">DENIED</span>
                              </>
                            )}
                            {status === 'NOT_SPECIFIED' && (
                              <>
                                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-500">NOT MODIFIED</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Action Step Log Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Recorded Step Description
                  </span>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Performed By Meta */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Performed By</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'Super Admin'}
                    </span>
                    <span className="text-[11px] text-slate-500">{selectedLog.user?.email || 'admin@greetwell.com'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Timestamp & IP</span>
                    <span className="font-bold text-slate-900 block mt-0.5 font-mono text-[11px]">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{selectedLog.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLog(null);
                      navigate(parsed.redirectUrl);
                    }}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open in Permissions Manager</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};


