import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Search,
  FileText,
  Paperclip,
  HelpCircle,
  XCircle,
  User as UserIcon,
  Shield,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Enquiry, EnquiryMessage } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export const EnquiriesPage: React.FC = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  // Related User Applications for Create Modal
  const [userApplications, setUserApplications] = useState<any[]>([]);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState('Account & Registration');
  const [relatedAppId, setRelatedAppId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Details Modal State
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Admin Management State inside Details Modal
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  // Confirmation Modal for Closing
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);

  // Service Scoping for Enquiry Categories
  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];
  const hasLoans = userServices.includes('LOANS') || userServices.includes('LOAN') || user?.role === 'LOAN_AGENT';
  const hasInsurance = userServices.includes('INSURANCE') || user?.role === 'INSURANCE_AGENT';
  const hasInvestments = userServices.includes('INVESTMENT') || userServices.includes('INVESTMENTS') || user?.role === 'INVESTMENT_AGENT';

  const availableCategories = [
    ...(user?.role === 'SUPER_ADMIN' || hasLoans ? ['Loan'] : []),
    ...(user?.role === 'SUPER_ADMIN' || hasInsurance ? ['Insurance'] : []),
    ...(user?.role === 'SUPER_ADMIN' || hasInvestments ? ['Investment'] : []),
    'Account & Registration',
    'Technical Support',
    'Documents',
    'Payments',
    'Other',
  ];

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchEnquiries = async (pageToFetch = 1, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      let url = `/enquiries?search=${encodeURIComponent(search)}&page=${pageToFetch}&limit=15`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (priorityFilter) url += `&priority=${encodeURIComponent(priorityFilter)}`;

      const res = await api.get(url);
      if (res.data.success) {
        let fetchedList = res.data.data || [];
        if (sortOrder === 'oldest') {
          fetchedList = [...fetchedList].sort((a: Enquiry, b: Enquiry) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
          fetchedList = [...fetchedList].sort((a: Enquiry, b: Enquiry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        if (isInitial) {
          setEnquiries(fetchedList);
        } else {
          setEnquiries((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newUnique = fetchedList.filter((e: Enquiry) => !existingIds.has(e.id));
            return [...prev, ...newUnique];
          });
        }

        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
        if (res.data.pagination) {
          setHasMore(pageToFetch < (res.data.pagination.totalPages || 1));
        } else {
          setHasMore(fetchedList.length === 15);
        }
      }
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchEnquiries(1, true);
  }, [search, categoryFilter, statusFilter, priorityFilter, sortOrder]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchEnquiries(nextPage, false);
    }
  };

  useEffect(() => {
    const loadUserApps = async () => {
      try {
        const res = await api.get('/enquiries/my-applications');
        if (res.data.success) {
          setUserApplications(res.data.data || []);
        }
      } catch (e) {
        console.error('Failed to load user applications:', e);
      }
    };

    const loadAgents = async () => {
      if (user?.role === 'SUPER_ADMIN') {
        try {
          const res = await api.get('/users?status=ACTIVE');
          if (res.data.success) {
            setAvailableAgents((res.data.data || []).filter((u: any) => u.role.includes('AGENT')));
          }
        } catch (e) {
          console.error('Failed to load agents:', e);
        }
      }
    };

    loadUserApps();
    loadAgents();
  }, [user]);

  const fetchEnquiryDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/enquiries/${id}`);
      if (res.data.success) {
        const enq: Enquiry = res.data.data;
        setSelectedEnquiry(enq);
        setNewStatus(enq.status);
        setNewPriority(enq.priority);
        setAssignedAgentId(enq.assignedAgentId || '');
        setResolutionComment(enq.resolutionComment || '');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load enquiry details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDetails = (id: string) => {
    setSelectedEnquiryId(id);
    fetchEnquiryDetails(id);
  };

  // Indian Mobile Validation (10 to 12 numeric digits)
  const validatePhoneInput = (val: string) => {
    setContactPhone(val);
    if (!val) {
      setPhoneError('');
      return true;
    }
    const clean = val.replace(/[\s\-\+\(\)]/g, '');
    if (!/^\d+$/.test(clean)) {
      setPhoneError('Only numeric digits allowed.');
      return false;
    }
    if (clean.length < 10 || clean.length > 12) {
      setPhoneError('Mobile number must be between 10 and 12 digits.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Subject and Description are required.');
      return;
    }

    if (contactPhone && !validatePhoneInput(contactPhone)) {
      alert('Please fix the mobile number validation error before submitting.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await api.post('/enquiries', {
        subject,
        category,
        relatedApplicationId: relatedAppId || undefined,
        description,
        priority,
        attachmentUrl: attachmentUrl || undefined,
        contactPhone: contactPhone || undefined,
      });

      if (res.data.success) {
        alert(`Enquiry submitted successfully! Ticket ID: ${res.data.data.id}`);
        setIsCreateOpen(false);
        setSubject('');
        setDescription('');
        setAttachmentUrl('');
        setRelatedAppId('');
        fetchEnquiries();
        handleOpenDetails(res.data.data.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create enquiry.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await api.post(`/enquiries/${selectedEnquiry.id}/messages`, {
        message: replyMessage,
        attachmentUrl: replyAttachmentUrl || undefined,
      });

      if (res.data.success) {
        setReplyMessage('');
        setReplyAttachmentUrl('');
        fetchEnquiryDetails(selectedEnquiry.id);
        fetchEnquiries();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    setSubmittingStatus(true);
    try {
      const res = await api.put(`/enquiries/${selectedEnquiry.id}/status`, {
        status: newStatus,
        priority: newPriority,
        assignedAgentId: assignedAgentId || null,
        resolutionComment: resolutionComment || undefined,
      });

      if (res.data.success) {
        alert('Enquiry status and parameters updated successfully.');
        fetchEnquiryDetails(selectedEnquiry.id);
        fetchEnquiries();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update enquiry.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      await api.put(`/enquiries/${id}/status`, { status: 'CLOSED' });
      setClosingTicketId(null);
      if (selectedEnquiryId === id) {
        fetchEnquiryDetails(id);
      }
      fetchEnquiries();
    } catch (err: any) {
      alert('Failed to close enquiry ticket.');
    }
  };

  const handleReopenTicket = async (id: string) => {
    try {
      await api.put(`/enquiries/${id}/status`, { status: 'IN_PROGRESS' });
      if (selectedEnquiryId === id) {
        fetchEnquiryDetails(id);
      }
      fetchEnquiries();
    } catch (err: any) {
      alert('Failed to reopen enquiry ticket.');
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    if (p === 'HIGH') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (p === 'MEDIUM') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Enquiries & Complaints Management</h2>
          <p className="text-xs text-slate-500">Track your enquiries, receive official responses, and resolve support tickets</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Enquiry</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">TOTAL ENQUIRIES</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.total}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider block">OPEN</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.open}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider block">IN PROGRESS</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.inProgress}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">RESOLVED</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.resolved}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Enquiry ID, Subject, or Related Application ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <SearchableSelect
            options={[
              { value: '', label: 'All Categories' },
              ...availableCategories.map((cat) => ({ value: cat, label: cat })),
            ]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All Categories"
            searchPlaceholder="Search category..."
            className="w-40"
          />

          <SearchableSelect
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'OPEN', label: 'OPEN' },
              { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
              { value: 'AWAITING_INFORMATION', label: 'AWAITING INFORMATION' },
              { value: 'RESOLVED', label: 'RESOLVED' },
              { value: 'CLOSED', label: 'CLOSED' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            searchPlaceholder="Search status..."
            className="w-40"
          />

          <SearchableSelect
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'LOW', label: 'LOW' },
              { value: 'MEDIUM', label: 'MEDIUM' },
              { value: 'HIGH', label: 'HIGH' },
            ]}
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="All Priorities"
            searchPlaceholder="Search priority..."
            className="w-36"
          />

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
      </div>

      {/* Enquiries Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-medium">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Enquiry ID</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Related App ID</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading enquiry tickets...</td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm">No enquiries found</h3>
                      <p className="text-xs text-slate-500">
                        Have a question or need assistance with your applications? Submit an enquiry ticket to get support.
                      </p>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <PlusCircle className="w-4 h-4" /> Create Enquiry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-blue-700">{enq.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-extrabold text-[10px]">
                        {enq.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[200px] truncate">{enq.subject}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {enq.relatedApplicationId || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${getPriorityBadgeClass(enq.priority)}`}>
                        {enq.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={enq.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetails(enq.id)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                      >
                        View Details
                      </button>

                      {enq.status !== 'CLOSED' && (
                        <button
                          onClick={() => setClosingTicketId(enq.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300"
                        >
                          Close
                        </button>
                      )}
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
          totalItems={enquiries.length}
          endMessage="You're all caught up."
        />
      </div>

      {/* CREATE ENQUIRY FORM MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Submit New Support Enquiry" maxWidth="max-w-xl">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-extrabold text-slate-800 mb-1">Enquiry Category: *</label>
            <SearchableSelect
              options={availableCategories.map((cat) => ({ value: cat, label: cat }))}
              value={category}
              onChange={setCategory}
              placeholder="Select category..."
              searchPlaceholder="Search category..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-800 mb-1">Related Application (Optional):</label>
            <SearchableSelect
              options={[
                { value: '', label: '-- None / General Enquiry --' },
                ...userApplications.map((app) => ({
                  value: app.id,
                  label: `${app.id} (${app.type} - ${app.status})`,
                })),
              ]}
              value={relatedAppId}
              onChange={setRelatedAppId}
              placeholder="Select related application..."
              searchPlaceholder="Search application..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-800 mb-1">Subject: *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your enquiry..."
              className="w-full p-2.5 border rounded-lg bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-800 mb-1">Detailed Description: *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete details, account information, or specific issue description..."
              className="w-full p-2.5 border rounded-lg bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-slate-800 mb-1">Priority Level:</label>
              <SearchableSelect
                options={[
                  { value: 'LOW', label: 'LOW' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'HIGH', label: 'HIGH' },
                ]}
                value={priority}
                onChange={(val) => setPriority(val as any)}
                placeholder="Select priority..."
                searchPlaceholder="Search priority..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 mb-1">Contact Phone (Indian Mobile):</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => validatePhoneInput(e.target.value)}
                placeholder="10 to 12 digits (e.g. 9876543210)"
                className={`w-full p-2.5 border rounded-lg text-xs ${phoneError ? 'border-rose-500 bg-rose-50' : 'bg-white'}`}
              />
              {phoneError && <p className="text-[10px] font-bold text-rose-600 mt-0.5">{phoneError}</p>}
            </div>
          </div>

          <div>
            <label className="block font-extrabold text-slate-800 mb-1">Attachment URL (Optional Document/Image):</label>
            <input
              type="text"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 border rounded-lg bg-white text-xs"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
            <p className="font-bold text-[10px] text-slate-700">Contact Email (Auto-filled):</p>
            <p className="font-mono text-xs">{user?.email}</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border rounded-lg font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCreate}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm"
            >
              {submittingCreate ? 'Submitting...' : 'Submit Support Enquiry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ENQUIRY DETAILS & CONVERSATION THREAD MODAL */}
      <Modal isOpen={!!selectedEnquiryId} onClose={() => { setSelectedEnquiryId(null); setSelectedEnquiry(null); }} title={`Support Ticket Details: ${selectedEnquiry?.id || ''}`} maxWidth="max-w-4xl">
        {loadingDetails || !selectedEnquiry ? (
          <div className="py-12 text-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-2" />
            Loading enquiry details and discussion thread...
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Header Ticket Summary Card */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-blue-300">{selectedEnquiry.id}</span>
                  <StatusBadge status={selectedEnquiry.status} />
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getPriorityBadgeClass(selectedEnquiry.priority)}`}>
                    {selectedEnquiry.priority}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-white mt-1">{selectedEnquiry.subject}</h3>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Category: <strong>{selectedEnquiry.category}</strong> • Created: {new Date(selectedEnquiry.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Submitted By:</p>
                <p className="font-bold text-blue-300">
                  {selectedEnquiry.raisedByUser?.firstName} {selectedEnquiry.raisedByUser?.lastName || ''} ({selectedEnquiry.raisedByUser?.role})
                </p>
                <p className="text-[10px] text-slate-400">{selectedEnquiry.contactEmail}</p>
              </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              
              {/* Left Column: Details & Discussion Thread (~7 cols) */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Description Box */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase border-b pb-1">Original Issue Description</h4>
                  <p className="text-slate-700 leading-relaxed">{selectedEnquiry.description}</p>
                  {selectedEnquiry.attachmentUrl && (
                    <a
                      href={selectedEnquiry.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 font-bold underline text-[10px] mt-2 block"
                    >
                      <Paperclip className="w-3 h-3" /> View Initial Attachment
                    </a>
                  )}
                </div>

                {/* Conversation Messages Thread */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase border-b pb-2 flex items-center justify-between">
                    <span>Communication Thread</span>
                    <span className="text-[10px] text-slate-500 font-normal">{selectedEnquiry.messages?.length || 0} messages</span>
                  </h4>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {selectedEnquiry.messages?.map((msg: EnquiryMessage) => {
                      const isAdmin = msg.senderRole === 'SUPER_ADMIN';
                      return (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl border space-y-1.5 ${
                            isAdmin
                              ? 'bg-blue-50/70 border-blue-200 ml-4'
                              : 'bg-white border-slate-200 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1">
                              {msg.sender?.firstName} {msg.sender?.lastName || ''}
                              <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                {msg.senderRole.replace('_', ' ')}
                              </span>
                            </span>
                            <span className="text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed text-xs">{msg.message}</p>
                          {msg.attachmentUrl && (
                            <a
                              href={msg.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold underline text-[10px] inline-flex items-center gap-1 mt-1 block"
                            >
                              <Paperclip className="w-3 h-3" /> View Attachment
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reply Box */}
                {selectedEnquiry.status !== 'CLOSED' ? (
                  <form onSubmit={handleSendReply} className="p-3.5 border border-blue-200 rounded-xl bg-blue-50/40 space-y-2 shadow-sm">
                    <h4 className="font-extrabold text-slate-900 text-xs">Post Reply</h4>
                    <textarea
                      required
                      rows={3}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply message..."
                      className="w-full p-2.5 border rounded-lg bg-white text-xs"
                    />
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <input
                        type="text"
                        value={replyAttachmentUrl}
                        onChange={(e) => setReplyAttachmentUrl(e.target.value)}
                        placeholder="Optional attachment URL..."
                        className="w-full sm:w-2/3 p-2 border rounded-lg bg-white text-xs"
                      />
                      <button
                        type="submit"
                        disabled={submittingReply}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Post Reply
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl border text-center text-slate-500">
                    <Lock className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                    This ticket is closed. Reopen the ticket to send further replies.
                  </div>
                )}
              </div>

              {/* Right Column: Super Admin Controls & Audit History (~5 cols) */}
              <div className="md:col-span-5 space-y-4">
                
                {/* Admin Management Panel */}
                {user?.role === 'SUPER_ADMIN' ? (
                  <form onSubmit={handleUpdateStatusSubmit} className="p-4 border border-blue-200 rounded-xl bg-blue-50/30 space-y-3 shadow-sm">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase border-b border-blue-200 pb-2">
                      Super Admin Ticket Controls
                    </h4>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ticket Status:</label>
                      <SearchableSelect
                        options={[
                          { value: 'OPEN', label: 'OPEN' },
                          { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
                          { value: 'AWAITING_INFORMATION', label: 'AWAITING INFORMATION' },
                          { value: 'RESOLVED', label: 'RESOLVED' },
                          { value: 'CLOSED', label: 'CLOSED' },
                        ]}
                        value={newStatus}
                        onChange={setNewStatus}
                        placeholder="Select status..."
                        searchPlaceholder="Search status..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Priority:</label>
                      <SearchableSelect
                        options={[
                          { value: 'LOW', label: 'LOW' },
                          { value: 'MEDIUM', label: 'MEDIUM' },
                          { value: 'HIGH', label: 'HIGH' },
                        ]}
                        value={newPriority}
                        onChange={setNewPriority}
                        placeholder="Select priority..."
                        searchPlaceholder="Search priority..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Assign Handling Agent:</label>
                      <SearchableSelect
                        options={[
                          { value: '', label: '-- Unassigned --' },
                          ...availableAgents.map((ag) => ({
                            value: ag.id,
                            label: `${ag.firstName} ${ag.lastName || ''} (${ag.role.replace('_', ' ')})`,
                          })),
                        ]}
                        value={assignedAgentId}
                        onChange={setAssignedAgentId}
                        placeholder="Select agent..."
                        searchPlaceholder="Search agent..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Resolution Comment / Request Note:</label>
                      <textarea
                        rows={2}
                        value={resolutionComment}
                        onChange={(e) => setResolutionComment(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white text-xs"
                        placeholder="Resolution summary or information requested..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingStatus}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
                    >
                      {submittingStatus ? 'Updating...' : 'Save Ticket Status'}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 border rounded-xl bg-slate-50 space-y-3">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase border-b pb-1">Ticket Actions</h4>
                    {selectedEnquiry.status === 'RESOLVED' || selectedEnquiry.status === 'CLOSED' ? (
                      <button
                        onClick={() => handleReopenTicket(selectedEnquiry.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                      >
                        Reopen Enquiry Ticket
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCloseTicket(selectedEnquiry.id)}
                        className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs border border-slate-300"
                      >
                        Close Enquiry Ticket
                      </button>
                    )}
                  </div>
                )}

                {/* Audit History Log */}
                <div className="p-3 border rounded-xl bg-slate-50 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase border-b pb-1">Ticket Activity Log</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {selectedEnquiry.history?.map((h) => (
                      <div key={h.id} className="text-[10px] text-slate-600 border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-slate-800 block">{h.action.replace(/_/g, ' ')}</span>
                        <p>{h.details}</p>
                        <span className="text-slate-400 block text-[9px] mt-0.5">{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* TICKET CLOSURE CONFIRMATION MODAL */}
      <Modal isOpen={!!closingTicketId} onClose={() => setClosingTicketId(null)} title="Confirm Ticket Closure" maxWidth="max-w-md">
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 leading-relaxed">
            Are you sure you want to close enquiry ticket <strong>{closingTicketId}</strong>?
          </p>
          <p className="text-slate-500">
            Closing this ticket indicates that your issue has been addressed. You can reopen the ticket if further assistance is needed.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setClosingTicketId(null)}
              className="px-4 py-2 border rounded-lg font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => closingTicketId && handleCloseTicket(closingTicketId)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
            >
              Confirm Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
