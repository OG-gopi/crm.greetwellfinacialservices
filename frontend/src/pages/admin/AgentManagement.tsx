import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Edit,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Shield,
  Briefcase,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  User as UserIcon,
  X,
  Check,
  Award,
  AlertCircle,
  ExternalLink,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { User, InvitationItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { InviteAgentModal } from '../../components/common/InviteAgentModal';
import { Modal } from '../../components/common/Modal';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { SearchableSelect, SelectOption } from '../../components/common/SearchableSelect';

export const AgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'invitations'>('agents');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedAgentDetails, setSelectedAgentDetails] = useState<User | null>(null);
  const [editingAgent, setEditingAgent] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>('LOAN_AGENT');
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [viewingDocsAgent, setViewingDocsAgent] = useState<User | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [invitationFilter, setInvitationFilter] = useState('ALL');

  // Action Loading & Toast Feedback
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes, invRes] = await Promise.all([
        api.get('/users?role=AGENTS&limit=1000'),
        api.get('/users/invitations'),
      ]);

      const fetchedAgents: User[] = agentsRes.data.data || [];
      const fetchedInvitations: InvitationItem[] = (invRes.data.data || []).filter(
        (inv: InvitationItem) => ['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(inv.role)
      );

      setAgents(fetchedAgents);
      setInvitations(fetchedInvitations);
    } catch (err: any) {
      console.error('Failed to load agent management data:', err);
      showToast('error', 'Failed to load agents data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Agents List
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        (agent.agentIdCode && agent.agentIdCode.toLowerCase().includes(search)) ||
        agent.firstName.toLowerCase().includes(search) ||
        (agent.lastName && agent.lastName.toLowerCase().includes(search)) ||
        agent.email.toLowerCase().includes(search) ||
        (agent.phone && agent.phone.toLowerCase().includes(search));

      // Role Filter
      const matchesRole = roleFilter === 'ALL' || agent.role === roleFilter;

      // Status Filter
      const matchesStatus = statusFilter === 'ALL' || agent.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [agents, searchTerm, roleFilter, statusFilter]);

  // Filtered Invitations List
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        (inv.agentIdCode && inv.agentIdCode.toLowerCase().includes(search)) ||
        (inv.firstName && inv.firstName.toLowerCase().includes(search)) ||
        (inv.lastName && inv.lastName.toLowerCase().includes(search)) ||
        inv.email.toLowerCase().includes(search);

      const matchesRole = roleFilter === 'ALL' || inv.role === roleFilter;
      const matchesInvStatus = invitationFilter === 'ALL' || inv.status === invitationFilter;

      return matchesSearch && matchesRole && matchesInvStatus;
    });
  }, [invitations, searchTerm, roleFilter, invitationFilter]);

  // Metrics
  const loanAgentsCount = useMemo(() => agents.filter((a) => a.role === 'LOAN_AGENT').length, [agents]);
  const insAgentsCount = useMemo(() => agents.filter((a) => a.role === 'INSURANCE_AGENT').length, [agents]);
  const invesAgentsCount = useMemo(() => agents.filter((a) => a.role === 'INVESTMENT_AGENT').length, [agents]);
  const pendingInvitesCount = useMemo(
    () => invitations.filter((i) => ['PENDING', 'INVITATION_SENT'].includes(i.status)).length,
    [invitations]
  );

  // Lazy Loading Visible List
  const [visibleCount, setVisibleCount] = useState(20);
  const activeList = activeTab === 'agents' ? filteredAgents : filteredInvitations;
  const visibleList = useMemo(() => activeList.slice(0, visibleCount), [activeList, visibleCount]);
  const hasMore = visibleCount < activeList.length;

  useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, searchTerm, roleFilter, statusFilter, invitationFilter]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setInvitationFilter('ALL');
    setVisibleCount(20);
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    showToast('success', 'Invitation URL copied to clipboard!');
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setActionLoadingId(invitationId);
    try {
      const res = await api.post(`/users/invitations/${invitationId}/resend`);
      if (res.data.success) {
        showToast('success', `Agent invitation successfully resent to ${email}`);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to resend invitation email.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAgentStatus = async (agent: User) => {
    const newStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoadingId(agent.id);
    try {
      const res = await api.put(`/users/${agent.id}/status`, { status: newStatus });
      if (res.data.success) {
        showToast('success', `Agent ${agent.firstName} ${agent.lastName || ''} status updated to ${newStatus}.`);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update agent status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'LOAN_AGENT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INSURANCE_AGENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INVESTMENT_AGENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'LOAN_AGENT':
        return 'Loan Agent';
      case 'INSURANCE_AGENT':
        return 'Insurance Agent';
      case 'INVESTMENT_AGENT':
        return 'Investment Agent';
      default:
        return role.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
              : 'bg-rose-950 text-rose-100 border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <p className="text-xs font-medium">{toastMessage.text}</p>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#0c5837]" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agents Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage all GFS agents, their roles, profiles, and account status.
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-5 py-2.5 bg-[#0c5837] hover:bg-[#084229] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-all active:scale-95"
        >
          <UserPlus className="h-4 w-4" /> Invite Agent
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Total Agents</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{agents.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Active Portal Workforce</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-blue-600">Loan Agents</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{loanAgentsCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Credit & Borrowing</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-emerald-600">Insurance Agents</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{insAgentsCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Coverage & Claims</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-purple-600">Investment Agents</p>
          <p className="text-2xl font-black text-purple-900 mt-1">{invesAgentsCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Wealth & Assets</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <p className="text-[11px] font-semibold uppercase text-amber-600">Pending Invitations</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingInvitesCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting Activation</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('agents');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'agents'
                ? 'bg-white border-[#0c5837] text-[#0c5837] shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" /> Registered Agents ({filteredAgents.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('invitations');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'invitations'
                ? 'bg-white border-[#0c5837] text-[#0c5837] shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="h-4 w-4" /> Invitation Records ({filteredInvitations.length})
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Agent ID (AGT-2026-XXXXXX), Name, Email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0c5837] focus:border-transparent outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Role */}
            <SearchableSelect
              options={[
                { value: 'ALL', label: 'All Roles' },
                { value: 'LOAN_AGENT', label: 'Loan Agent' },
                { value: 'INSURANCE_AGENT', label: 'Insurance Agent' },
                { value: 'INVESTMENT_AGENT', label: 'Investment Agent' },
              ]}
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
              placeholder="All Roles"
              searchPlaceholder="Search role..."
              className="w-44"
            />

            {/* Account / Invitation Status Filter */}
            {activeTab === 'agents' ? (
              <SearchableSelect
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                ]}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="All Statuses"
                searchPlaceholder="Search status..."
                className="w-44"
              />
            ) : (
              <SearchableSelect
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'INVITATION_SENT', label: 'Sent' },
                  { value: 'VERIFIED', label: 'Verified' },
                  { value: 'EXPIRED', label: 'Expired' },
                  { value: 'FAILED', label: 'Failed' },
                ]}
                value={invitationFilter}
                onChange={(val) => {
                  setInvitationFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="All Statuses"
                searchPlaceholder="Search status..."
                className="w-44"
              />
            )}

            {/* Reset Button */}
            {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' || invitationFilter !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Registered Agents Table */}
        {activeTab === 'agents' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Agent ID</th>
                  <th className="py-3.5 px-4">Agent Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Education</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0c5837] border-t-transparent" />
                        Loading agents directory...
                      </div>
                    </td>
                  </tr>
                ) : visibleList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <p className="font-bold text-slate-700 text-sm">No agents found matching criteria.</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting filters or click "Invite Agent" above.</p>
                    </td>
                  </tr>
                ) : (
                  (visibleList as User[]).map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Agent ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {agent.agentIdCode ? (
                          <span className="font-mono font-bold text-[#0c5837] bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-[11px] shadow-2xs">
                            {agent.agentIdCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Agent Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">
                          {agent.firstName} {agent.lastName || ''}
                        </p>
                        <p className="text-[11px] text-slate-500">{agent.email}</p>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase border ${getRoleBadgeStyle(
                            agent.role
                          )}`}
                        >
                          {getRoleDisplayName(agent.role)}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {agent.phone || 'N/A'}
                      </td>

                      {/* Education */}
                      <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-700 font-semibold" title={agent.education || 'N/A'}>
                        {agent.education || 'N/A'}
                      </td>

                      {/* Experience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {agent.hasExperience ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            {agent.yearsOfExperience ? `${agent.yearsOfExperience} Yrs Exp` : 'Experienced'}
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            No Experience
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={agent.status} />
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {agent.createdAt
                          ? new Date(agent.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedAgentDetails(agent)}
                          title="View Agent Details"
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Edit Agent */}
                        <button
                          onClick={() => {
                            setEditingAgent(agent);
                            setEditRole(agent.role);
                            setEditStatus(agent.status);
                          }}
                          title="Edit Agent Details"
                          className="p-1.5 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* View Documents */}
                        <button
                          onClick={() => setViewingDocsAgent(agent)}
                          title="View Uploaded Documents"
                          className="p-1.5 text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>

                        {/* Toggle Status (Active / Inactive) */}
                        <button
                          onClick={() => handleToggleAgentStatus(agent)}
                          disabled={actionLoadingId === agent.id}
                          title={agent.status === 'ACTIVE' ? 'Deactivate Agent' : 'Activate Agent'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            agent.status === 'ACTIVE'
                              ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {agent.status === 'ACTIVE' ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Agent Invitations Table */}
        {activeTab === 'invitations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Agent ID</th>
                  <th className="py-3.5 px-4">Recipient Name / Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Invite Status</th>
                  <th className="py-3.5 px-4">Delivery</th>
                  <th className="py-3.5 px-4">Sent Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <p className="font-bold text-slate-700 text-sm">No agent invitation records found.</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Invite Agent" above to send a new invitation.</p>
                    </td>
                  </tr>
                ) : (
                  (visibleList as InvitationItem[]).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Agent ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                        {inv.agentIdCode ? (
                          <span className="font-mono font-bold text-[#0c5837] bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-[11px]">
                            {inv.agentIdCode}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">
                          {inv.firstName || 'Agent'} {inv.lastName || ''}
                        </p>
                        <p className="text-[11px] text-slate-500">{inv.email}</p>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase border ${getRoleBadgeStyle(
                            inv.role
                          )}`}
                        >
                          {getRoleDisplayName(inv.role)}
                        </span>
                      </td>

                      {/* Invitation Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={inv.status} />
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            inv.deliveryStatus === 'SENT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.deliveryStatus === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {inv.deliveryStatus || 'SENT'}
                        </span>
                      </td>

                      {/* Sent Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {inv.createdAt
                          ? new Date(inv.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                        {/* Copy Link */}
                        <button
                          onClick={() => copyInviteLink(inv.token)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 inline-flex items-center gap-1 border border-slate-200 transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copy Link
                        </button>

                        {/* Resend Invitation */}
                        {inv.status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleResendInvitation(inv.id, inv.email)}
                            disabled={actionLoadingId === inv.id}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-[#0c5837] hover:bg-emerald-100 inline-flex items-center gap-1 border border-emerald-200 transition-colors"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${actionLoadingId === inv.id ? 'animate-spin' : ''}`}
                            />{' '}
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Infinite Scroll Lazy Loading Trigger */}
        <LazyLoadTrigger
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={false}
          totalItems={activeList.length}
          endMessage="You're all caught up."
        />
      </div>

      {/* 1. Invite Agent Modal */}
      <InviteAgentModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          showToast('success', 'Agent invitation sent successfully!');
          fetchData();
        }}
      />

      {/* 2. View Agent Details Modal */}
      {selectedAgentDetails && (
        <Modal
          isOpen={!!selectedAgentDetails}
          onClose={() => setSelectedAgentDetails(null)}
          title={`Agent Profile Details – ${selectedAgentDetails.agentIdCode || 'AGT'}`}
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Header info */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedAgentDetails.firstName} {selectedAgentDetails.lastName || ''}
                </h3>
                <p className="text-xs text-slate-500">{selectedAgentDetails.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase border ${getRoleBadgeStyle(
                      selectedAgentDetails.role
                    )}`}
                  >
                    {getRoleDisplayName(selectedAgentDetails.role)}
                  </span>
                  <StatusBadge status={selectedAgentDetails.status} />
                </div>
              </div>

              {selectedAgentDetails.agentIdCode && (
                <div className="text-right bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Assigned Agent ID</p>
                  <p className="font-mono text-base font-black text-[#0c5837]">
                    {selectedAgentDetails.agentIdCode}
                  </p>
                </div>
              )}
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedAgentDetails.phone || 'N/A'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedAgentDetails.dob
                    ? new Date(selectedAgentDetails.dob).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Highest Education</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedAgentDetails.education || 'N/A'}</p>
              </div>
            </div>

            {/* Work Experience Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#0c5837]" /> Prior Work Experience
              </h4>

              {selectedAgentDetails.hasExperience ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Previous Company</span>
                    <p className="font-bold text-slate-800">{selectedAgentDetails.previousCompany || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Job Role</span>
                    <p className="font-bold text-slate-800">{selectedAgentDetails.previousJobRole || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Years of Experience</span>
                    <p className="font-bold text-slate-800">{selectedAgentDetails.yearsOfExperience || 'N/A'} Years</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic">No prior financial work experience declared.</p>
              )}
            </div>

            {/* Documents Preview Link */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Verification & Documents</p>
                <p className="text-[11px] text-slate-500">Mandatory Aadhaar, Education & Experience certs</p>
              </div>
              <button
                onClick={() => {
                  const agentToView = selectedAgentDetails;
                  setSelectedAgentDetails(null);
                  setViewingDocsAgent(agentToView);
                }}
                className="px-3 py-1.5 bg-[#0c5837] text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" /> View Documents
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Edit Agent Details Modal */}
      {editingAgent && (
        <Modal
          isOpen={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          title={`Edit Agent Profile – ${editingAgent.agentIdCode || editingAgent.firstName}`}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const form = e.currentTarget;
                const formData = new FormData(form);
                const updatePayload = {
                  firstName: formData.get('firstName') as string,
                  lastName: (formData.get('lastName') as string) || null, // Optional!
                  phone: formData.get('phone') as string,
                  role: editRole,
                  education: formData.get('education') as string,
                  status: editStatus,
                };

                const res = await api.put(`/users/${editingAgent.id}`, updatePayload);
                if (res.data.success) {
                  showToast('success', 'Agent details updated successfully!');
                  setEditingAgent(null);
                  fetchData();
                }
              } catch (err: any) {
                showToast('error', err.response?.data?.message || 'Failed to update agent.');
              }
            }}
            className="space-y-4 text-xs font-medium"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  defaultValue={editingAgent.firstName}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0c5837]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Last Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  defaultValue={editingAgent.lastName || ''}
                  placeholder="Optional last name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0c5837]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingAgent.phone || ''}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0c5837]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Agent Role <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={[
                    { value: 'LOAN_AGENT', label: 'Loan Agent' },
                    { value: 'INSURANCE_AGENT', label: 'Insurance Agent' },
                    { value: 'INVESTMENT_AGENT', label: 'Investment Agent' },
                  ]}
                  value={editRole}
                  onChange={setEditRole}
                  placeholder="Select agent role..."
                  searchPlaceholder="Search role..."
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Highest Education</label>
              <input
                type="text"
                name="education"
                defaultValue={editingAgent.education || ''}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0c5837]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Account Status</label>
              <SearchableSelect
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'INACTIVE', label: 'INACTIVE' },
                  { value: 'PENDING_VERIFICATION', label: 'PENDING VERIFICATION' },
                  { value: 'SUSPENDED', label: 'SUSPENDED' },
                ]}
                value={editStatus}
                onChange={setEditStatus}
                placeholder="Select status..."
                searchPlaceholder="Search status..."
                className="w-full"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0c5837] hover:bg-[#084229] text-white font-bold rounded-xl shadow-md"
              >
                Save Agent Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. View Documents Modal */}
      {viewingDocsAgent && (
        <Modal
          isOpen={!!viewingDocsAgent}
          onClose={() => setViewingDocsAgent(null)}
          title={`Agent Verification Documents – ${viewingDocsAgent.firstName} ${viewingDocsAgent.lastName || ''}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              Uploaded verification documents associated with Agent ID{' '}
              <strong className="text-[#0c5837] font-mono">{viewingDocsAgent.agentIdCode || 'AGT'}</strong>.
            </p>

            {/* Aadhaar Document (Optional) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0c5837]" />
                  <span className="font-bold text-slate-900">Aadhaar Identity Document</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-200 text-slate-700 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Government Issued Aadhaar Card PDF / Image</p>
              </div>
              <a
                href={viewingDocsAgent.aadhaarDocUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#0c5837] text-white font-bold rounded-lg flex items-center gap-1 hover:bg-[#084229]"
              >
                <ExternalLink className="h-3 w-3" /> View Doc
              </a>
            </div>

            {/* Education Document (Optional) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-slate-900">Education Qualification Certificate</span>
                  <span className="px-2 py-0.5 text-[9px] font-semibold uppercase bg-slate-200 text-slate-700 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Highest Degree / Diploma Document</p>
              </div>
              {viewingDocsAgent.educationDocUrl ? (
                <a
                  href={viewingDocsAgent.educationDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-1 hover:bg-blue-700"
                >
                  <ExternalLink className="h-3 w-3" /> View Doc
                </a>
              ) : (
                <span className="text-slate-400 italic text-[11px]">Not Uploaded</span>
              )}
            </div>

            {/* Experience Document (Optional) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  <span className="font-bold text-slate-900">Prior Work Experience Certificate</span>
                  <span className="px-2 py-0.5 text-[9px] font-semibold uppercase bg-slate-200 text-slate-700 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Relieving Letter / Experience Proof</p>
              </div>
              {viewingDocsAgent.experienceDocUrl ? (
                <a
                  href={viewingDocsAgent.experienceDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-lg flex items-center gap-1 hover:bg-purple-700"
                >
                  <ExternalLink className="h-3 w-3" /> View Doc
                </a>
              ) : (
                <span className="text-slate-400 italic text-[11px]">Not Uploaded</span>
              )}
            </div>

            {/* Other Supporting Document (Optional) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">Supporting Certifications / Documents</span>
                  <span className="px-2 py-0.5 text-[9px] font-semibold uppercase bg-slate-200 text-slate-700 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Other Licenses / Certifications</p>
              </div>
              {viewingDocsAgent.otherDocUrl ? (
                <a
                  href={viewingDocsAgent.otherDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1 hover:bg-emerald-700"
                >
                  <ExternalLink className="h-3 w-3" /> View Doc
                </a>
              ) : (
                <span className="text-slate-400 italic text-[11px]">Not Uploaded</span>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AgentManagement;
