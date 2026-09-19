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

  // Fallback to role-default path if no valid redirect path provided or points to auth pages
  if (!targetPath || targetPath === '/' || targetPath === '/login' || targetPath === '/email-login') {
    switch (userRole) {
      case 'SUPER_ADMIN':
        targetPath = applicationId ? '/superadmin/applications' : '/superadmin/dashboard';
        break;
      case 'LOAN_AGENT':
        targetPath = applicationId ? '/loan-agent/applications' : '/loan-agent/dashboard';
        break;
      case 'INSURANCE_AGENT':
        targetPath = applicationId ? '/insurance-agent/applications' : '/insurance-agent/dashboard';
        break;
      case 'INVESTMENT_AGENT':
        targetPath = applicationId ? '/investment-agent/applications' : '/investment-agent/dashboard';
        break;
      case 'CUSTOMER':
      default:
        targetPath = applicationId ? '/customer/applications' : '/customer/dashboard';
        break;
    }
  }

  // Handle generic agent routes (e.g., /agent/customers, /agent/applications)
  if (targetPath.startsWith('/agent/') || targetPath === '/agent') {
    const subPath = targetPath === '/agent' ? 'dashboard' : targetPath.substring('/agent/'.length);

    switch (userRole) {
      case 'LOAN_AGENT':
        targetPath = `/loan-agent/${subPath}`;
        break;
      case 'INSURANCE_AGENT':
        targetPath = `/insurance-agent/${subPath}`;
        break;
      case 'INVESTMENT_AGENT':
        targetPath = `/investment-agent/${subPath}`;
        break;
      case 'SUPER_ADMIN':
        targetPath = `/superadmin/${subPath}`;
        break;
      case 'CUSTOMER':
      default:
        targetPath = '/customer/dashboard';
        break;
    }
  }

  // Cross-Role Route Authorization Safety Checks:
  // If non-SuperAdmin user is trying to access a /superadmin route, map to their role prefix
  if (userRole !== 'SUPER_ADMIN' && targetPath.startsWith('/superadmin/')) {
    const sub = targetPath.substring('/superadmin/'.length);
    if (userRole === 'CUSTOMER') {
      targetPath = `/customer/${sub}`;
    } else {
      const agentPrefix = userRole.toLowerCase().replace(/_/g, '-');
      targetPath = `/${agentPrefix}/${sub}`;
    }
  }

  // Append applicationId parameter if present and not already part of query string
  if (applicationId && !targetPath.includes('id=')) {
    const separator = targetPath.includes('?') ? '&' : '?';
    targetPath = `${targetPath}${separator}id=${encodeURIComponent(applicationId)}`;
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
