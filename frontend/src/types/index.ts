export type UserRole =
  | 'SUPER_ADMIN'
  | 'LOAN_AGENT'
  | 'INSURANCE_AGENT'
  | 'INVESTMENT_AGENT'
  | 'CUSTOMER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  customerIdCode?: string;
  agentIdCode?: string;
  adminIdCode?: string;
  superAdminIdCode?: string;
  serviceTypes?: string[];
  dob?: string;
  education?: string;
  hasExperience?: boolean;
  previousCompany?: string;
  previousJobRole?: string;
  yearsOfExperience?: string;
  previousJobStartDate?: string;
  previousJobEndDate?: string;
  aadhaarDocUrl?: string;
  educationDocUrl?: string;
  experienceDocUrl?: string;
  otherDocUrl?: string;
  createdAt?: string;
}

export interface InvitationItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: string;
  customerIdCode?: string;
  agentIdCode?: string;
  serviceTypes?: string[];
  dob?: string;
  education?: string;
  hasExperience?: boolean;
  previousCompany?: string;
  previousJobRole?: string;
  yearsOfExperience?: string;
  previousJobStartDate?: string;
  previousJobEndDate?: string;
  aadhaarDocUrl?: string;
  educationDocUrl?: string;
  experienceDocUrl?: string;
  otherDocUrl?: string;
  emailOtp?: string;
  mobileOtp?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  deliveryStatus?: string;
  token: string;
  createdAt: string;
}

export type ApplicationType = 'LOAN' | 'INSURANCE' | 'INVESTMENT';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'INFORMATION_REQUIRED'
  | 'DOCUMENTS_REQUIRED'
  | 'VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type ApplicationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Application {
  id: string;
  customerId: string;
  customer?: User;
  createdById?: string | null;
  createdBy?: User | null;
  assignedAgentId?: string | null;
  assignedAgent?: User | null;
  type: ApplicationType;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  amount?: number | null;
  term?: string | null;
  purpose?: string | null;
  formData?: string | null;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationComment?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: DocumentItem[];
  requirements?: ApplicationRequirement[];
  tasks?: TaskItem[];
  notes?: NoteItem[];
  _count?: {
    documents: number;
    notes: number;
    tasks: number;
  };
}

export interface DocumentItem {
  id: string;
  applicationId: string;
  documentTypeId?: string | null;
  documentType?: { name: string; code: string } | null;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedByUserId: string;
  uploadedByUser?: { firstName: string; lastName: string };
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REPLACEMENT_REQUIRED';
  verifiedByUserId?: string | null;
  verifiedByUser?: { firstName: string; lastName: string };
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface ApplicationRequirement {
  id: string;
  applicationId: string;
  title: string;
  description?: string | null;
  isRequired: boolean;
  status: string;
  customerReply?: string | null;
  replyDocUrl?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskItem {
  id: string;
  applicationId?: string | null;
  application?: { id: string; type: string; status: string } | null;
  assignedToUserId: string;
  assignedToUser?: { firstName: string; lastName: string; role: string };
  createdByUserId: string;
  createdByUser?: { firstName: string; lastName: string; role: string };
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: ApplicationPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  applicationId: string;
  authorUserId: string;
  authorUser?: { firstName: string; lastName: string; role: string };
  content: string;
  isCustomerVisible: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  module?: string | null;
  source?: string | null;
  actionStatus?: 'ACTION_REQUIRED' | 'ACTION_TAKEN' | 'NOT_REQUIRED' | 'NONE' | null;
  recipientRole?: string | null;
  customerId?: string | null;
  agentId?: string | null;
  applicationId?: string | null;
  documentId?: string | null;
  commentId?: string | null;
  relatedEntity?: string | null;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  user?: { firstName: string; lastName: string; email: string; role: string } | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  ipAddress?: string | null;
  metadata?: any;
  timestamp: string;
}

export interface LoanProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  description?: string;
}

export interface InsuranceProduct {
  id: string;
  name: string;
  code: string;
  type: string;
  coverageAmount: number;
  premiumAmount: number;
  isActive: boolean;
  description?: string;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  code: string;
  riskLevel: string;
  expectedReturnRate: number;
  minInvestment: number;
  isActive: boolean;
  description?: string;
}

export interface EnquiryMessage {
  id: string;
  enquiryId: string;
  senderId: string;
  sender?: { id: string; firstName: string; lastName?: string; email: string; role: string };
  senderRole: string;
  message: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface EnquiryHistory {
  id: string;
  enquiryId: string;
  performedByUserId: string;
  performedByUser?: { firstName: string; lastName?: string; role: string };
  action: string;
  details: string;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  raisedByUserId: string;
  raisedByUser?: { id: string; firstName: string; lastName?: string; email: string; phone?: string; role: string };
  userRole: string;
  subject: string;
  category: string;
  relatedApplicationId?: string | null;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_INFORMATION' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  attachmentUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  assignedAgentId?: string | null;
  assignedAgent?: { id: string; firstName: string; lastName?: string; email: string; role: string } | null;
  resolutionComment?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: EnquiryMessage[];
  history?: EnquiryHistory[];
  _count?: {
    messages: number;
  };
}

