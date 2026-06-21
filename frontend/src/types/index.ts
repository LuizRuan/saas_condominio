export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'resident' | 'concierge' | 'subadmin' | 'financial';
  isDemo?: boolean;
  mustChangePassword?: boolean;
  condominiumId?: string;
  unitId?: string;
  plan?: 'free' | 'pro' | 'ultra';
}

export interface Condominium {
  _id: string;
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  pixKey: string;
  defaultFee: number;
  dueDay: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  _id: string;
  condominiumId: string;
  block: string;
  number: string;
  status: 'occupied' | 'empty' | 'late';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resident {
  _id: string;
  condominiumId: string;
  unitId: string | { _id: string; block: string; number: string };
  name: string;
  phone: string;
  email: string;
  type: 'owner' | 'tenant' | 'financial_responsible';
  isFinancialResponsible: boolean;
  userId?: string;
  inviteToken?: string;
  inviteExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryEntry {
  status: 'pending' | 'paid' | 'late' | 'proof_submitted' | 'proof_rejected';
  note?: string;
  actorId?: string;
  createdAt: string;
}

export interface Charge {
  _id: string;
  condominiumId: string;
  unitId: string | { _id: string; block: string; number: string };
  residentId?: string | { _id: string; name: string; phone: string; email: string } | null;
  referenceMonth: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'pending' | 'paid' | 'late';
  paidAt?: string;
  proofUrl?: string;
  proofNote?: string;
  proofStatus?: 'none' | 'submitted' | 'approved' | 'rejected';
  proofSubmittedAt?: string;
  proofReviewedAt?: string;
  paymentHistory?: PaymentHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  _id: string;
  condominiumId: string;
  title: string;
  message: string;
  category: 'general' | 'maintenance' | 'assembly' | 'security' | 'financial';
  isPinned: boolean;
  photos: string[];
  createdBy: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  _id: string;
  condominiumId: string;
  unitId: string | { _id: string; block: string; number: string };
  residentId?: string | { _id: string; name: string } | null;
  title: string;
  description: string;
  category: 'noise' | 'maintenance' | 'security' | 'cleaning' | 'garage' | 'leak' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  response: string;
  photos?: string[];
  messages?: IssueMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueMessage {
  _id?: string;
  authorId?: string;
  authorRole: 'admin' | 'resident';
  authorName: string;
  message: string;
  photos?: string[];
  createdAt: string;
}

export interface Reservation {
  _id: string;
  condominiumId: string;
  unitId: string | { _id: string; block: string; number: string };
  residentId?: string | { _id: string; name: string } | null;
  area: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationBlock {
  _id: string;
  condominiumId: string;
  area: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Access {
  _id: string;
  condominiumId: string;
  unitId: string | { _id: string; block: string; number: string };
  visitorName: string;
  documentType?: 'rg' | 'cpf' | 'other';
  documentNumber?: string;
  type: 'visitor' | 'service_provider' | 'delivery';
  status: 'active' | 'finished';
  vehiclePlate?: string;
  entryTime: string;
  exitTime?: string;
  notes?: string;
  createdBy: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  _id: string;
  condominiumId: string;
  userId?: string;
  targetRole?: 'admin' | 'resident';
  type: 'payment' | 'issue' | 'reservation' | 'announcement' | 'system';
  title: string;
  message: string;
  link?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  condominiumId: string;
  actorId?: string;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  count: number;
  type: 'payment' | 'issue' | 'reservation' | 'announcement' | 'system';
  link: string;
}

export interface DashboardStats {
  receivedThisMonth: number;
  toReceive: number;
  late: number;
  expensesPaidThisMonth: number;
  expensesPending: number;
  balanceThisMonth: number;
  totalUnits: number;
  openIssues: number;
  pendingReservations: number;
}

export interface AdminDashboard {
  stats: DashboardStats;
  lateCharges: Charge[];
  recentAnnouncements: Announcement[];
  recentIssues: Issue[];
  upcomingReservations: Reservation[];
  tasks?: DashboardTask[];
}

export interface ResidentDashboard {
  stats: {
    pendingCharges: number;
    recentAnnouncements: number;
    openIssues: number;
    upcomingReservations: number;
  };
  pendingCharges: Charge[];
  recentAnnouncements: Announcement[];
  openIssues: Issue[];
  upcomingReservations: Reservation[];
  tasks?: DashboardTask[];
}

export interface RegisterData {
  name: string;
  phone?: string;
  email: string;
  password: string;
  condominiumName: string;
  city?: string;
  state?: string;
  pixKey?: string;
  defaultFee?: number;
  dueDay?: number;
}

export type ExpenseCategory =
  | 'utilities'
  | 'cleaning'
  | 'security'
  | 'maintenance'
  | 'employees'
  | 'works'
  | 'providers'
  | 'other';

export interface Expense {
  _id: string;
  condominiumId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  status: 'paid' | 'pending';
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashflowEntry {
  month: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface FinanceReport {
  month: string;
  summary: {
    income: number;
    expense: number;
    balance: number;
    pendingIncome: number;
    pendingExpense: number;
    totalLate: number;
  };
  expensesByCategory: { category: string; amount: number }[];
  lateUnits: {
    unitId: string;
    block: string;
    number: string;
    totalDebt: number;
    chargesCount: number;
  }[];
}
