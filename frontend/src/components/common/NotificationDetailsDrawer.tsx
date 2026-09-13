import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  Clock,
  CheckCircle2,
  ShieldAlert,
  FileText,
  User,
  HelpCircle,
  CreditCard,
  Briefcase,
  TrendingUp,
  Layers,
  ExternalLink,
  Check,
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NotificationDetailsDrawerProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleRead: (n: NotificationItem) => void;
  onUpdateActionStatus?: (id: string, status: string) => void;
}

export const NotificationDetailsDrawer: React.FC<NotificationDetailsDrawerProps> = ({
  notification,
  isOpen,
  onClose,
  onToggleRead,
  onUpdateActionStatus,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen || !notification) return null;

  // Determine role base path
  const role = user?.role;
  let basePath = '/superadmin';
  if (role === 'LOAN_AGENT') basePath = '/loan-agent';
  else if (role === 'INSURANCE_AGENT') basePath = '/insurance-agent';
  else if (role === 'INVESTMENT_AGENT') basePath = '/investment-agent';
  else if (role === 'CUSTOMER') basePath = '/customer';

  // Module Styling
  const getModuleBadge = (moduleStr?: string | null) => {
    const mod = (moduleStr || 'GENERAL').toUpperCase();
    switch (mod) {
      case 'LOANS':
        return { label: 'APPLICATION', bg: 'bg-blue-100 text-blue-800 border-blue-200', icon: CreditCard };
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
        return { label: 'USER MANAGEMENT', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: User };
      default:
        return { label: mod, bg: 'bg-slate-100 text-slate-800 border-slate-200', icon: Layers };
    }
  };

  const badge = getModuleBadge(notification.module);
  const BadgeIcon = badge.icon;

  // Handle direct navigation to target module
  const handleNavigateToEntity = () => {
    onClose();
    if (notification.module === 'DOCUMENTS' || notification.type?.includes('DOCUMENT')) {
      navigate(`${basePath}/documents`);
    } else if (notification.module === 'ENQUIRIES' || notification.type?.includes('ENQUIRY')) {
      navigate(`${basePath}/enquiries`);
    } else if (notification.applicationId || notification.relatedEntity === 'APPLICATION') {
      const appId = notification.applicationId || notification.relatedEntityId;
      if (appId?.startsWith('INS-')) {
        navigate(role === 'SUPER_ADMIN' ? '/superadmin/applications/insurance' : `${basePath}/applications`);
      } else if (appId?.startsWith('INV-')) {
        navigate(role === 'SUPER_ADMIN' ? '/superadmin/applications/investments' : `${basePath}/applications`);
      } else {
        navigate(role === 'SUPER_ADMIN' ? '/superadmin/applications/loans' : `${basePath}/applications`);
      }
    } else if (notification.customerId || notification.relatedEntity === 'USER') {
      navigate(role === 'SUPER_ADMIN' ? '/superadmin/users' : `${basePath}/dashboard`);
    } else {
      navigate(`${basePath}/dashboard`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      {/* Centered Modal Popup Container */}
      <div
        className="relative w-full max-w-xl sm:max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Navy Popup Header */}
        <div className="px-6 py-4 bg-[#0A1830] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-[#1E293B] text-[#B8862E] rounded-xl border border-slate-700/80 shadow-inner">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-serif">
                Notification Details
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {notification.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Header Badges & Source */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold font-mono px-3 py-1 rounded-lg border ${badge.bg}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {badge.label}
            </span>

            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              Source: {notification.source || 'SYSTEM'}
            </span>

            {notification.actionStatus === 'ACTION_REQUIRED' && (
              <span className="text-xs font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-3 py-1 rounded-lg flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Action Required
              </span>
            )}
            {notification.actionStatus === 'ACTION_TAKEN' && (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Action Taken
              </span>
            )}
          </div>

          {/* Title & Timestamp */}
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug tracking-tight">
              {notification.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* NOTIFICATION SUMMARY Box */}
          <div className="p-4.5 bg-[#F6F4EF] border border-[#E4E0D6] rounded-2xl space-y-1.5">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              NOTIFICATION SUMMARY
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* RELATED ENTITY METADATA Box */}
          <div className="p-4.5 bg-white border border-slate-200/80 rounded-2xl space-y-2.5">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              RELATED ENTITY METADATA
            </h4>

            <div className="space-y-2">
              {notification.applicationId && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700">Application ID</span>
                  <span className="font-mono font-extrabold text-blue-900 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                    {notification.applicationId}
                  </span>
                </div>
              )}

              {notification.customerId && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700">Customer ID</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                    {notification.customerId}
                  </span>
                </div>
              )}

              {notification.agentId && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700">Agent ID</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                    {notification.agentId}
                  </span>
                </div>
              )}

              {notification.documentId && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700">Document Reference</span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-md">
                    {notification.documentId}
                  </span>
                </div>
              )}

              {notification.relatedEntityId && notification.relatedEntityId !== notification.applicationId && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700">Related {notification.relatedEntity || 'Record'}</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                    {notification.relatedEntityId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Warm Amber Action Button */}
          <div>
            <button
              onClick={handleNavigateToEntity}
              className="w-full py-3.5 px-4 bg-[#B8862E] hover:bg-[#A07424] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <span>View related module & details</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-50/80 border-t border-slate-200/80 space-y-3">
          <button
            onClick={() => onToggleRead(notification)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all border flex items-center justify-center space-x-2 cursor-pointer ${
              notification.isRead
                ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{notification.isRead ? 'Mark as unread' : 'Mark as read'}</span>
          </button>

          {user?.role !== 'CUSTOMER' && onUpdateActionStatus && (
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => onUpdateActionStatus(notification.id, 'ACTION_TAKEN')}
                className={`py-2.5 px-2 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  notification.actionStatus === 'ACTION_TAKEN'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Action taken
              </button>
              <button
                onClick={() => onUpdateActionStatus(notification.id, 'ACTION_REQUIRED')}
                className={`py-2.5 px-2 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  notification.actionStatus === 'ACTION_REQUIRED'
                    ? 'bg-rose-700 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Action required
              </button>
              <button
                onClick={() => onUpdateActionStatus(notification.id, 'NOT_REQUIRED')}
                className={`py-2.5 px-2 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  notification.actionStatus === 'NOT_REQUIRED'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                Not required
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailsDrawer;
