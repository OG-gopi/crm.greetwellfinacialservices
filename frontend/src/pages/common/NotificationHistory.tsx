import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldAlert,
  ArrowRight,
  Check,
  CheckCheck,
  Layers,
  Inbox,
  UserCheck,
  CreditCard,
  Briefcase,
  TrendingUp,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { NotificationDetailsDrawer } from '../../components/common/NotificationDetailsDrawer';

export const NotificationHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead, updateActionStatus } = useNotifications();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    actionRequired: 0,
    actionTaken: 0,
    notRequired: 0,
  });
  
  // Lazy Loading Pagination State
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const limit = 20;

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [readStatusFilter, setReadStatusFilter] = useState<string>('ALL');
  const [actionStatusFilter, setActionStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Toast / Error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Notifications API call
  const fetchNotifications = async (pageToFetch: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.append('page', pageToFetch.toString());
      params.append('limit', limit.toString());

      if (selectedModule !== 'ALL') params.append('module', selectedModule);
      if (selectedSource !== 'ALL') params.append('source', selectedSource);
      if (readStatusFilter !== 'ALL') params.append('readStatus', readStatusFilter);
      if (actionStatusFilter !== 'ALL') params.append('actionStatus', actionStatusFilter);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/notifications?${params.toString()}`);
      if (res.data.success) {
        const fetchedItems: NotificationItem[] = res.data.data.notifications;
        const total = res.data.data.pagination?.total || 0;
        const totalPages = res.data.data.pagination?.totalPages || 1;

        if (isInitial) {
          setNotifications(fetchedItems);
        } else {
          // Prevent duplicates
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newUnique = fetchedItems.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newUnique];
          });
        }

        setCounts(res.data.data.counts);
        setHasMore(pageToFetch < totalPages);
      }
    } catch (err: any) {
      console.error('Failed to load notification history:', err);
      setErrorMessage(err.response?.data?.message || 'Unable to load notifications. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset and load initial page when filters change
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, true);
  }, [selectedModule, selectedSource, readStatusFilter, actionStatusFilter, debouncedSearch, startDate, endDate]);

  // Load next page on scroll trigger
  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, false);
    }
  }, [loading, loadingMore, hasMore, page]);

  // Refresh
  const handleRefresh = () => {
    setPage(1);
    fetchNotifications(1, true);
  };

  // Toggle Read/Unread
  const handleToggleRead = async (notification: NotificationItem) => {
    try {
      const newReadState = !notification.isRead;
      await api.put(`/notifications/${notification.id}/status`, { isRead: newReadState });
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: newReadState } : n))
      );
      
      if (selectedNotification?.id === notification.id) {
        setSelectedNotification((prev) => (prev ? { ...prev, isRead: newReadState } : null));
      }

      setCounts((prev) => ({
        ...prev,
        unread: newReadState ? Math.max(0, prev.unread - 1) : prev.unread + 1,
      }));
      
      if (newReadState) {
        markAsRead(notification.id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update notification read status.');
    }
  };

  // Mark All As Read
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCounts((prev) => ({ ...prev, unread: 0 }));
      setActionSuccess('All notifications marked as read.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to mark all as read.');
    }
  };

  // Action Status Updates (Admin & Agents)
  const handleUpdateAction = async (id: string, actionStatus: string) => {
    if (user?.role === 'CUSTOMER') {
      alert('Customers cannot modify action status directly. Please navigate to your application to complete required actions.');
      return;
    }

    try {
      await updateActionStatus(id, actionStatus);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, actionStatus: actionStatus as any } : n))
      );
      if (selectedNotification?.id === id) {
        setSelectedNotification((prev) => (prev ? { ...prev, actionStatus: actionStatus as any } : null));
      }
      // Refresh count summary
      fetchNotifications(1, true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update action status.');
    }
  };

  // Open Drawer Detail
  const handleOpenDetail = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setIsDrawerOpen(true);
    if (!notification.isRead) {
      handleToggleRead(notification);
    }
  };

  // Module Badges
  const getModuleBadge = (moduleStr?: string | null) => {
    const mod = (moduleStr || 'GENERAL').toUpperCase();
    switch (mod) {
      case 'LOANS':
        return { label: 'LOAN', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: CreditCard };
      case 'INSURANCE':
        return { label: 'INSURANCE', bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: Briefcase };
      case 'INVESTMENTS':
        return { label: 'INVESTMENT', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: TrendingUp };
      case 'DOCUMENTS':
        return { label: 'DOCUMENT', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: FileText };
      case 'ENQUIRIES':
        return { label: 'ENQUIRY', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: HelpCircle };
      case 'CUSTOMERS':
      case 'AGENTS':
      case 'USERS':
        return { label: 'USER', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: UserCheck };
      default:
        return { label: mod, bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: Layers };
    }
  };

  const userServices: string[] = Array.isArray(user?.serviceTypes)
    ? user.serviceTypes.map((s) => s.toUpperCase())
    : ['LOANS'];

  const getAvailableModuleTabs = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { id: 'ALL', label: 'All Modules' },
        { id: 'LOANS', label: 'Loans' },
        { id: 'INSURANCE', label: 'Insurance' },
        { id: 'INVESTMENTS', label: 'Investments' },
        { id: 'DOCUMENTS', label: 'Documents' },
        { id: 'ENQUIRIES', label: 'Enquiries' },
        { id: 'SYSTEM', label: 'System' },
      ];
    }
    if (user?.role === 'LOAN_AGENT') {
      return [
        { id: 'ALL', label: 'All Modules' },
        { id: 'LOANS', label: 'Loans' },
        { id: 'DOCUMENTS', label: 'Documents' },
        { id: 'ENQUIRIES', label: 'Enquiries' },
      ];
    }
    if (user?.role === 'INSURANCE_AGENT') {
      return [
        { id: 'ALL', label: 'All Modules' },
        { id: 'INSURANCE', label: 'Insurance' },
        { id: 'DOCUMENTS', label: 'Documents' },
        { id: 'ENQUIRIES', label: 'Enquiries' },
      ];
    }
    if (user?.role === 'INVESTMENT_AGENT') {
      return [
        { id: 'ALL', label: 'All Modules' },
        { id: 'INVESTMENTS', label: 'Investments' },
        { id: 'DOCUMENTS', label: 'Documents' },
        { id: 'ENQUIRIES', label: 'Enquiries' },
      ];
    }
    // CUSTOMER
    const tabs = [{ id: 'ALL', label: 'All Modules' }];
    if (userServices.includes('LOANS') || userServices.includes('LOAN')) tabs.push({ id: 'LOANS', label: 'Loans' });
    if (userServices.includes('INSURANCE')) tabs.push({ id: 'INSURANCE', label: 'Insurance' });
    if (userServices.includes('INVESTMENTS') || userServices.includes('INVESTMENT')) tabs.push({ id: 'INVESTMENTS', label: 'Investments' });
    tabs.push({ id: 'DOCUMENTS', label: 'Documents' });
    tabs.push({ id: 'ENQUIRIES', label: 'Enquiries' });
    return tabs;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#1d63ed] rounded-xl">
              <Bell className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                Notification Center
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase tracking-wider font-mono">
                  {user?.role?.replace(/_/g, ' ')}
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                {user?.role === 'SUPER_ADMIN'
                  ? 'Real-time multi-module notifications, audit trail & role management hub'
                  : user?.role?.includes('AGENT')
                  ? 'Assigned application alerts, customer requests & document updates'
                  : 'Personal application status updates, document requests & support notices'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleMarkAllRead}
            disabled={counts.unread === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-extrabold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark All as Read</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        </div>
      )}

      {/* 2. Dynamic Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">
              Total Alerts
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{counts.total}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Inbox className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        {/* Unread Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-amber-600 uppercase tracking-wider font-mono">
              Unread
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">{counts.unread}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        {/* Action Required */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-rose-600 uppercase tracking-wider font-mono">
              Action Required
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">{counts.actionRequired}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider font-mono">
              Completed
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{counts.actionTaken}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* 3. Module Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
        {/* Module Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-slate-100">
          {getAvailableModuleTabs().map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedModule(tab.id)}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all shrink-0 cursor-pointer ${
                selectedModule === tab.id
                  ? 'bg-[#1d63ed] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar & Primary Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, message, Application ID (e.g. LOAN-2026-000010)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Read Status Dropdown */}
          <SearchableSelect
            options={[
              { value: 'ALL', label: 'All Read Status' },
              { value: 'UNREAD', label: 'Unread Only' },
              { value: 'READ', label: 'Read Only' },
            ]}
            value={readStatusFilter}
            onChange={setReadStatusFilter}
            placeholder="All Read Status"
            searchPlaceholder="Search status..."
            className="w-full md:w-44"
          />

          {/* Action Status Dropdown */}
          <SearchableSelect
            options={[
              { value: 'ALL', label: 'All Actions' },
              { value: 'ACTION_REQUIRED', label: 'Action Required' },
              { value: 'ACTION_TAKEN', label: 'Action Taken' },
              { value: 'NOT_REQUIRED', label: 'Not Required' },
            ]}
            value={actionStatusFilter}
            onChange={setActionStatusFilter}
            placeholder="All Actions"
            searchPlaceholder="Search action..."
            className="w-full md:w-48"
          />

          {/* Toggle More Filters */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
              showMoreFilters || selectedSource !== 'ALL' || startDate || endDate
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Secondary Date Range & Source Filters */}
        {showMoreFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 font-mono mb-1">
                Notification Source
              </label>
              <SearchableSelect
                options={[
                  { value: 'ALL', label: 'All Notification Sources' },
                  { value: 'SUPER_ADMIN', label: 'Super Admin' },
                  { value: 'AGENT', label: 'Agents' },
                  { value: 'CUSTOMER', label: 'Customers' },
                  { value: 'SYSTEM', label: 'System Automated' },
                ]}
                value={selectedSource}
                onChange={setSelectedSource}
                placeholder="All Notification Sources"
                searchPlaceholder="Search source..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 font-mono mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 font-mono mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Notification List & Loading / Error States */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-extrabold text-xs cursor-pointer hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        /* Initial Loading Skeleton */
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-20" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800">No Notifications Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No notification records match your current search or filter criteria. Try adjusting your module tabs or search query.
          </p>
        </div>
      ) : (
        /* Notification Cards List */
        <div className="space-y-3">
          {notifications.map((n) => {
            const badge = getModuleBadge(n.module);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={n.id}
                onClick={() => handleOpenDetail(n)}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-sm cursor-pointer hover:shadow-md ${
                  !n.isRead
                    ? 'border-blue-300 ring-2 ring-blue-500/10 bg-blue-50/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Unread Pulse Dot */}
                    <div className="mt-1 shrink-0">
                      {!n.isRead ? (
                        <span className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-100 block animate-pulse" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 block" />
                      )}
                    </div>

                    {/* Notification Main Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Module Badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase font-mono px-2.5 py-0.5 rounded-md border ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>

                        {/* Source */}
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Source: {n.source || 'SYSTEM'}
                        </span>

                        {/* Action Status Badges */}
                        {n.actionStatus === 'ACTION_REQUIRED' && (
                          <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Action Required
                          </span>
                        )}
                        {n.actionStatus === 'ACTION_TAKEN' && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Action Taken
                          </span>
                        )}
                        {n.actionStatus === 'NOT_REQUIRED' && (
                          <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Not Required
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="text-[11px] font-medium text-slate-400 ml-auto">
                          {new Date(n.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>

                      {/* Notification Title */}
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {n.title}
                      </h4>

                      {/* Notification Short Message Snippet */}
                      <p className="text-xs sm:text-sm font-normal text-slate-600 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Related Identifiers */}
                      {(n.applicationId || n.relatedEntityId) && (
                        <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs">
                          {n.applicationId && (
                            <span className="font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                              App ID: <span className="text-blue-900">{n.applicationId}</span>
                            </span>
                          )}
                          <span className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> View Details & Actions →
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Infinite Scroll Sentinel & Lazy Loading Trigger */}
      <LazyLoadTrigger
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={loadingMore}
        error={errorMessage}
        onRetry={handleRefresh}
        totalItems={notifications.length}
        endMessage="You're all caught up."
      />

      {/* 6. Side Drawer for Detailed Notification View */}
      <NotificationDetailsDrawer
        notification={selectedNotification}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onToggleRead={handleToggleRead}
        onUpdateActionStatus={handleUpdateAction}
      />
    </div>
  );
};

export default NotificationHistory;
