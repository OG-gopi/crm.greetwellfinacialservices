import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  ExternalLink,
  RotateCw,
  Send,
  User,
  Tag,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';

export interface EmailDeliveryLog {
  id: string;
  recipientEmail: string;
  recipientName?: string | null;
  senderEmail: string;
  subject: string;
  emailType: string;
  emailCategory: 'TRANSACTIONAL' | 'AUTH' | 'APPLICATION' | 'DOCUMENT' | 'ENQUIRY' | 'SYSTEM';
  status: 'PENDING' | 'SENT' | 'FAILED';
  retryCount: number;
  failureReason?: string | null;
  relatedEntity?: string | null;
  relatedEntityId?: string | null;
  applicationId?: string | null;
  actionUrl?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export const EmailLogs: React.FC = () => {
  const [logs, setLogs] = useState<EmailDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });

  // Retrying state per log ID
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<EmailDeliveryLog | null>(null);

  const fetchLogs = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      let url = `/system/email-logs?page=${pageToFetch}&limit=15&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (categoryFilter !== 'ALL') url += `&category=${categoryFilter}`;

      const res = await api.get(url);
      if (res.data.success) {
        setLogs(res.data.data || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err: any) {
      console.error('Failed to load email delivery logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [search, statusFilter, categoryFilter]);

  const handleRetry = async (logId: string) => {
    setRetryingIds((prev) => ({ ...prev, [logId]: true }));
    setNotification(null);
    try {
      const res = await api.post(`/system/email-logs/${logId}/retry`);
      if (res.data.success) {
        setNotification({ message: res.data.message || 'Email retried successfully!', type: 'success' });
        fetchLogs(page);
      } else {
        setNotification({ message: res.data.message || 'Failed to retry email.', type: 'error' });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Error occurred while retrying email.';
      setNotification({ message: errMsg, type: 'error' });
    } finally {
      setRetryingIds((prev) => ({ ...prev, [logId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-bold tracking-tight">Transactional Email Logs & Delivery Audit</h2>
          </div>
          <p className="text-xs text-slate-300">
            Monitor real-time Gmail SMTP notifications dispatches, view audit trails, and manage instant failed delivery retries.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Audit Logs
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ×
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Notifications</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Successfully Delivered</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.sent}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Failed / Delivery Block</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{metrics.failed}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Queue</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{metrics.pending}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipient, subject, app ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value="SENT">Sent (Delivered)</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending Queue</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Email Categories</option>
              <option value="TRANSACTIONAL">Transactional</option>
              <option value="AUTH">Authentication & Invite</option>
              <option value="APPLICATION">Applications</option>
              <option value="DOCUMENT">Documents</option>
              <option value="ENQUIRY">Enquiry Tickets</option>
              <option value="SYSTEM">System Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Delivery Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject & Email Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading delivery log records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    No email delivery logs found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.recipientName || 'Recipient'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{log.recipientEmail}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate" title={log.subject}>
                        {log.subject}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Tag className="w-3 h-3 text-blue-500" />
                        <span className="font-mono">{log.emailType}</span>
                        {log.applicationId && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold ml-1">
                            App: {log.applicationId}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {log.emailCategory}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        {getStatusBadge(log.status)}
                        {log.retryCount > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Retries: {log.retryCount}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <div>{new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(log.status === 'FAILED' || log.status === 'PENDING') && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retryingIds[log.id]}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RotateCw className={`w-3 h-3 ${retryingIds[log.id] ? 'animate-spin' : ''}`} />
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <span className="font-bold text-slate-800">{page}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Email Notification Audit Record"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-slate-900 text-sm">{selectedLog.subject}</span>
                {getStatusBadge(selectedLog.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-400 block">Recipient Email:</span>
                  <span className="font-mono text-slate-900">{selectedLog.recipientEmail}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Recipient Name:</span>
                  <span className="text-slate-900">{selectedLog.recipientName || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Sender Address:</span>
                  <span className="font-mono text-slate-900">{selectedLog.senderEmail}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Email Type:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedLog.emailType}</span>
                </div>
              </div>
            </div>

            {selectedLog.failureReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Delivery Failure Reason
                </p>
                <p className="font-mono text-rose-700 whitespace-pre-wrap text-[11px]">
                  {selectedLog.failureReason}
                </p>
              </div>
            )}

            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between text-slate-600">
                <span>Application Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedLog.applicationId || 'None'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Action CTA URL:</span>
                {selectedLog.actionUrl ? (
                  <a
                    href={selectedLog.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    {selectedLog.actionUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Dispatch Attempt Date:</span>
                <span className="text-slate-900">{new Date(selectedLog.createdAt).toLocaleString('en-IN')}</span>
              </div>
              {selectedLog.sentAt && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Successful Delivery Time:</span>
                  <span className="text-emerald-700 font-semibold">{new Date(selectedLog.sentAt).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              {(selectedLog.status === 'FAILED' || selectedLog.status === 'PENDING') && (
                <button
                  onClick={() => {
                    handleRetry(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Retry Dispatch Now
                </button>
              )}
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
