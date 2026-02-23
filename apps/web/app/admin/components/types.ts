export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  coverImage: string | null;
  available: number;
  quantity: number;
  categoryId: string | null;
  category: Category | null;
  loanCount?: number;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'DEVELOPER';
  schoolId: string | null;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  className?: string | null;
  section?: string | null;
  studentNumber?: string | null;
}

export interface MemberLoan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: string;
  fineAmount: number;
  finePaid: boolean;
  book: { id: string; title: string; author: string; coverImage: string | null };
}

export interface MemberDetail {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    className: string | null;
    section: string | null;
    studentNumber: string | null;
    createdAt: string;
  };
  stats: {
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    returnedLoans: number;
    totalFines: number;
    unpaidFines: number;
  };
  activeLoans: MemberLoan[];
  loanHistory: MemberLoan[];
  reservations: Array<{
    id: string;
    status: string;
    createdAt: string;
    book: { id: string; title: string; author: string; coverImage: string | null };
  }>;
  favorites: Array<{
    id: string;
    book: { id: string; title: string; author: string; coverImage: string | null };
  }>;
}

export interface OverdueLoan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  daysOverdue: number;
  user: { id: string; name: string; email: string };
  book: { id: string; title: string; author: string };
}

export interface Activity {
  id: string;
  borrowedAt: string;
  returnedAt: string | null;
  status: string;
  user: { id: string; name: string; email: string };
  book: { id: string; title: string; author: string };
}

export interface DashboardStats {
  totalBooks: number;
  totalBookQuantity: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  totalLoansThisMonth: number;
  totalLoansThisWeek: number;
}

export interface NeverBorrowedMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  className: string | null;
  section: string | null;
  studentNumber: string | null;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  slug: string;
}

export interface SchoolSettings {
  id: string;
  loanDays: number;
  maxLoans: number;
  maxRenewals: number;
  finePerDay: number;
  maxFine: number;
  reservationDays: number;
  maxReservations: number;
}

export interface ChartData {
  monthlyStats: { month: string; loans: number; returns: number }[];
  categoryDistribution: { name: string; count: number; color: string }[];
  weeklyStats: { week: string; count: number }[];
}

export type TabType = 'dashboard' | 'books' | 'categories' | 'members' | 'approvals' | 'overdue' | 'reports' | 'activities' | 'settings';
