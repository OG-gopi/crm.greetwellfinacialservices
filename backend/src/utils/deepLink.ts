import { CONFIG } from '../config';

export interface EmailDeepLinkOptions {
  role?: string;
  type: 'application' | 'document' | 'payment' | 'transaction' | 'support' | 'enquiry' | 'loan' | 'insurance' | 'investment' | 'user' | 'customer' | 'agent' | 'dashboard' | 'profile';
  resourceId?: string;
  action?: string;
}

/**
 * Centralized Route Generator for Backend Email Template CTAs
 */
export function generateEmailDeepLink(options: EmailDeepLinkOptions): string {
  const { role = 'CUSTOMER', type, resourceId } = options;
  const baseUrl = CONFIG.APP_URL || CONFIG.FRONTEND_URL || 'https://crm-greetwellfinacialservicescrmg.vercel.app';

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

  let finalUrl = `${baseUrl}/email-login?redirect=${encodeURIComponent(redirectPath)}`;
  if (resourceId) {
    finalUrl += `&applicationId=${encodeURIComponent(resourceId)}`;
  }
  return finalUrl;
}
