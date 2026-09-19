import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const Breadcrumb: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (!user) return null;

  const currentPath = location.pathname;

  // 1. Dashboards MUST NOT display breadcrumb
  const isDashboard =
    currentPath === '/' ||
    currentPath === '/superadmin/dashboard' ||
    currentPath === '/admin/dashboard' ||
    currentPath === '/loan-agent/dashboard' ||
    currentPath === '/insurance-agent/dashboard' ||
    currentPath === '/investment-agent/dashboard' ||
    currentPath === '/customer/dashboard';

  if (isDashboard) return null;

  // Resolve Home Path based on User Role
  const getHomePath = () => {
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
      default:
        return '/customer/dashboard';
    }
  };

  const homePath = getHomePath();
  const items: BreadcrumbItem[] = [{ label: 'Home', path: homePath }];

  const appId = searchParams.get('id') || searchParams.get('applicationId') || searchParams.get('appId');

  // Map Routes to Breadcrumb Hierarchy
  if (currentPath.includes('/applications')) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isLoanAgent = user.role === 'LOAN_AGENT';
    const isInsuranceAgent = user.role === 'INSURANCE_AGENT';
    const isInvestmentAgent = user.role === 'INVESTMENT_AGENT';

    let appsPath = '/customer/applications';
    if (isSuperAdmin) appsPath = '/superadmin/applications';
    else if (isLoanAgent) appsPath = '/loan-agent/applications';
    else if (isInsuranceAgent) appsPath = '/insurance-agent/applications';
    else if (isInvestmentAgent) appsPath = '/investment-agent/applications';

    if (currentPath.includes('/loans')) {
      items.push({ label: 'Applications', path: appsPath });
      items.push({ label: 'Loan Applications' });
    } else if (currentPath.includes('/insurance')) {
      items.push({ label: 'Applications', path: appsPath });
      items.push({ label: 'Insurance Applications' });
    } else if (currentPath.includes('/investments')) {
      items.push({ label: 'Applications', path: appsPath });
      items.push({ label: 'Investment Applications' });
    } else {
      items.push({ label: 'Applications', path: appId ? appsPath : undefined });
    }

    if (appId) {
      items.push({ label: `Application ${appId}` });
    }
  } else if (currentPath.includes('/users')) {
    items.push({ label: 'Users Management', path: currentPath.includes('/users/') ? '/superadmin/users' : undefined });
    if (currentPath.includes('/create')) items.push({ label: 'Create / Invite User' });
    if (currentPath.includes('/verification')) items.push({ label: 'User Verification' });
  } else if (currentPath.includes('/agents')) {
    items.push({ label: 'Users Management', path: '/superadmin/users' });
    items.push({ label: 'Manage Agents' });
  } else if (currentPath.includes('/customers')) {
    if (user.role === 'SUPER_ADMIN') {
      items.push({ label: 'Users Management', path: '/superadmin/users' });
      items.push({ label: 'Customers' });
    } else {
      items.push({ label: 'My Customers' });
    }
  } else if (currentPath.includes('/documents')) {
    items.push({ label: 'Verification Documents' });
  } else if (currentPath.includes('/products')) {
    items.push({ label: 'Products & Services' });
  } else if (currentPath.includes('/permissions')) {
    items.push({ label: 'Roles & Permissions' });
  } else if (currentPath.includes('/system')) {
    items.push({ label: 'System Management' });
  } else if (currentPath.includes('/website-management')) {
    items.push({ label: 'Website & Portal Management' });
  } else if (currentPath.includes('/updates')) {
    items.push({ label: 'Updates & Release Notes' });
  } else if (currentPath.includes('/enquiries')) {
    items.push({ label: 'Support & Enquiries' });
  } else if (currentPath.includes('/reports')) {
    items.push({ label: 'Analytics Reports' });
  } else if (currentPath.includes('/audit-logs')) {
    items.push({ label: 'Audit Logs' });
  } else if (currentPath.includes('/settings') || currentPath.includes('/profile')) {
    items.push({ label: 'My Profile & Settings' });
  } else if (currentPath.includes('/create-application')) {
    items.push({ label: 'Create New Application' });
  } else if (currentPath.includes('/notifications')) {
    items.push({ label: 'Notification History' });
  } else {
    // Fallback: capitalize path segment
    const segment = currentPath.split('/').filter(Boolean).pop() || '';
    if (segment) {
      const formatted = segment
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      items.push({ label: formatted });
    }
  }

  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 overflow-x-auto custom-scrollbar py-1 px-0.5"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />}

            {isLast ? (
              <span className="font-extrabold text-blue-700 truncate max-w-[160px] sm:max-w-none" title={item.label}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path || '#'}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors text-slate-600 truncate max-w-[120px] sm:max-w-none"
                title={item.label}
              >
                {isFirst && <Home className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
