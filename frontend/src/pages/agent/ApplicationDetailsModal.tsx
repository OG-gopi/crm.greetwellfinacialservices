import React, { useState, useEffect } from 'react';
import {
  FileText,
  User as UserIcon,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Send,
  MessageSquare,
  Lock,
  Eye,
  Download,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Shield,
  Layers,
  Calendar,
  Briefcase,
  DollarSign,
  Award,
  Upload,
  FileCheck,
  UserCheck,
  Sparkles,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import { Application, DocumentItem, NoteItem, TaskItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SearchableSelect } from '../../components/common/SearchableSelect';

interface ApplicationDetailsModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
  isFullPage?: boolean;
}

// Helper: Check if value is present
const isValPresent = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      !trimmed ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed === 'N/A' ||
      trimmed === 'n/a'
    )
      return false;
  }
  return true;
};

// Helper: Format full name safely without printing "null"
const formatFullName = (firstName?: string | null, lastName?: string | null): string => {
  const parts: string[] = [];
  if (isValPresent(firstName)) parts.push(firstName!.trim());
  if (isValPresent(lastName)) parts.push(lastName!.trim());
  return parts.length > 0 ? parts.join(' ') : '';
};

// Helper: Format file size in KB / MB
const formatFileSize = (bytes?: number): string => {
  if (!bytes || isNaN(bytes)) return '102 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper: Render summary card item with smooth rounded corners
const renderSummaryBlock = (label: string, val: any, prefix: string = '', suffix: string = '') => {
  if (!isValPresent(val)) return null;
  const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
  return (
    <div key={label} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all">
      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
        {prefix}{displayVal}{suffix}
      </span>
    </div>
  );
};

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  applicationId: initialAppId,
  isOpen,
  onClose,
  onStatusUpdated,
  isFullPage = true,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeAppId, setActiveAppId] = useState<string | null>(initialAppId);
  const [app, setApp] = useState<Application | null>(null);
  const [customerApps, setCustomerApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CUSTOMER_DETAILS' | 'SCHEME_DETAILS' | 'DOCUMENTS' | 'REQUESTS' | 'TASKS_NOTES' | 'HISTORY'
  >('OVERVIEW');

  // Status transition state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Document Upload State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // New Request state (Admin/Agent)
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDesc, setRequestDesc] = useState('');
  const [creatingRequest, setCreatingRequest] = useState(false);

  // Customer Reply state
  const [customerReplyText, setCustomerReplyText] = useState('');
  const [customerReplyDocUrl, setCustomerReplyDocUrl] = useState('');
  const [replyingRequestId, setReplyingRequestId] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  // New Note state
  const [noteContent, setNoteContent] = useState('');
  const [isCustomerVisible, setIsCustomerVisible] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  // New Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  useEffect(() => {
    setActiveAppId(initialAppId);
  }, [initialAppId]);

  const fetchDetails = async (targetId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/applications/${targetId}`);
      if (res.data.success) {
        const fetchedApp = res.data.data;
        setApp(fetchedApp);
        setNewStatus(fetchedApp.status);

        // Fetch customer's other applications for sidebar switcher
        if (fetchedApp.customer?.email) {
          try {
            const custRes = await api.get(`/applications?search=${encodeURIComponent(fetchedApp.customer.email)}`);
            if (custRes.data.success) {
              setCustomerApps(custRes.data.data || []);
            }
          } catch (e) {
            console.error('Failed to load customer applications:', e);
          }
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeAppId) {
      fetchDetails(activeAppId);
    }
  }, [isOpen, activeAppId]);

  const handleUpdateStatus = async () => {
    if (!app || newStatus === app.status) return;
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/applications/${app.id}/status`, {
        status: newStatus,
        note: statusNote,
      });
      if (res.data.success) {
        showSuccess(`Application status updated to ${newStatus}.`);
        setStatusNote('');
        fetchDetails(app.id);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Status transition failed.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !uploadFile) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('applicationId', app.id);
      formData.append('title', uploadTitle.trim() || uploadFile.name);
      formData.append('file', uploadFile);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showSuccess(`Document '${uploadFile.name}' uploaded successfully!`);
        setUploadTitle('');
        setUploadFile(null);
        fetchDetails(app.id);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !requestTitle) return;
    setCreatingRequest(true);
    try {
      const res = await api.post(`/applications/${app.id}/requests`, {
        title: requestTitle,
        description: requestDesc,
      });
      if (res.data.success) {
        showSuccess('Information request created and sent to customer.');
        setRequestTitle('');
        setRequestDesc('');
        fetchDetails(app.id);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to create request.');
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleSubmitReply = async (requestId: string) => {
    setSubmittingReply(true);
    try {
      const res = await api.post(`/applications/requests/${requestId}/reply`, {
        customerReply: customerReplyText,
        replyDocUrl: customerReplyDocUrl,
      });
      if (res.data.success) {
        showSuccess('Reply submitted successfully.');
        setCustomerReplyText('');
        setCustomerReplyDocUrl('');
        setReplyingRequestId(null);
        fetchDetails(app!.id);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !noteContent) return;
    setSubmittingNote(true);
    try {
      const res = await api.post('/notes', {
        applicationId: app.id,
        content: noteContent,
        isCustomerVisible,
      });
      if (res.data.success) {
        showSuccess('Note recorded.');
        setNoteContent('');
        fetchDetails(app.id);
      }
    } catch (err: any) {
      showError('Failed to add note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !taskTitle) return;
    setSubmittingTask(true);
    try {
      const res = await api.post('/tasks', {
        applicationId: app.id,
        title: taskTitle,
        description: taskDesc,
        assignedToUserId: user?.id,
      });
      if (res.data.success) {
        showSuccess('Internal task added.');
        setTaskTitle('');
        setTaskDesc('');
        fetchDetails(app.id);
      }
    } catch (err: any) {
      showError('Failed to create task.');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleVerifyDoc = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    const reason = status === 'REJECTED' ? prompt('Reason for rejection:') : null;
    if (status === 'REJECTED' && !reason) return;

    try {
      const res = await api.put(`/documents/${docId}/verify`, { status, rejectionReason: reason });
      if (res.data.success) {
        showSuccess(`Document marked as ${status}.`);
        fetchDetails(app!.id);
      }
    } catch (err: any) {
      showError('Failed to update document verification status.');
    }
  };

  const getStageIndex = (status: string) => {
    const map: Record<string, number> = {
      SUBMITTED: 1,
      DOCUMENTS_SUBMITTED: 2,
      DOCUMENTS_REQUIRED: 2,
      PENDING_ASSIGNMENT: 3,
      ASSIGNED: 3,
      UNDER_REVIEW: 4,
      INFORMATION_REQUIRED: 5,
      VERIFICATION: 6,
      APPROVED: 7,
      REJECTED: 7,
      COMPLETED: 8,
      DISBURSED: 8,
    };
    return map[status] || 1;
  };

  const parseFormData = () => {
    if (!app || !app.formData) return null;
    try {
      return typeof app.formData === 'string' ? JSON.parse(app.formData) : app.formData;
    } catch (e) {
      return null;
    }
  };

  if (!isOpen) return null;

  const parsedForm = parseFormData();
  const currentStage = app ? getStageIndex(app.status) : 1;

  const assignedAgentName = app?.assignedAgent
    ? formatFullName(app.assignedAgent.firstName, app.assignedAgent.lastName)
    : '';

  const customerFullName = app?.customer
    ? formatFullName(app.customer.firstName, app.customer.lastName)
    : 'Customer';

  const customerInitials = app?.customer
    ? `${app.customer.firstName ? app.customer.firstName[0].toUpperCase() : ''}${app.customer.lastName ? app.customer.lastName[0].toUpperCase() : ''}`
    : 'LC';

  const getCategoryTabTitle = () => {
    if (app?.type === 'LOAN') return 'Loan Details';
    if (app?.type === 'INSURANCE') return 'Policy Details';
    if (app?.type === 'INVESTMENT') return 'Scheme Information';
    return 'Scheme Details';
  };

  const getFullFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getPermittedStatuses = () => {
    if (!app) return [];
    if (user?.role === 'SUPER_ADMIN') {
      return [
        'SUBMITTED',
        'DOCUMENTS_SUBMITTED',
        'ASSIGNED',
        'UNDER_REVIEW',
        'INFORMATION_REQUIRED',
        'DOCUMENTS_REQUIRED',
        'VERIFICATION',
        'APPROVED',
        'REJECTED',
        'COMPLETED',
      ];
    }
    const ALLOWED: Record<string, string[]> = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'UNDER_REVIEW', 'REJECTED'],
      PENDING_ASSIGNMENT: ['ASSIGNED', 'REJECTED'],
      ASSIGNED: ['UNDER_REVIEW', 'INFORMATION_REQUIRED', 'DOCUMENTS_REQUIRED', 'REJECTED'],
      UNDER_REVIEW: ['INFORMATION_REQUIRED', 'DOCUMENTS_REQUIRED', 'VERIFICATION', 'APPROVED', 'REJECTED'],
      INFORMATION_REQUIRED: ['UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'REJECTED'],
      DOCUMENTS_REQUIRED: ['UNDER_REVIEW', 'VERIFICATION', 'REJECTED'],
      VERIFICATION: ['APPROVED', 'REJECTED', 'INFORMATION_REQUIRED'],
      APPROVED: ['COMPLETED'],
      REJECTED: ['DRAFT', 'UNDER_REVIEW'],
      COMPLETED: [],
    };
    const allowed = ALLOWED[app.status] || [];
    return Array.from(new Set([app.status, ...allowed]));
  };

  // FULL PAGE CONTAINER WRAPPER
  const containerContent = (
    <div className="space-y-6 w-full max-w-full font-['Inter',sans-serif]">
      
      {/* PAGE TOP ACTION HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs border border-slate-200"
            title="Back to Applications List"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>Back to Applications</span>
          </button>
          <div>
            <h1 className="font-['Fraunces',serif] font-bold text-xl sm:text-2xl text-[#10233F] tracking-tight">
              Application Overview <span className="text-[#B8862E]">·</span> {app?.id || ''}
            </h1>
          </div>
        </div>

        {/* BREADCRUMBS TRAIL */}
        <div className="px-3.5 py-2 text-xs font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center flex-wrap gap-1.5">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>Applications</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">
            {app?.type === 'LOAN'
              ? 'Loan Applications'
              : app?.type === 'INSURANCE'
              ? 'Insurance Applications'
              : app?.type === 'INVESTMENT'
              ? 'Investment Applications'
              : 'Applications'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#10233F] font-black">{app?.id}</span>
        </div>
      </div>

      {loading || !app ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-24 text-center text-slate-500 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#B8862E] border-t-transparent mx-auto mb-3" />
          Loading application record details...
        </div>
      ) : (
        /* MAIN FULL-PAGE 2-COLUMN LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Customer Profile & Quick App Switcher (4 Cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* CUSTOMER PROFILE CARD */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#10233F] text-[#E8C877] flex items-center justify-center font-['Fraunces',serif] font-bold text-xl shrink-0 shadow-xs border-2 border-amber-400/30">
                  {customerInitials}
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[11px] font-extrabold text-[#10233F] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg mb-1">
                    {app.customer?.customerIdCode || 'CUS-2026-000001'}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 truncate">
                    {customerFullName}
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {renderSummaryBlock('Email Address', app.customer?.email)}
                {renderSummaryBlock('Mobile Phone', app.customer?.phone)}
                {app.customer?.education && renderSummaryBlock('Education Qualification', app.customer.education)}
                {app.customer?.hasExperience !== undefined && renderSummaryBlock('Prior Professional Experience', app.customer.hasExperience ? 'Yes' : 'No')}
                {app.customer?.previousCompany && renderSummaryBlock('Previous Employer', app.customer.previousCompany)}
                {app.customer?.previousJobRole && renderSummaryBlock('Previous Job Role', app.customer.previousJobRole)}
              </div>
            </div>

            {/* CUSTOMER APPLICATIONS SWITCHER */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#B8862E]" /> Customer Applications
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px]">
                  {customerApps.length} total
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {customerApps.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 italic">No other applications.</div>
                ) : (
                  customerApps.map((cApp) => {
                    const isCurrent = cApp.id === app.id;
                    return (
                      <div
                        key={cApp.id}
                        onClick={() => setActiveAppId(cApp.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-amber-50/70 to-white border-amber-300 border-l-4 border-l-[#B8862E] shadow-xs'
                            : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#10233F] text-xs">{cApp.id}</span>
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {cApp.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px] mt-0.5">
                            {cApp.purpose || `${cApp.type} Application`}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase whitespace-nowrap">
                          {cApp.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Hero Banner, Stepper, Tabs & Detailed Cards (8 Cols on lg) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* HERO BANNER CARD */}
            <div className="bg-gradient-to-r from-[#10233F] via-slate-900 to-[#0A1830] text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="bg-white/15 text-[#E8C877] font-extrabold text-xs tracking-wider px-3 py-1 rounded-lg uppercase backdrop-blur-xs">
                    {app.type}
                  </span>
                  <span className="font-['Fraunces',serif] font-bold text-2xl text-white">
                    {app.id}
                  </span>
                  <span className="bg-white/15 text-white font-extrabold text-xs px-3 py-1 rounded-lg uppercase">
                    {app.status}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Submitted on: <b className="text-[#E8C877] font-semibold">{new Date(app.createdAt).toLocaleString()}</b> &nbsp;·&nbsp; Priority: <b className="text-[#E8C877] font-semibold">{app.priority || 'MEDIUM'}</b>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] tracking-wider text-slate-400 font-extrabold uppercase mb-1">ASSIGNED AGENT</div>
                <div className="text-sm font-extrabold text-[#E8C877]">
                  {assignedAgentName || 'Awaiting assignment'}
                </div>
              </div>
            </div>

            {/* 8-STAGE PROCESSING LIFECYCLE STEPPER */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Application Processing Lifecycle Stepper
                </h4>
                <span className="text-xs font-extrabold text-[#B8862E]">Stage {currentStage} of 8</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-bold">
                {[
                  { idx: 1, name: 'Created' },
                  { idx: 2, name: 'Docs submitted' },
                  { idx: 3, name: 'Assigned' },
                  { idx: 4, name: 'Under review' },
                  { idx: 5, name: 'Info required' },
                  { idx: 6, name: 'Verification' },
                  { idx: 7, name: 'Decision' },
                  { idx: 8, name: 'Completed' },
                ].map((st) => {
                  const isActive = currentStage === st.idx;
                  const isPassed = currentStage > st.idx;
                  return (
                    <div
                      key={st.idx}
                      className={`p-2.5 rounded-xl transition-all relative ${
                        isActive
                          ? 'bg-[#10233F] text-white font-extrabold shadow-sm ring-2 ring-[#B8862E]/40'
                          : isPassed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold'
                          : 'bg-slate-50 text-slate-400 border border-slate-200/60 font-medium'
                      }`}
                    >
                      <span className="block text-[10px] opacity-70 mb-0.5">{st.idx}</span>
                      <span className="block truncate">{st.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TABS NAVIGATION BAR */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'OVERVIEW', label: 'Overview' },
                { id: 'CUSTOMER_DETAILS', label: 'Customer details' },
                { id: 'SCHEME_DETAILS', label: getCategoryTabTitle() },
                { id: 'DOCUMENTS', label: `Documents (${app.documents?.length || 0})` },
                { id: 'REQUESTS', label: `Comments & requests (${app.requirements?.length || 0})` },
                { id: 'TASKS_NOTES', label: `Tasks & notes (${(app.tasks?.length || 0) + (app.notes?.length || 0)})`, agentOnly: true },
                { id: 'HISTORY', label: 'App history' },
              ].map((t) => {
                if (t.agentOnly && user?.role === 'CUSTOMER') return null;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-[#10233F] text-white font-extrabold shadow-xs border border-[#10233F]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & APPLICATION SUMMARY BOX */}
            {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* APPLICATION SUMMARY BOX */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#B8862E]" /> Application Summary
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {renderSummaryBlock('Application Category', app.type)}
                    {renderSummaryBlock('Goal / Purpose', app.purpose || `${app.type} Application`)}
                    {renderSummaryBlock('Requested Amount', app.amount ? app.amount.toLocaleString() : 'N/A', '₹ ')}
                    {renderSummaryBlock('Tenure / Horizon', app.term || 'N/A')}
                    {renderSummaryBlock('Priority Level', app.priority || 'MEDIUM')}
                    {renderSummaryBlock('Submission Date', new Date(app.createdAt).toLocaleString())}
                    {renderSummaryBlock('Assigned Agent', assignedAgentName || 'Awaiting assignment')}
                  </div>
                </div>

                {/* UPDATE APPLICATION STATUS WORKFLOW BOX */}
                {user?.role !== 'CUSTOMER' && (
                  <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 border border-amber-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-amber-200/60 pb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#B8862E]" /> Update Application Status Workflow
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          New Permitted Status:
                        </label>
                        <SearchableSelect
                          options={getPermittedStatuses().map((st) => ({
                            value: st,
                            label: st.replace(/_/g, ' '),
                          }))}
                          value={newStatus}
                          onChange={setNewStatus}
                          placeholder="Select new status..."
                          searchPlaceholder="Search status..."
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Status Update Note (Customer Visible):
                        </label>
                        <textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Reason for status change…"
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 bg-white min-h-[80px] shadow-xs focus:ring-2 focus:ring-[#B8862E] focus:outline-none resize-y"
                        />
                      </div>

                      <button
                        onClick={handleUpdateStatus}
                        disabled={updatingStatus || newStatus === app.status}
                        className="w-full py-3 bg-[#B8862E] hover:bg-[#A5761F] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-40"
                      >
                        {updatingStatus ? 'Updating Status...' : 'Commit Status Transition'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: CUSTOMER DETAILS */}
            {activeTab === 'CUSTOMER_DETAILS' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#B8862E]" /> Customer Information & Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {renderSummaryBlock('Full Name', customerFullName)}
                  {renderSummaryBlock('Customer ID Code', app.customer?.customerIdCode)}
                  {renderSummaryBlock('Email Address', app.customer?.email)}
                  {renderSummaryBlock('Mobile Phone', app.customer?.phone)}
                  {app.customer?.dob && renderSummaryBlock('Date of Birth', new Date(app.customer.dob).toLocaleDateString())}
                  {renderSummaryBlock('Education Qualification', app.customer?.education)}
                  {app.customer?.hasExperience !== undefined && renderSummaryBlock('Prior Experience', app.customer.hasExperience ? 'Yes' : 'No')}
                  {renderSummaryBlock('Previous Employer', app.customer?.previousCompany)}
                  {renderSummaryBlock('Previous Job Role', app.customer?.previousJobRole)}
                  {renderSummaryBlock('Years of Experience', app.customer?.yearsOfExperience)}
                </div>
              </div>
            )}

            {/* TAB 3: SCHEME DETAILS */}
            {activeTab === 'SCHEME_DETAILS' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#B8862E]" />
                  {getCategoryTabTitle()} Details ({parsedForm?.selectedProduct || parsedForm?.productType || app.type})
                </h4>

                {parsedForm ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {Object.entries(parsedForm)
                      .filter(([k, v]) => !['customerName', 'email', 'phone'].includes(k) && isValPresent(v))
                      .map(([key, val]) =>
                        renderSummaryBlock(
                          key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
                          val
                        )
                      )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 italic text-xs">
                    No additional dynamic scheme parameters recorded for this application.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {activeTab === 'DOCUMENTS' && (
              <div className="space-y-5">
                {/* Upload Form */}
                <form onSubmit={handleUploadDocument} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#B8862E]" /> Upload New Document to Application
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Document Title (e.g. Income Proof, Aadhaar)"
                      className="p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                    />
                    <input
                      type="file"
                      required
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="p-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingDoc || !uploadFile}
                    className="px-5 py-2.5 bg-[#B8862E] hover:bg-[#A5761F] text-white font-extrabold rounded-xl text-xs transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc ? 'Uploading File...' : 'Upload Document'}</span>
                  </button>
                </form>

                {/* Documents List */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Attached Application Documents
                  </h4>

                  {app.documents?.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200/70 rounded-xl text-slate-400 text-xs">
                      No documents attached yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {app.documents?.map((doc) => {
                        const fullUrl = getFullFileUrl(doc.fileUrl);
                        const uploaderName = doc.uploadedByUser
                          ? formatFullName(doc.uploadedByUser.firstName, doc.uploadedByUser.lastName)
                          : 'Customer';

                        return (
                          <div
                            key={doc.id}
                            className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="p-2.5 bg-blue-50 text-[#10233F] rounded-xl shrink-0 border border-blue-100">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-slate-900 text-xs truncate">
                                  {doc.title}
                                </h5>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  File: <strong className="text-slate-800">{doc.fileName}</strong> ({formatFileSize(doc.fileSize)}) • Uploaded by: {uploaderName} • {new Date(doc.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                                  doc.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : doc.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {doc.status}
                              </span>

                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="p-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl transition-all flex items-center gap-1 font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              <a
                                href={fullUrl}
                                download={doc.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-[#10233F] hover:bg-[#0A1830] text-white rounded-xl transition-all flex items-center gap-1 font-bold text-[11px] shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>

                              {user?.role !== 'CUSTOMER' && doc.status === 'PENDING' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleVerifyDoc(doc.id, 'VERIFIED')}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] cursor-pointer shadow-2xs"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleVerifyDoc(doc.id, 'REJECTED')}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[10px] cursor-pointer shadow-2xs"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: COMMENTS & REQUESTS */}
            {activeTab === 'REQUESTS' && (
              <div className="space-y-5">
                {user?.role !== 'CUSTOMER' && (
                  <form onSubmit={handleCreateRequest} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#B8862E]" /> Create Information / Document Request to Customer
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={requestTitle}
                        onChange={(e) => setRequestTitle(e.target.value)}
                        placeholder="Request Title (e.g. Upload 3 Months Bank Statement)"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                      />
                      <input
                        type="text"
                        value={requestDesc}
                        onChange={(e) => setRequestDesc(e.target.value)}
                        placeholder="Description / Instructions for Customer"
                        className="p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingRequest}
                      className="px-5 py-2.5 bg-[#B8862E] hover:bg-[#A5761F] text-white font-extrabold rounded-xl text-xs cursor-pointer transition-all shadow-xs"
                    >
                      {creatingRequest ? 'Creating Request...' : 'Send Request & Notify Customer'}
                    </button>
                  </form>
                )}

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase">Application Requirements & Requests</h4>
                  {app.requirements?.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200/70 rounded-xl text-slate-400 text-xs italic">
                      No open requests or comment threads for this application.
                    </div>
                  ) : (
                    app.requirements?.map((req) => (
                      <div key={req.id} className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <span className="font-extrabold text-slate-900 text-xs">{req.title}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                              req.status === 'CUSTOMER_REPLIED'
                                ? 'bg-blue-100 text-blue-800'
                                : req.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        {req.description && <p className="text-slate-600 text-xs font-medium">{req.description}</p>}

                        {req.customerReply && (
                          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                            <p className="font-extrabold text-[10px] text-blue-700 uppercase">Customer Reply:</p>
                            <p className="text-xs font-medium">{req.customerReply}</p>
                            {req.replyDocUrl && (
                              <a
                                href={getFullFileUrl(req.replyDocUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 font-extrabold underline text-[10px] inline-flex items-center gap-1 mt-1"
                              >
                                <ExternalLink className="w-3 h-3" /> View Uploaded Reply Document
                              </a>
                            )}
                          </div>
                        )}

                        {user?.role === 'CUSTOMER' && req.status !== 'COMPLETED' && (
                          <div className="pt-2">
                            {replyingRequestId === req.id ? (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                                <textarea
                                  value={customerReplyText}
                                  onChange={(e) => setCustomerReplyText(e.target.value)}
                                  placeholder="Type your reply or explanation..."
                                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                                  rows={2}
                                />
                                <input
                                  type="text"
                                  value={customerReplyDocUrl}
                                  onChange={(e) => setCustomerReplyDocUrl(e.target.value)}
                                  placeholder="Document URL (Optional)"
                                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSubmitReply(req.id)}
                                    disabled={submittingReply}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                                  >
                                    Submit Reply
                                  </button>
                                  <button
                                    onClick={() => setReplyingRequestId(null)}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReplyingRequestId(req.id)}
                                className="px-4 py-2 bg-[#10233F] hover:bg-[#0A1830] text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
                              >
                                Reply to this Request
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: TASKS & NOTES */}
            {activeTab === 'TASKS_NOTES' && user?.role !== 'CUSTOMER' && (
              <div className="space-y-4">
                <form onSubmit={handleAddTask} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex gap-2">
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="New internal task title..."
                    className="flex-1 p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                  />
                  <button type="submit" disabled={submittingTask} className="px-5 py-2.5 bg-[#10233F] text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs">
                    Add Task
                  </button>
                </form>

                <form onSubmit={handleAddNote} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-3">
                  <textarea
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Type internal or customer note..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
                    rows={2}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                      <input
                        type="checkbox"
                        checked={isCustomerVisible}
                        onChange={(e) => setIsCustomerVisible(e.target.checked)}
                        className="rounded border-slate-300 text-[#B8862E]"
                      />
                      Make note visible to customer
                    </label>
                    <button type="submit" disabled={submittingNote} className="px-5 py-2.5 bg-[#B8862E] hover:bg-[#A5761F] text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs">
                      Post Note
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 7: APP HISTORY */}
            {activeTab === 'HISTORY' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#B8862E]" /> Application History & Audit Trail
                </h4>
                <div className="space-y-3">
                  <div className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/70 flex items-start gap-3">
                    <div className="p-2.5 bg-[#10233F] text-white rounded-xl shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Application Created & Submitted</div>
                      <div className="text-[11px] text-slate-400 font-medium">{new Date(app.createdAt).toLocaleString()}</div>
                      <div className="text-slate-600 text-xs mt-1 font-medium">
                        Initial category: <strong>{app.type}</strong> ({app.purpose || 'N/A'}) requested amount: ₹ {app.amount?.toLocaleString() || 'N/A'}.
                      </div>
                    </div>
                  </div>

                  {app.notes?.map((nt) => (
                    <div key={nt.id} className="p-4 border border-slate-200/80 rounded-xl bg-white flex items-start gap-3 shadow-xs">
                      <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {formatFullName(nt.authorUser?.firstName, nt.authorUser?.lastName)} ({nt.authorUser?.role.replace(/_/g, ' ')})
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{new Date(nt.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-600 text-xs mt-1 font-medium">{nt.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* DOCUMENT PREVIEW OVERLAY */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{previewDoc.fileName} ({formatFileSize(previewDoc.fileSize)})</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-[360px] max-h-[500px] overflow-auto bg-slate-900 rounded-xl flex items-center justify-center p-4">
              {previewDoc.mimeType?.startsWith('image/') || previewDoc.fileUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img
                  src={getFullFileUrl(previewDoc.fileUrl)}
                  alt={previewDoc.title}
                  className="max-h-[460px] object-contain rounded-lg shadow-lg"
                />
              ) : (
                <iframe
                  src={getFullFileUrl(previewDoc.fileUrl)}
                  title={previewDoc.title}
                  className="w-full h-[460px] rounded-lg bg-white"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Uploaded Date: {new Date(previewDoc.createdAt).toLocaleString()}
              </span>
              <a
                href={getFullFileUrl(previewDoc.fileUrl)}
                download={previewDoc.fileName}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 bg-[#B8862E] hover:bg-[#A5761F] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  return containerContent;
};
