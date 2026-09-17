/**
 * Shared utility for resolving role-based navigation and deep links from email referrals.
 */
export const resolveRoleRedirectPath = (
  userRole: string,
  redirectUrl?: string | null,
  applicationId?: string | null
): string => {
  let targetPath = (redirectUrl || '').trim();

  // If no redirect URL provided or points to root/auth, fallback to default role dashboard
  if (!targetPath || targetPath === '/' || targetPath === '/login' || targetPath === '/email-login') {
    switch (userRole) {
      case 'SUPER_ADMIN':
        targetPath = applicationId ? `/superadmin/applications` : '/superadmin/dashboard';
        break;
      case 'LOAN_AGENT':
        targetPath = applicationId ? `/loan-agent/applications` : '/loan-agent/dashboard';
        break;
      case 'INSURANCE_AGENT':
        targetPath = applicationId ? `/insurance-agent/applications` : '/insurance-agent/dashboard';
        break;
      case 'INVESTMENT_AGENT':
        targetPath = applicationId ? `/investment-agent/applications` : '/investment-agent/dashboard';
        break;
      case 'CUSTOMER':
      default:
        targetPath = applicationId ? `/customer/applications` : '/customer/dashboard';
        break;
    }
  }

  // Handle generic agent routes (e.g., /agent/customers, /agent/applications, /agent/dashboard)
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
        return '/unauthorized';
    }
  }

  // Append applicationId parameter if present and not already part of query string
  if (applicationId && !targetPath.includes('id=')) {
    const separator = targetPath.includes('?') ? '&' : '?';
    targetPath = `${targetPath}${separator}id=${encodeURIComponent(applicationId)}`;
  }

  return targetPath;
};
