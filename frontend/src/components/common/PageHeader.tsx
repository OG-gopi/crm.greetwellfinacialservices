import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROUTE_NAME_MAP: Record<string, string> = {
  superadmin: 'Super Admin',
  'loan-agent': 'Loan Agent Desk',
  'insurance-agent': 'Insurance Agent Desk',
  'investment-agent': 'Investment Agent Desk',
  customer: 'Customer Portal',
  dashboard: 'Dashboard',
  users: 'Users Management',
  agents: 'Agent Management',
  customers: 'Customers',
  applications: 'Applications',
  documents: 'Documents',
  products: 'Products CMS',
  permissions: 'Permissions',
  system: 'System Settings',
  audit: 'Audit Logs',
  reports: 'Reports',
  enquiries: 'Enquiries',
  website: 'Website Management',
  tasks: 'Tasks',
  create: 'Create / Invite',
  verification: 'Verification Center',
  'create-application': 'Create New Application',
  profile: 'My Profile',
  notifications: 'Notifications',
};

export const PageHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getDashboardRoute = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/superadmin/dashboard';
      case 'LOAN_AGENT':
        return '/loan-agent/dashboard';
      case 'INSURANCE_AGENT':
        return '/insurance-agent/dashboard';
      case 'INVESTMENT_AGENT':
        return '/investment-agent/dashboard';
      case 'CUSTOMER':
        return '/customer/dashboard';
      default:
        return '/';
    }
  };

  const handleBack = () => {
    // Check if browser history has previous entries
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(getDashboardRoute());
    }
  };

  const formatSegment = (seg: string) => {
    if (ROUTE_NAME_MAP[seg.toLowerCase()]) return ROUTE_NAME_MAP[seg.toLowerCase()];
    // If it looks like an ID or slug
    if (seg.length > 15 || /^[0-9a-fA-F-]+$/.test(seg)) {
      return `Details (#${seg.slice(0, 8)})`;
    }
    return seg
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Don't show redundant back button if already on dashboard home
  const isDashboardRoot =
    location.pathname === '/superadmin/dashboard' ||
    location.pathname === '/loan-agent/dashboard' ||
    location.pathname === '/insurance-agent/dashboard' ||
    location.pathname === '/investment-agent/dashboard' ||
    location.pathname === '/customer/dashboard';

  return (
    <div className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs font-sans">
      {/* Left side: Back Button & Breadcrumbs */}
      <div className="flex items-center space-x-3 overflow-x-auto custom-scrollbar py-0.5">
        {!isDashboardRoot && (
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            title="Go to previous page"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Back</span>
          </button>
        )}

        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold truncate">
          <Link
            to={getDashboardRoute()}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors shrink-0"
          >
            <Home className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {pathSegments.map((seg, idx) => {
            const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
            const isLast = idx === pathSegments.length - 1;
            const label = formatSegment(seg);

            return (
              <React.Fragment key={url}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 stroke-[2]" />
                {isLast ? (
                  <span className="font-extrabold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                    {label}
                  </span>
                ) : (
                  <Link to={url} className="hover:text-blue-600 transition-colors truncate max-w-[150px] sm:max-w-none">
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default PageHeader;
