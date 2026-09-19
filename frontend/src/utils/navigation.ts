/**
 * Shared utility for resolving role-based navigation, open-redirect sanitization,
 * and email deep-link generation.
 */

export interface EmailDeepLinkOptions {
  role?: string;
  type: 'application' | 'document' | 'payment' | 'transaction' | 'support' | 'enquiry' | 'loan' | 'insurance' | 'investment' | 'user' | 'customer' | 'agent' | 'dashboard' | 'profile';
  resourceId?: string;
  action?: string;
}

/**
 * Validates internal redirect paths to prevent open-redirect vulnerabilities.
 * Only relative paths starting with a single '/' are permitted.
 */
export const sanitizeRedirectPath = (path?: string | null): string => {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();

  // Must start with single '/' and not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '';
  }

  // Reject URLs containing protocol specifiers (e.g., http:, javascript:)
  if (trimmed.includes(':')) {
    return '';
  }

  return trimmed;
};

/**
 * Resolves role-specific redirect path while validating permissions and preserving parameters.
 */
export const resolveRoleRedirectPath = (
  userRole: string,
  redirectUrl?: string | null,
  applicationId?: string | null
): string => {
  const sanitized = sanitizeRedirectPath(redirectUrl);
  let targetPath = sanitized;

  // Extract application ID from query string if embedded in targetPath
  let existingAppId = applicationId;
  if (targetPath && targetPath.includes('?')) {
    try {
      const searchStr = targetPath.split('?')[1];
      const params = new URLSearchParams(searchStr);
      const idFromQuery = params.get('applicationId') || params.get('id') || params.get('appId');
      if (idFromQuery) {
        existingAppId = idFromQuery;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // Fallback to role-default path if no valid redirect path provided or points to auth pages
  if (!targetPath || targetPath === '/' || targetPath === '/login' || targetPath === '/email-login') {
    switch (userRole) {
      case 'SUPER_ADMIN':
        targetPath = existingAppId ? '/superadmin/applications' : '/superadmin/dashboard';
        break;
      case 'LOAN_AGENT':
        targetPath = existingAppId ? '/loan-agent/applications' : '/loan-agent/dashboard';
        break;
      case 'INSURANCE_AGENT':
        targetPath = existingAppId ? '/insurance-agent/applications' : '/insurance-agent/dashboard';
        break;
      case 'INVESTMENT_AGENT':
        targetPath = existingAppId ? '/investment-agent/applications' : '/investment-agent/dashboard';
        break;
      case 'CUSTOMER':
      default:
        targetPath = existingAppId ? '/customer/applications' : '/customer/dashboard';
        break;
    }
  }

  // Extract main pathname without query string for path translation
  const pathname = targetPath.split('?')[0];

  // Detect requested section (applications, documents, enquiries, customers, profile, dashboard, create-application, etc.)
  let section = '';
  if (pathname.includes('/applications')) section = 'applications';
  else if (pathname.includes('/documents')) section = 'documents';
  else if (pathname.includes('/enquiries')) section = 'enquiries';
  else if (pathname.includes('/customers')) section = 'customers';
  else if (pathname.includes('/profile')) section = 'profile';
  else if (pathname.includes('/dashboard')) section = 'dashboard';
  else if (pathname.includes('/create-application')) section = 'create-application';
  else if (pathname.includes('/reports')) section = 'reports';
  else if (pathname.includes('/notifications')) section = 'notifications';

  // Check route ownership prefixes
  const isSuperAdminPath = pathname.startsWith('/superadmin/');
  const isAgentPath = pathname.startsWith('/agent/') || pathname.startsWith('/loan-agent/') || pathname.startsWith('/insurance-agent/') || pathname.startsWith('/investment-agent/');
  const isCustomerPath = pathname.startsWith('/customer/');

  // Perform Intelligent Cross-Role Route Mapping:
  if (userRole === 'SUPER_ADMIN') {
    if (isCustomerPath || isAgentPath) {
      switch (section) {
        case 'applications': targetPath = '/superadmin/applications'; break;
        case 'documents': targetPath = '/superadmin/documents'; break;
        case 'enquiries': targetPath = '/superadmin/enquiries'; break;
        case 'customers': targetPath = '/superadmin/customers'; break;
        case 'create-application': targetPath = '/superadmin/create-application'; break;
        case 'profile': targetPath = '/superadmin/settings/profile'; break;
        case 'reports': targetPath = '/superadmin/reports'; break;
        case 'notifications': targetPath = '/superadmin/notifications'; break;
        default: targetPath = '/superadmin/dashboard'; break;
      }
    }
  } else if (userRole === 'LOAN_AGENT' || userRole === 'INSURANCE_AGENT' || userRole === 'INVESTMENT_AGENT') {
    const agentPrefix = userRole.toLowerCase().replace(/_/g, '-');
    if (isSuperAdminPath || isCustomerPath || isAgentPath) {
      switch (section) {
        case 'applications': targetPath = `/${agentPrefix}/applications`; break;
        case 'documents': targetPath = `/${agentPrefix}/documents`; break;
        case 'enquiries': targetPath = `/${agentPrefix}/enquiries`; break;
        case 'customers': targetPath = `/${agentPrefix}/customers`; break;
        case 'create-application': targetPath = `/${agentPrefix}/create-application`; break;
        case 'profile': targetPath = '/profile'; break;
        case 'reports': targetPath = `/${agentPrefix}/reports`; break;
        case 'notifications': targetPath = `/${agentPrefix}/notifications`; break;
        default: targetPath = `/${agentPrefix}/dashboard`; break;
      }
    }
  } else if (userRole === 'CUSTOMER') {
    if (isSuperAdminPath || isAgentPath) {
      switch (section) {
        case 'applications': targetPath = '/customer/applications'; break;
        case 'documents': targetPath = '/customer/documents'; break;
        case 'enquiries': targetPath = '/customer/enquiries'; break;
        case 'create-application': targetPath = '/customer/create-application'; break;
        case 'profile': targetPath = '/profile'; break;
        case 'notifications': targetPath = '/customer/notifications'; break;
        default: targetPath = '/customer/dashboard'; break;
      }
    }
  }

  // Append existingAppId parameter if present and not already in query string
  if (existingAppId && !targetPath.includes('id=')) {
    const separator = targetPath.includes('?') ? '&' : '?';
    targetPath = `${targetPath}${separator}id=${encodeURIComponent(existingAppId)}`;
  }

  return targetPath;
};

/**
 * Centralized Route Generator for Email CTAs & Deep Links
 */
export const generateEmailDeepLink = (options: EmailDeepLinkOptions): string => {
  const { role = 'CUSTOMER', type, resourceId } = options;
  const baseUrl = window.location.origin;

  let redirectPath = '/dashboard';

  switch (type) {
    case 'application':
    case 'loan':
    case 'insurance':
    case 'investment':
      if (role === 'SUPER_ADMIN') redirectPath = '/superadmin/applications';
      else if (role === 'LOAN_AGENT') redirectPath = '/loan-agent/applications';
      else if (role === 'INSURANCE_AGENT') redirectPath = '/insurance-agent/applications';
      else if (role === 'INVESTMENT_AGENT') redirectPath = '/investment-agent/applications';
      else redirectPath = '/customer/applications';
      break;

    case 'document':
      if (role === 'SUPER_ADMIN') redirectPath = '/superadmin/documents';
      else if (role === 'LOAN_AGENT') redirectPath = '/loan-agent/documents';
      else if (role === 'INSURANCE_AGENT') redirectPath = '/insurance-agent/documents';
      else if (role === 'INVESTMENT_AGENT') redirectPath = '/investment-agent/documents';
      else redirectPath = '/customer/documents';
      break;

    case 'support':
    case 'enquiry':
      if (role === 'SUPER_ADMIN') redirectPath = '/superadmin/enquiries';
      else if (role.includes('AGENT')) redirectPath = `/${role.toLowerCase().replace(/_/g, '-')}/enquiries`;
      else redirectPath = '/customer/enquiries';
      break;

    case 'user':
    case 'customer':
    case 'agent':
      if (role === 'SUPER_ADMIN') redirectPath = type === 'customer' ? '/superadmin/customers' : type === 'agent' ? '/superadmin/agents' : '/superadmin/users';
      else if (role.includes('AGENT')) redirectPath = `/${role.toLowerCase().replace(/_/g, '-')}/customers`;
      else redirectPath = '/customer/dashboard';
      break;

    case 'profile':
      redirectPath = role === 'SUPER_ADMIN' ? '/superadmin/settings/profile' : '/profile';
      break;

    case 'dashboard':
    default:
      if (role === 'SUPER_ADMIN') redirectPath = '/superadmin/dashboard';
      else if (role === 'LOAN_AGENT') redirectPath = '/loan-agent/dashboard';
      else if (role === 'INSURANCE_AGENT') redirectPath = '/insurance-agent/dashboard';
      else if (role === 'INVESTMENT_AGENT') redirectPath = '/investment-agent/dashboard';
      else redirectPath = '/customer/dashboard';
      break;
  }

  let finalUrl = `${baseUrl}/login?redirect=${encodeURIComponent(redirectPath)}`;
  if (resourceId) {
    finalUrl += `&applicationId=${encodeURIComponent(resourceId)}`;
  }
  return finalUrl;
};
