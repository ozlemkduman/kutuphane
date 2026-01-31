// Admin Paneli - Gelişmiş Yönetim
// TODO: Bu dosya çok büyük (2400+ satır). Aşağıdaki component'lere bölünmeli:
// - AdminDashboard: Dashboard tab içeriği
// - AdminBooks: Kitap yönetimi tab'ı
// - AdminCategories: Kategori yönetimi tab'ı
// - AdminMembers: Üye yönetimi tab'ı
// - AdminApprovals: Onay bekleyenler tab'ı
// - AdminOverdue: Geciken kitaplar tab'ı
// - AdminReports: Raporlar tab'ı
// - AdminActivities: Aktiviteler tab'ı
// - AdminSettings: Ayarlar tab'ı
// Her component app/admin/components/ altına taşınmalı
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, shadows, spacing, transitions } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
}

interface Book {
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

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'DEVELOPER';
  schoolId: string | null;
}

interface Member {
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

interface MemberLoan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: string;
  fineAmount: number;
  finePaid: boolean;
  book: { id: string; title: string; author: string; coverImage: string | null };
}

interface MemberDetail {
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

interface OverdueLoan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  daysOverdue: number;
  user: { id: string; name: string; email: string };
  book: { id: string; title: string; author: string };
}

interface Activity {
  id: string;
  borrowedAt: string;
  returnedAt: string | null;
  status: string;
  user: { id: string; name: string; email: string };
  book: { id: string; title: string; author: string };
}

interface DashboardStats {
  totalBooks: number;
  totalBookQuantity: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  totalLoansThisMonth: number;
  totalLoansThisWeek: number;
}

interface NeverBorrowedMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  className: string | null;
  section: string | null;
  studentNumber: string | null;
  createdAt: string;
}

interface School {
  id: string;
  name: string;
  slug: string;
}

interface SchoolSettings {
  id: string;
  loanDays: number;
  maxLoans: number;
  maxRenewals: number;
  finePerDay: number;
  maxFine: number;
  reservationDays: number;
  maxReservations: number;
}

type TabType = 'dashboard' | 'books' | 'categories' | 'members' | 'approvals' | 'overdue' | 'reports' | 'activities' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [neverBorrowed, setNeverBorrowed] = useState<Book[]>([]);
  const [lowStock, setLowStock] = useState<Book[]>([]);
  const [neverBorrowedMembers, setNeverBorrowedMembers] = useState<NeverBorrowedMember[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    quantity: 1,
    categoryId: '',
    coverImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    loanDays: 14,
    maxLoans: 3,
    maxRenewals: 2,
    finePerDay: 1.0,
    maxFine: 50.0,
    reservationDays: 3,
    maxReservations: 2,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  // Kategori yönetimi state'leri
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ slug: '', name: '', icon: '📚', color: '#6366f1' });
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ id: string; name: string } | null>(null);
  const [qrBook, setQrBook] = useState<Book | null>(null);
  const [chartData, setChartData] = useState<{
    monthlyStats: { month: string; loans: number; returns: number }[];
    categoryDistribution: { name: string; count: number; color: string }[];
    weeklyStats: { week: string; count: number }[];
  } | null>(null);

  // Toplu işlem state'leri
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [selectedPendingUsers, setSelectedPendingUsers] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);

  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = await getToken();
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
        setFormData({ ...formData, coverImage: fullUrl });
      } else {
        toast.error('Dosya yüklenemedi');
      }
    } catch (err) {
      toast.error('Dosya yükleme hatası');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // Auth yüklenene kadar bekle
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    checkAdminAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const checkAdminAndFetch = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        router.replace('/login');
        return;
      }

      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!userRes.ok) {
        setLoading(false);
        router.replace('/books');
        return;
      }

      const userText = await userRes.text();
      if (!userText) {
        setLoading(false);
        router.replace('/books');
        return;
      }

      const userData = JSON.parse(userText);

      // ADMIN veya DEVELOPER erişebilir
      if (userData.role !== 'ADMIN' && userData.role !== 'DEVELOPER') {
        setLoading(false);
        router.replace('/books');
        return;
      }

      setUserInfo(userData);

      // DEVELOPER ise okul listesini çek ve seçim yaptır
      if (userData.role === 'DEVELOPER') {
        const schoolsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (schoolsRes.ok) {
          const schoolsData = await schoolsRes.json();
          setSchools(schoolsData);

          // URL'den schoolId al veya localStorage'dan al
          const params = new URLSearchParams(window.location.search);
          const urlSchoolId = params.get('schoolId');
          const savedSchoolId = localStorage.getItem('developer_selected_school');
          const schoolId = urlSchoolId || savedSchoolId || (schoolsData.length > 0 ? schoolsData[0].id : null);

          if (schoolId && token) {
            setSelectedSchoolId(schoolId);
            localStorage.setItem('developer_selected_school', schoolId);
            await fetchAllData(token, schoolId);
          }
        }
      } else {
        // ADMIN için kendi okulunun verilerini çek
        setSelectedSchoolId(userData.schoolId);
        if (token) {
          await fetchAllData(token);
        }
      }
    } catch {
      router.replace('/books');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (token: string, schoolId?: string) => {
    try {
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      // DEVELOPER için X-School-Id header ekle
      if (schoolId) {
        headers['X-School-Id'] = schoolId;
      }

      const [
        booksRes,
        categoriesRes,
        statsRes,
        overdueRes,
        membersRes,
        activitiesRes,
        popularRes,
        neverBorrowedRes,
        lowStockRes,
        neverBorrowedMembersRes,
        pendingUsersRes,
        settingsRes,
        chartsRes,
      ] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/dashboard`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/overdue`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/members`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/activities`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/popular-books`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/never-borrowed`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/low-stock`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/never-borrowed-members`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/pending`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my/settings`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/charts`, { headers }),
      ]);

      if (booksRes.ok) setBooks(await booksRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (overdueRes.ok) setOverdueLoans(await overdueRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (popularRes.ok) setPopularBooks(await popularRes.json());
      if (neverBorrowedRes.ok) setNeverBorrowed(await neverBorrowedRes.json());
      if (lowStockRes.ok) setLowStock(await lowStockRes.json());
      if (neverBorrowedMembersRes.ok) setNeverBorrowedMembers(await neverBorrowedMembersRes.json());
      if (pendingUsersRes.ok) setPendingUsers(await pendingUsersRes.json());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setSchoolSettings(settings);
        setSettingsForm({
          loanDays: settings.loanDays,
          maxLoans: settings.maxLoans,
          maxRenewals: settings.maxRenewals,
          finePerDay: settings.finePerDay,
          maxFine: settings.maxFine,
          reservationDays: settings.reservationDays,
          maxReservations: settings.maxReservations,
        });
      }
      if (chartsRes.ok) setChartData(await chartsRes.json());
    } catch {
      // Data fetch failed
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const url = editingBook
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/books/${editingBook.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/books`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(url, {
        method: editingBook ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const book = await res.json();
        if (editingBook) {
          setBooks(books.map((b) => (b.id === book.id ? book : b)));
        } else {
          setBooks([book, ...books]);
        }
        resetForm();
      } else {
        toast.error('Bir hata oluştu');
      }
    } catch (err) {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setBooks(books.filter((b) => b.id !== deleteConfirm.id));
        toast.success('Kitap başarıyla silindi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Silinemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Toplu kitap silme
  const handleBulkDelete = async () => {
    if (selectedBooks.length === 0) return;

    setBulkDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/bulk-delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bookIds: selectedBooks }),
      });

      if (res.ok) {
        const result = await res.json();
        setBooks(books.filter((b) => !selectedBooks.includes(b.id)));
        setSelectedBooks([]);
        toast.success(`${result.success} kitap silindi${result.failed > 0 ? `, ${result.failed} silinemedi` : ''}`);
        if (result.errors?.length > 0) {
          console.warn('Bulk delete errors:', result.errors);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || 'Toplu silme başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Toplu kullanıcı onaylama
  const handleBulkApprove = async () => {
    if (selectedPendingUsers.length === 0) return;

    setBulkApproving(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/bulk-approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userIds: selectedPendingUsers }),
      });

      if (res.ok) {
        const result = await res.json();
        setPendingUsers(pendingUsers.filter((u) => !selectedPendingUsers.includes(u.id)));
        setSelectedPendingUsers([]);
        toast.success(`${result.success} kullanıcı onaylandı${result.failed > 0 ? `, ${result.failed} onaylanamadı` : ''}`);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Toplu onay başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setBulkApproving(false);
    }
  };

  // Toplu kullanıcı reddetme
  const handleBulkReject = async () => {
    if (selectedPendingUsers.length === 0) return;

    setBulkApproving(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/bulk-reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userIds: selectedPendingUsers }),
      });

      if (res.ok) {
        const result = await res.json();
        setPendingUsers(pendingUsers.filter((u) => !selectedPendingUsers.includes(u.id)));
        setSelectedPendingUsers([]);
        toast.success(`${result.success} kullanıcı reddedildi${result.failed > 0 ? `, ${result.failed} reddedilemedi` : ''}`);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Toplu red başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setBulkApproving(false);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      description: book.description || '',
      quantity: book.quantity,
      categoryId: book.categoryId || '',
      coverImage: book.coverImage || '',
    });
    setShowForm(true);
    setActiveTab('books');
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingBook(null);
    setFormData({ title: '', author: '', isbn: '', description: '', quantity: 1, categoryId: '', coverImage: '' });
  };

  // Üye detayını yükle
  const fetchMemberDetail = async (memberId: string) => {
    setMemberDetailLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${memberId}/detail`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setMemberDetail(data);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Üye bilgileri yüklenemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setMemberDetailLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/members/${memberId}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
        toast.success('Rol değiştirildi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Rol değiştirilemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatasi');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/approve`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        setPendingUsers(pendingUsers.filter(u => u.id !== userId));
        toast.success('Kullanici onaylandi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Onaylama basarisiz');
      }
    } catch {
      toast.error('Bir hata olustu');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatasi');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/reject`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        setPendingUsers(pendingUsers.filter(u => u.id !== userId));
        toast.success('Kullanici reddedildi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Reddetme basarisiz');
      }
    } catch {
      toast.error('Bir hata olustu');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Okul değiştirme (DEVELOPER için)
  const handleSchoolChange = async (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    localStorage.setItem('developer_selected_school', schoolId);
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        await fetchAllData(token, schoolId);
      }
    } finally {
      setLoading(false);
    }
  };

  // Ayarları kaydet
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(settingsForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setSchoolSettings(updated);
        toast.success('Ayarlar kaydedildi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Ayarlar kaydedilemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSavingSettings(false);
    }
  };

  // CSV Import
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvImporting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Oturum hatası');
        return;
      }

      const text = await file.text();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/import-csv`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ csv: text }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`${result.imported} kitap başarıyla eklendi`);
        // Kitap listesini yenile
        const booksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books`, {
          headers: { 'Authorization': `Bearer ${token}`, ...(selectedSchoolId ? { 'X-School-Id': selectedSchoolId } : {}) },
        });
        if (booksRes.ok) {
          setBooks(await booksRes.json());
        }
      } else {
        const error = await res.json();
        toast.error(error.message || 'CSV import başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setCsvImporting(false);
      // Input'u temizle
      e.target.value = '';
    }
  };

  // CSV şablonu indir
  const handleDownloadTemplate = () => {
    const template = 'title,author,isbn,quantity,description\n"Örnek Kitap","Yazar Adı","9781234567890",5,"Kitap açıklaması"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kitap_import_sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Export fonksiyonu
  const handleExport = async (type: 'books' | 'members' | 'loans' | 'overdue' | 'member-activity') => {
    setExporting(type);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/export/${type}`, {
        headers,
      });

      if (res.ok) {
        const result = await res.json();
        // BOM ekleyerek UTF-8 encoding'i belirt
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Dosya indirildi');
      } else {
        toast.error('Export başarısız');
      }
    } catch {
      toast.error('Export hatası');
    } finally {
      setExporting(null);
    }
  };

  // Kategori işlemleri
  const openCategoryForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        slug: category.slug,
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ slug: '', name: '', icon: '📚', color: '#6366f1' });
    }
    setShowCategoryForm(true);
  };

  const closeCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryForm({ slug: '', name: '', icon: '📚', color: '#6366f1' });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.slug) {
      toast.error('İsim ve slug zorunlu');
      return;
    }

    setSavingCategory(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editingCategory.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/categories`;

      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(categoryForm),
      });

      if (res.ok) {
        toast.success(editingCategory ? 'Kategori güncellendi' : 'Kategori eklendi');
        closeCategoryForm();
        // Kategorileri yenile
        const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
          headers: { 'Authorization': `Bearer ${token}`, ...(selectedSchoolId ? { 'X-School-Id': selectedSchoolId } : {}) },
        });
        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
      } else {
        const error = await res.json();
        toast.error(error.message || 'Kayıt başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;

    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (selectedSchoolId && userInfo?.role === 'DEVELOPER') {
        headers['X-School-Id'] = selectedSchoolId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${deleteCategoryConfirm.id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        toast.success('Kategori silindi');
        setCategories(categories.filter((c) => c.id !== deleteCategoryConfirm.id));
      } else {
        const error = await res.json();
        toast.error(error.message || 'Silme başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setDeleteCategoryConfirm(null);
    }
  };

  // Slug oluştur
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // QR Kod yazdır
  const handlePrintQR = () => {
    if (!qrBook) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Kod - ${qrBook.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #ddd;
              border-radius: 8px;
            }
            h1 { font-size: 18px; margin: 0 0 5px 0; }
            p { font-size: 14px; color: #666; margin: 0 0 15px 0; }
            .isbn { font-family: monospace; font-size: 12px; margin-top: 10px; }
            @media print {
              body { padding: 0; }
              .qr-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${qrBook.title}</h1>
            <p>${qrBook.author}</p>
            <div id="qr"></div>
            <p class="isbn">ISBN: ${qrBook.isbn || 'N/A'}</p>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.createElement('canvas'), '${typeof window !== 'undefined' ? window.location.origin : ''}/books/${qrBook.id}', { width: 200 }, function(error, canvas) {
              if (!error) {
                document.getElementById('qr').appendChild(canvas);
                setTimeout(() => window.print(), 500);
              }
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main id="main-content" role="main" aria-label="Yönetim Paneli" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: colors.primaryLight, fontSize: '18px' }} aria-live="polite">Yükleniyor...</div>
        </main>
      </div>
    );
  }

  if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'DEVELOPER')) {
    return null;
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: '📊' },
    { id: 'books' as TabType, label: 'Kitaplar', icon: '📚' },
    { id: 'categories' as TabType, label: 'Kategoriler', icon: '🏷️' },
    { id: 'members' as TabType, label: 'Üyeler', icon: '👥' },
    { id: 'approvals' as TabType, label: 'Onay Bekleyenler', icon: '⏳', badge: pendingUsers.length },
    { id: 'overdue' as TabType, label: 'Gecikmeler ', icon: '⏰', badge: overdueLoans.length },
    { id: 'reports' as TabType, label: 'Raporlar', icon: '📈' },
    { id: 'activities' as TabType, label: 'Aktiviteler', icon: '🔔' },
    { id: 'settings' as TabType, label: 'Ayarlar', icon: '⚙️' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main id="main-content" role="main" aria-label="Yönetim Paneli" style={{ flex: 1, maxWidth: '1400px', margin: '0 auto', padding: spacing.xl, width: '100%', boxSizing: 'border-box' }}>
        {/* DEVELOPER için Okul Seçici */}
        {userInfo?.role === 'DEVELOPER' && schools.length > 0 && (
          <Card style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
              <Badge variant="developer">🔧 DEVELOPER MODE</Badge>
              <span style={{ color: colors.gray }}>|</span>
              <span style={{ color: colors.white, fontWeight: 500 }}>Okul:</span>
              <select
                value={selectedSchoolId || ''}
                onChange={(e) => handleSchoolChange(e.target.value)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  color: colors.white,
                  fontSize: '14px',
                  minWidth: '250px',
                  cursor: 'pointer',
                }}
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.slug})
                  </option>
                ))}
              </select>
              <Link href="/developer" style={{ marginLeft: 'auto' }}>
                <Button variant="secondary">← Developer Panel</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl, overflowX: 'auto', paddingBottom: spacing.sm }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.md} ${spacing.lg}`,
                backgroundColor: activeTab === tab.id ? colors.primary : colors.card,
                color: activeTab === tab.id ? colors.white : colors.gray,
                border: `1px solid ${activeTab === tab.id ? colors.primary : colors.border}`,
                borderRadius: borderRadius.lg,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                whiteSpace: 'nowrap',
                position: 'relative',
                transition: `all ${transitions.normal}`,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span style={{
                  backgroundColor: colors.error,
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: borderRadius.full,
                  fontWeight: 'bold',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>📊 Dashboard</h2>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.md, marginBottom: spacing['2xl'] }}>
              {[
                { label: 'Kitap', value: stats.totalBooks, icon: '📚', color: colors.info },
                { label: 'Adet', value: stats.totalBookQuantity, icon: '📖', color: colors.primary },
                { label: 'Üye', value: stats.totalMembers, icon: '👥', color: colors.success },
                { label: 'Aktif', value: stats.activeLoans, icon: '📤', color: colors.warning },
                { label: 'Gecikmiş', value: stats.overdueLoans, icon: '⚠️', color: colors.error },
                { label: 'Hafta', value: stats.totalLoansThisWeek, icon: '📅', color: colors.primaryLight },
                { label: 'Ay', value: stats.totalLoansThisMonth, icon: '📆', color: colors.accent },
              ].map((stat, i) => (
                <Card key={i} style={{ padding: spacing.md, textAlign: 'center' }}>
                  <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                  <p style={{ color: stat.color, fontSize: '22px', fontWeight: 'bold', margin: `${spacing.xs} 0` }}>{stat.value}</p>
                  <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* Quick Alerts */}
            {pendingUsers.length > 0 && (
              <Alert variant="warning" style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <strong>{pendingUsers.length} ogrenci onay bekliyor!</strong>
                    <span style={{ display: 'block', opacity: 0.8, fontSize: '13px' }}>Onay Bekleyenler sekmesinden onaylayabilirsiniz.</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTab('approvals')}>
                    Goruntule
                  </Button>
                </div>
              </Alert>
            )}

            {overdueLoans.length > 0 && (
              <Alert variant="error" style={{ marginBottom: spacing.xl }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <strong>{overdueLoans.length} gecikmis iade var!</strong>
                    <span style={{ display: 'block', opacity: 0.8, fontSize: '13px' }}>Gecikmeler sekmesinden detaylari goruntuleyebilirsiniz.</span>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => setActiveTab('overdue')}>
                    Goruntule
                  </Button>
                </div>
              </Alert>
            )}

            {/* Charts Section */}
            {chartData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: spacing.xl, marginBottom: spacing.xl }}>
                {/* Monthly Loans Chart */}
                <Card>
                  <Card.Header>
                    <Card.Title>Aylık İstatistikler</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingBottom: spacing.lg }}>
                      {chartData.monthlyStats.map((stat, i) => {
                        const maxVal = Math.max(...chartData.monthlyStats.map((s) => Math.max(s.loans, s.returns)), 1);
                        const loanHeight = (stat.loans / maxVal) * 150;
                        const returnHeight = (stat.returns / maxVal) * 150;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <div style={{ display: 'flex', gap: '1px', height: '150px', alignItems: 'flex-end' }}>
                              <div
                                style={{
                                  width: '8px',
                                  height: `${loanHeight}px`,
                                  backgroundColor: colors.primary,
                                  borderRadius: '2px 2px 0 0',
                                }}
                                title={`Ödünç: ${stat.loans}`}
                              />
                              <div
                                style={{
                                  width: '8px',
                                  height: `${returnHeight}px`,
                                  backgroundColor: colors.success,
                                  borderRadius: '2px 2px 0 0',
                                }}
                                title={`İade: ${stat.returns}`}
                              />
                            </div>
                            <span style={{ color: colors.gray, fontSize: '9px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{stat.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: spacing.lg, justifyContent: 'center', marginTop: spacing.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: colors.primary, borderRadius: '2px' }} />
                        <span style={{ color: colors.gray, fontSize: '12px' }}>Ödünç</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: colors.success, borderRadius: '2px' }} />
                        <span style={{ color: colors.gray, fontSize: '12px' }}>İade</span>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                {/* Category Distribution Chart */}
                {chartData.categoryDistribution.length > 0 && (
                  <Card>
                    <Card.Header>
                      <Card.Title>Kategori Dağılımı</Card.Title>
                    </Card.Header>
                    <Card.Content>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                        {chartData.categoryDistribution.map((cat, i) => {
                          const maxCount = chartData.categoryDistribution[0].count;
                          const width = (cat.count / maxCount) * 100;
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                              <span style={{ color: colors.gray, fontSize: '12px', minWidth: '80px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {cat.name}
                              </span>
                              <div style={{ flex: 1, height: '20px', backgroundColor: colors.bgLight, borderRadius: borderRadius.sm, overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${width}%`,
                                    backgroundColor: cat.color,
                                    borderRadius: borderRadius.sm,
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                              <span style={{ color: colors.white, fontSize: '12px', minWidth: '30px', textAlign: 'right' }}>{cat.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card.Content>
                  </Card>
                )}

                {/* Weekly Activity Chart */}
                <Card>
                  <Card.Header>
                    <Card.Title>Haftalık Aktivite</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacing.md, height: '150px', justifyContent: 'center' }}>
                      {chartData.weeklyStats.map((stat, i) => {
                        const maxVal = Math.max(...chartData.weeklyStats.map((s) => s.count), 1);
                        const height = (stat.count / maxVal) * 120 + 10;
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.xs }}>
                            <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '14px' }}>{stat.count}</span>
                            <div
                              style={{
                                width: '50px',
                                height: `${height}px`,
                                backgroundColor: colors.primary,
                                borderRadius: borderRadius.md,
                              }}
                            />
                            <span style={{ color: colors.gray, fontSize: '11px' }}>{stat.week}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card.Content>
                </Card>
              </div>
            )}

            {/* Recent Activities Preview */}
            <Card>
              <Card.Header>
                <Card.Title>🔔 Son Aktiviteler</Card.Title>
              </Card.Header>
              <Card.Content>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: colors.bg,
                      borderRadius: borderRadius.md,
                    }}>
                      <span style={{ fontSize: '20px' }}>{activity.returnedAt ? '✅' : '📤'}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>
                          <strong>{activity.user.name}</strong> - {activity.book.title}
                        </p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>
                          {activity.returnedAt ? 'İade etti' : 'Ödünç aldı'} • {formatDateTime(activity.returnedAt || activity.borrowedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" style={{ width: '100%', marginTop: spacing.lg }} onClick={() => setActiveTab('activities')}>
                  Tümünü Gör →
                </Button>
              </Card.Content>
            </Card>
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, flexWrap: 'wrap', gap: spacing.md }}>
              <h2 style={{ color: colors.white, fontSize: '24px', margin: 0 }}>📚 Kitap Yönetimi</h2>
              <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
                {/* CSV Import */}
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: colors.success,
                  color: colors.white,
                  borderRadius: borderRadius.md,
                  cursor: csvImporting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: csvImporting ? 0.7 : 1,
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    disabled={csvImporting}
                    style={{ display: 'none' }}
                  />
                  {csvImporting ? '⏳ İçe Aktarılıyor...' : '📥 CSV İçe Aktar'}
                </label>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  📄 Şablon İndir
                </Button>
                <Button onClick={() => { resetForm(); setShowForm(true); }}>
                  + Yeni Kitap Ekle
                </Button>
              </div>
            </div>

            {/* Book Form */}
            {showForm && (
              <Card style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
                <h3 style={{ color: colors.white, marginBottom: spacing.lg, marginTop: 0 }}>{editingBook ? 'Kitap Düzenle' : 'Yeni Kitap Ekle'}</h3>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg, marginBottom: spacing.lg }}>
                    <Input
                      label="Başlık *"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                    <Input
                      label="Yazar *"
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      required
                    />
                    <Input
                      label="ISBN (opsiyonel)"
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="978-xxx-xxx-xxxx"
                    />
                    <Input
                      label="Adet"
                      type="number"
                      value={formData.quantity.toString()}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                    <div>
                      <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Kategori</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: spacing.md,
                          backgroundColor: colors.bg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: borderRadius.md,
                          color: colors.white,
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="">Kategori Seçin</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: spacing.lg }}>
                    <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Açıklama</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: spacing.md,
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.md,
                        color: colors.white,
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: spacing.lg }}>
                    <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Kapak Resmi</label>
                    <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: `${spacing.md} ${spacing.lg}`,
                        backgroundColor: colors.bg,
                        border: `2px dashed ${colors.border}`,
                        borderRadius: borderRadius.md,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        color: colors.gray,
                      }}>
                        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
                        {uploading ? '⏳ Yükleniyor...' : '📷 Fotoğraf Seç'}
                      </label>
                      {formData.coverImage && (
                        <div style={{ position: 'relative' }}>
                          <img src={formData.coverImage} alt="Önizleme" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: borderRadius.sm }} />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, coverImage: '' })}
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: colors.error,
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: spacing.md }}>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Kaydediliyor...' : (editingBook ? 'Güncelle' : 'Kaydet')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetForm}>İptal</Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Bulk Actions */}
            {selectedBooks.length > 0 && (
              <Card style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.warning + '15', borderColor: colors.warning }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
                  <span style={{ color: colors.white, fontWeight: 500 }}>
                    {selectedBooks.length} kitap seçildi
                  </span>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <Button size="sm" variant="outline" onClick={() => setSelectedBooks([])}>
                      Seçimi Kaldır
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                      {bulkDeleting ? '⏳ Siliniyor...' : `🗑️ Seçilenleri Sil (${selectedBooks.length})`}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Books Table */}
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.bg }}>
                      <th style={{ padding: spacing.lg, textAlign: 'center', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedBooks.length === books.length && books.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBooks(books.map((b) => b.id));
                            } else {
                              setSelectedBooks([]);
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }}
                          aria-label="Tümünü seç"
                        />
                      </th>
                      <th style={{ padding: spacing.lg, textAlign: 'left', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Kitap</th>
                      <th style={{ padding: spacing.lg, textAlign: 'left', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Kategori</th>
                      <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Stok</th>
                      <th style={{ padding: spacing.lg, textAlign: 'right', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id} style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: selectedBooks.includes(book.id) ? colors.primary + '10' : 'transparent' }}>
                        <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedBooks.includes(book.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBooks([...selectedBooks, book.id]);
                              } else {
                                setSelectedBooks(selectedBooks.filter((id) => id !== book.id));
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }}
                            aria-label={`${book.title} seç`}
                          />
                        </td>
                        <td style={{ padding: spacing.lg }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                            {book.coverImage && <img src={book.coverImage} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: borderRadius.sm }} />}
                            <div>
                              <p style={{ color: colors.white, fontWeight: 600, fontSize: '14px', margin: 0 }}>{book.title}</p>
                              <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{book.author}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: spacing.lg }}>
                          {book.category && (
                            <Badge style={{ backgroundColor: book.category.color + '20', color: book.category.color }}>
                              {book.category.icon} {book.category.name}
                            </Badge>
                          )}
                        </td>
                        <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                          <Badge variant={book.available > 0 ? 'success' : 'danger'}>
                            {book.available}/{book.quantity}
                          </Badge>
                        </td>
                        <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="secondary" onClick={() => setQrBook(book)} title="QR Kod">📱</Button>
                            <Button size="sm" onClick={() => handleEdit(book)}>Düzenle</Button>
                            <Button size="sm" variant="danger" onClick={() => setDeleteConfirm({ id: book.id, title: book.title })}>Sil</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
              <h2 style={{ color: colors.white, fontSize: '24px', margin: 0 }}>🏷️ Kategori Yönetimi</h2>
              <Button onClick={() => openCategoryForm()}>+ Yeni Kategori</Button>
            </div>

            {/* Kategori Ekleme/Düzenleme Formu */}
            {showCategoryForm && (
              <Card style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
                <h3 style={{ color: colors.white, marginTop: 0, marginBottom: spacing.lg }}>
                  {editingCategory ? '✏️ Kategori Düzenle' : '➕ Yeni Kategori'}
                </h3>
                <form onSubmit={handleSaveCategory}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
                    <Input
                      label="Kategori Adı"
                      placeholder="Örn: Roman"
                      value={categoryForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setCategoryForm({
                          ...categoryForm,
                          name,
                          slug: editingCategory ? categoryForm.slug : generateSlug(name),
                        });
                      }}
                      required
                    />
                    <Input
                      label="Slug (URL)"
                      placeholder="Örn: roman"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                      required
                      disabled={!!editingCategory}
                    />
                    <Input
                      label="İkon (Emoji)"
                      placeholder="Örn: 📖"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    />
                    <div>
                      <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                        Renk
                      </label>
                      <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                        <input
                          type="color"
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                          style={{ width: '50px', height: '42px', border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' }}
                        />
                        <Input
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Önizleme */}
                  <div style={{ marginTop: spacing.lg }}>
                    <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                      Önizleme
                    </label>
                    <Badge style={{ backgroundColor: categoryForm.color + '20', color: categoryForm.color }}>
                      {categoryForm.icon} {categoryForm.name || 'Kategori Adı'}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xl }}>
                    <Button type="submit" disabled={savingCategory}>
                      {savingCategory ? 'Kaydediliyor...' : (editingCategory ? 'Güncelle' : 'Kaydet')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={closeCategoryForm}>İptal</Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Kategoriler Listesi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
              {categories.map((category) => (
                <Card key={category.id} style={{ padding: spacing.lg }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: borderRadius.md,
                        backgroundColor: category.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}>
                        {category.icon}
                      </div>
                      <div>
                        <p style={{ color: colors.white, fontWeight: 600, fontSize: '16px', margin: 0 }}>{category.name}</p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>/{category.slug}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: spacing.sm }}>
                      <Button size="sm" variant="secondary" onClick={() => openCategoryForm(category)}>Düzenle</Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteCategoryConfirm({ id: category.id, name: category.name })}>Sil</Button>
                    </div>
                  </div>
                </Card>
              ))}
              {categories.length === 0 && (
                <Card style={{ padding: spacing.xl, textAlign: 'center' }}>
                  <p style={{ color: colors.gray }}>Henüz kategori eklenmemiş</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>👥 Üye Yönetimi</h2>
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.bg }}>
                      <th style={{ padding: spacing.lg, textAlign: 'left', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Üye</th>
                      <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Rol</th>
                      <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Toplam Ödünç</th>
                      <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Aktif</th>
                      <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Gecikmiş</th>
                      <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Kayıt</th>
                      <th style={{ padding: spacing.lg, textAlign: 'right', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td style={{ padding: spacing.lg }}>
                          <p style={{ color: colors.white, fontWeight: 600, fontSize: '14px', margin: 0 }}>{member.name}</p>
                          <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{member.email}</p>
                        </td>
                        <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                          <Badge variant={member.role === 'ADMIN' ? 'admin' : 'member'}>
                            {member.role === 'ADMIN' ? '👑 Admin' : '👤 Üye'}
                          </Badge>
                        </td>
                        <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.white }}>{member.totalLoans}</td>
                        <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                          <Badge variant="warning">{member.activeLoans}</Badge>
                        </td>
                        <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                          <Badge variant={member.overdueLoans > 0 ? 'danger' : 'success'}>
                            {member.overdueLoans}
                          </Badge>
                        </td>
                        <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontSize: '12px' }}>{formatDate(member.createdAt)}</td>
                        <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchMemberDetail(member.id)}
                            >
                              📋 Detay
                            </Button>
                            {member.id !== userInfo?.id && (
                              <Button
                                size="sm"
                                variant={member.role === 'ADMIN' ? 'ghost' : 'secondary'}
                                onClick={() => handleRoleChange(member.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                              >
                                {member.role === 'ADMIN' ? 'Üye Yap' : 'Admin Yap'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>Onay Bekleyen Ogrenciler</h2>
            {pendingUsers.length === 0 ? (
              <Card style={{ padding: spacing['3xl'], textAlign: 'center' }}>
                <span style={{ fontSize: '48px' }}>✓</span>
                <p style={{ color: colors.success, fontSize: '18px', marginTop: spacing.lg }}>Onay bekleyen kimse yok!</p>
              </Card>
            ) : (
              <>
                {/* Bulk Actions for Approvals */}
                {selectedPendingUsers.length > 0 && (
                  <Card style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.primary + '15', borderColor: colors.primary }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
                      <span style={{ color: colors.white, fontWeight: 500 }}>
                        {selectedPendingUsers.length} öğrenci seçildi
                      </span>
                      <div style={{ display: 'flex', gap: spacing.sm }}>
                        <Button size="sm" variant="outline" onClick={() => setSelectedPendingUsers([])}>
                          Seçimi Kaldır
                        </Button>
                        <Button size="sm" style={{ backgroundColor: colors.success }} onClick={handleBulkApprove} disabled={bulkApproving}>
                          {bulkApproving ? '⏳ İşleniyor...' : `✓ Tümünü Onayla (${selectedPendingUsers.length})`}
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleBulkReject} disabled={bulkApproving}>
                          {bulkApproving ? '⏳ İşleniyor...' : `✗ Tümünü Reddet (${selectedPendingUsers.length})`}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
                <Card>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.bg }}>
                          <th style={{ padding: spacing.lg, textAlign: 'center', width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={selectedPendingUsers.length === pendingUsers.length && pendingUsers.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPendingUsers(pendingUsers.map((u) => u.id));
                                } else {
                                  setSelectedPendingUsers([]);
                                }
                              }}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }}
                              aria-label="Tümünü seç"
                            />
                          </th>
                          <th style={{ padding: spacing.lg, textAlign: 'left', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Ogrenci</th>
                          <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Sinif</th>
                          <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Okul No</th>
                          <th style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Basvuru Tarihi</th>
                          <th style={{ padding: spacing.lg, textAlign: 'right', color: colors.gray, fontWeight: 600, fontSize: '13px' }}>Islemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingUsers.map((user) => (
                          <tr key={user.id} style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: selectedPendingUsers.includes(user.id) ? colors.primary + '10' : 'transparent' }}>
                            <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedPendingUsers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPendingUsers([...selectedPendingUsers, user.id]);
                                  } else {
                                    setSelectedPendingUsers(selectedPendingUsers.filter((id) => id !== user.id));
                                  }
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }}
                                aria-label={`${user.name} seç`}
                              />
                            </td>
                            <td style={{ padding: spacing.lg }}>
                              <p style={{ color: colors.white, fontWeight: 600, fontSize: '14px', margin: 0 }}>{user.name}</p>
                              <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{user.email}</p>
                            </td>
                            <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                              <Badge variant="warning">
                                {user.className}-{user.section}
                              </Badge>
                            </td>
                            <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.white, fontWeight: 600 }}>
                              {user.studentNumber || '-'}
                            </td>
                            <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontSize: '12px' }}>
                              {formatDate(user.createdAt)}
                            </td>
                            <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                                <Button
                                  size="sm"
                                  style={{ backgroundColor: colors.success }}
                                  onClick={() => handleApproveUser(user.id)}
                                >
                                  Onayla
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleRejectUser(user.id)}
                                >
                                  Reddet
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Overdue Tab */}
        {activeTab === 'overdue' && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>⚠️ Gecikmiş İadeler</h2>
            {overdueLoans.length === 0 ? (
              <Card style={{ padding: spacing['3xl'], textAlign: 'center' }}>
                <span style={{ fontSize: '48px' }}>✅</span>
                <p style={{ color: colors.success, fontSize: '18px', marginTop: spacing.lg }}>Gecikmiş iade yok!</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {overdueLoans.map((loan) => (
                  <Card key={loan.id} style={{ padding: spacing.lg, border: `1px solid ${colors.error}30` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: colors.error + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '24px' }}>⚠️</span>
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <p style={{ color: colors.white, fontWeight: 600, fontSize: '16px', margin: 0 }}>{loan.book.title}</p>
                        <p style={{ color: colors.gray, fontSize: '13px', margin: 0 }}>{loan.book.author}</p>
                      </div>
                      <div style={{ minWidth: '150px' }}>
                        <p style={{ color: colors.white, fontWeight: 600, margin: 0 }}>{loan.user.name}</p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{loan.user.email}</p>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: '100px' }}>
                        <p style={{ color: colors.error, fontWeight: 'bold', fontSize: '24px', margin: 0 }}>{loan.daysOverdue}</p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>gün gecikmiş</p>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Son iade tarihi</p>
                        <p style={{ color: colors.error, fontWeight: 600, margin: 0 }}>{formatDate(loan.dueDate)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>📈 Raporlar</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: spacing.xl }}>
              {/* Popular Books */}
              <Card>
                <Card.Header>
                  <Card.Title>🏆 En Çok Ödünç Alınan</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    {popularBooks.slice(0, 5).map((book, i) => (
                      <div key={book.id || `popular-${i}`} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: i === 0 ? colors.primary : colors.gray,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{book.title}</p>
                          <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{book.author}</p>
                        </div>
                        <Badge variant="warning">{book.loanCount}x</Badge>
                      </div>
                    ))}
                    {popularBooks.length === 0 && <p style={{ color: colors.gray, textAlign: 'center', padding: spacing.lg }}>Henüz veri yok</p>}
                  </div>
                </Card.Content>
              </Card>

              {/* Never Borrowed */}
              <Card>
                <Card.Header>
                  <Card.Title>📕 Hiç Ödünç Alınmayan</Card.Title>
                </Card.Header>
                <Card.Content style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    {neverBorrowed.map((book) => (
                      <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                        <span style={{ fontSize: '20px' }}>📖</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{book.title}</p>
                          <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{book.author}</p>
                        </div>
                      </div>
                    ))}
                    {neverBorrowed.length === 0 && <p style={{ color: colors.success, textAlign: 'center', padding: spacing.lg }}>✓ Tüm kitaplar en az bir kez ödünç alınmış</p>}
                  </div>
                </Card.Content>
              </Card>

              {/* Low Stock */}
              <Card>
                <Card.Header>
                  <Card.Title>📉 Stokta Az Kalan</Card.Title>
                </Card.Header>
                <Card.Content style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    {lowStock.map((book) => (
                      <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                        <Badge variant={book.available === 0 ? 'danger' : 'warning'}>
                          {book.available}/{book.quantity}
                        </Badge>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{book.title}</p>
                          <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{book.author}</p>
                        </div>
                      </div>
                    ))}
                    {lowStock.length === 0 && <p style={{ color: colors.success, textAlign: 'center', padding: spacing.lg }}>✓ Tüm kitaplar stokta mevcut</p>}
                  </div>
                </Card.Content>
              </Card>

              {/* Never Borrowed Members */}
              <Card>
                <Card.Header>
                  <Card.Title>👤 Hiç Kitap Almayan Üyeler</Card.Title>
                </Card.Header>
                <Card.Content style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    {neverBorrowedMembers.map((member) => (
                      <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.sm, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                        <span style={{ fontSize: '20px' }}>{member.role === 'ADMIN' ? '👑' : '👤'}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{member.name}</p>
                          <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{member.email}</p>
                        </div>
                        <span style={{ color: colors.gray, fontSize: '11px' }}>{formatDate(member.createdAt)}</span>
                      </div>
                    ))}
                    {neverBorrowedMembers.length === 0 && <p style={{ color: colors.success, textAlign: 'center', padding: spacing.lg }}>✓ Tüm üyeler en az bir kitap ödünç almış</p>}
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Export Section */}
            <Card style={{ marginTop: spacing.xl }}>
              <Card.Header>
                <Card.Title>📥 Veri Dışa Aktarma (CSV)</Card.Title>
              </Card.Header>
              <Card.Content>
                <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.lg }}>
                  Aşağıdaki butonları kullanarak verilerinizi CSV formatında indirebilirsiniz.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('books')}
                    disabled={exporting !== null}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
                  >
                    {exporting === 'books' ? '⏳ İndiriliyor...' : '📚 Kitap Listesi'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('members')}
                    disabled={exporting !== null}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
                  >
                    {exporting === 'members' ? '⏳ İndiriliyor...' : '👥 Üye Listesi'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('loans')}
                    disabled={exporting !== null}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
                  >
                    {exporting === 'loans' ? '⏳ İndiriliyor...' : '📖 Ödünç İşlemleri'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('overdue')}
                    disabled={exporting !== null}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
                  >
                    {exporting === 'overdue' ? '⏳ İndiriliyor...' : '⚠️ Gecikmiş Ödünçler'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('member-activity')}
                    disabled={exporting !== null}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
                  >
                    {exporting === 'member-activity' ? '⏳ İndiriliyor...' : '📊 Üye Aktivite Raporu'}
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>🔔 Son Aktiviteler</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {activities.map((activity) => (
                <Card key={activity.id} style={{ padding: spacing.lg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: activity.returnedAt ? colors.success + '20' : colors.warning + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '24px' }}>{activity.returnedAt ? '✅' : '📤'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>
                        <strong>{activity.user.name}</strong>
                        {activity.returnedAt ? ' iade etti: ' : ' ödünç aldı: '}
                        <span style={{ color: colors.primaryLight }}>{activity.book.title}</span>
                      </p>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{activity.user.email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>
                        {formatDateTime(activity.returnedAt || activity.borrowedAt)}
                      </p>
                      <Badge variant={activity.returnedAt ? 'success' : 'warning'}>
                        {activity.returnedAt ? 'İade Edildi' : 'Aktif'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>⚙️ Kütüphane Ayarları</h2>

            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: spacing.xl }}>
                {/* Ödünç Alma Ayarları */}
                <Card>
                  <Card.Header>
                    <Card.Title>📚 Ödünç Alma Ayarları</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                      <div>
                        <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                          Ödünç Süresi (Gün)
                        </label>
                        <Input
                          type="number"
                          value={settingsForm.loanDays.toString()}
                          onChange={(e) => setSettingsForm({ ...settingsForm, loanDays: parseInt(e.target.value) || 14 })}
                          min={1}
                          max={90}
                        />
                        <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>
                          Kitapların varsayılan ödünç alma süresi
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                          Maksimum Ödünç Kitap Sayısı
                        </label>
                        <Input
                          type="number"
                          value={settingsForm.maxLoans.toString()}
                          onChange={(e) => setSettingsForm({ ...settingsForm, maxLoans: parseInt(e.target.value) || 3 })}
                          min={1}
                          max={20}
                        />
                        <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>
                          Bir üyenin aynı anda ödünç alabileceği kitap sayısı
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                          Maksimum Yenileme Sayısı
                        </label>
                        <Input
                          type="number"
                          value={settingsForm.maxRenewals.toString()}
                          onChange={(e) => setSettingsForm({ ...settingsForm, maxRenewals: parseInt(e.target.value) || 2 })}
                          min={0}
                          max={10}
                        />
                        <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>
                          Bir kitabın kaç kez yenilenebileceği
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                {/* Ceza Ayarları */}
                <Card>
                  <Card.Header>
                    <Card.Title>💰 Ceza Ayarları</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                      <div>
                        <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                          Günlük Ceza Miktarı (₺)
                        </label>
                        <Input
                          type="number"
                          step="0.50"
                          value={settingsForm.finePerDay.toString()}
                          onChange={(e) => setSettingsForm({ ...settingsForm, finePerDay: parseFloat(e.target.value) || 1 })}
                          min={0}
                          max={100}
                        />
                        <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>
                          Her geciken gün için uygulanacak ceza
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                          Maksimum Ceza Miktarı (₺)
                        </label>
                        <Input
                          type="number"
                          step="1"
                          value={settingsForm.maxFine.toString()}
                          onChange={(e) => setSettingsForm({ ...settingsForm, maxFine: parseFloat(e.target.value) || 50 })}
                          min={0}
                          max={1000}
                        />
                        <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>
                          Bir kitap için uygulanabilecek maksimum ceza
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>

                {/* Rezervasyon Ayarları */}
                <Card>
                  <Card.Header>
                    <Card.Title>📅 Rezervasyon Ayarları</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                      <div>
                        <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                          Rezervasyon Bekleme Süresi (Gün)
                        </label>
                        <Input
                          type="number"
                          value={settingsForm.reservationDays.toString()}
                          onChange={(e) => setSettingsForm({ ...settingsForm, reservationDays: parseInt(e.target.value) || 3 })}
                          min={1}
                          max={14}
                        />
                        <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>
                          Kitap müsait olduğunda üyenin teslim alması gereken süre
                        </p>
                      </div>

                      <div>
                        <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>
                          Maksimum Aktif Rezervasyon
                        </label>
                        <Input
                          type="number"
                          value={settingsForm.maxReservations.toString()}
                          onChange={(e) => setSettingsForm({ ...settingsForm, maxReservations: parseInt(e.target.value) || 2 })}
                          min={0}
                          max={10}
                        />
                        <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>
                          Bir üyenin yapabileceği maksimum rezervasyon sayısı
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>

              {/* Save Button */}
              <div style={{ marginTop: spacing.xl, display: 'flex', gap: spacing.md }}>
                <Button type="submit" disabled={savingSettings}>
                  {savingSettings ? '⏳ Kaydediliyor...' : '💾 Ayarları Kaydet'}
                </Button>
                {schoolSettings && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSettingsForm({
                      loanDays: schoolSettings.loanDays,
                      maxLoans: schoolSettings.maxLoans,
                      maxRenewals: schoolSettings.maxRenewals,
                      finePerDay: schoolSettings.finePerDay,
                      maxFine: schoolSettings.maxFine,
                      reservationDays: schoolSettings.reservationDays,
                      maxReservations: schoolSettings.maxReservations,
                    })}
                  >
                    ↩️ Değişiklikleri Geri Al
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Kitabı Sil"
        message={`"${deleteConfirm?.title}" kitabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />

      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteCategoryConfirm}
        onClose={() => setDeleteCategoryConfirm(null)}
        onConfirm={handleDeleteCategory}
        title="Kategoriyi Sil"
        message={`"${deleteCategoryConfirm?.name}" kategorisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />

      {/* Member Detail Modal */}
      {(memberDetail || memberDetailLoading) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: spacing.lg,
          }}
          onClick={() => setMemberDetail(null)}
        >
          <Card
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: spacing.xl,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {memberDetailLoading ? (
              <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: `3px solid ${colors.border}`,
                  borderTopColor: colors.primary,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }} />
                <p style={{ color: colors.gray, marginTop: spacing.lg }}>Yükleniyor...</p>
              </div>
            ) : memberDetail && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl }}>
                  <div>
                    <h2 style={{ color: colors.white, margin: 0, fontSize: '24px' }}>{memberDetail.user.name}</h2>
                    <p style={{ color: colors.gray, margin: `${spacing.xs} 0 0` }}>{memberDetail.user.email}</p>
                    {memberDetail.user.className && (
                      <p style={{ color: colors.gray, margin: `${spacing.xs} 0 0`, fontSize: '14px' }}>
                        Sınıf: {memberDetail.user.className}-{memberDetail.user.section} | No: {memberDetail.user.studentNumber}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" onClick={() => setMemberDetail(null)}>✕</Button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: spacing.md, marginBottom: spacing.xl }}>
                  <div style={{ backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, textAlign: 'center' }}>
                    <p style={{ color: colors.primary, fontSize: '24px', fontWeight: 700, margin: 0 }}>{memberDetail.stats.totalLoans}</p>
                    <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Toplam Ödünç</p>
                  </div>
                  <div style={{ backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, textAlign: 'center' }}>
                    <p style={{ color: colors.warning, fontSize: '24px', fontWeight: 700, margin: 0 }}>{memberDetail.stats.activeLoans}</p>
                    <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Aktif</p>
                  </div>
                  <div style={{ backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, textAlign: 'center' }}>
                    <p style={{ color: colors.error, fontSize: '24px', fontWeight: 700, margin: 0 }}>{memberDetail.stats.overdueLoans}</p>
                    <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Gecikmiş</p>
                  </div>
                  <div style={{ backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, textAlign: 'center' }}>
                    <p style={{ color: colors.success, fontSize: '24px', fontWeight: 700, margin: 0 }}>{memberDetail.stats.returnedLoans}</p>
                    <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>İade Edilmiş</p>
                  </div>
                  {memberDetail.stats.unpaidFines > 0 && (
                    <div style={{ backgroundColor: `${colors.error}20`, padding: spacing.md, borderRadius: borderRadius.md, textAlign: 'center' }}>
                      <p style={{ color: colors.error, fontSize: '24px', fontWeight: 700, margin: 0 }}>{memberDetail.stats.unpaidFines.toFixed(2)}₺</p>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Ödenmemiş Ceza</p>
                    </div>
                  )}
                </div>

                {/* Active Loans */}
                {memberDetail.activeLoans.length > 0 && (
                  <div style={{ marginBottom: spacing.xl }}>
                    <h3 style={{ color: colors.white, fontSize: '16px', marginBottom: spacing.md }}>📚 Aktif Ödünçler ({memberDetail.activeLoans.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                      {memberDetail.activeLoans.map((loan) => {
                        const isOverdue = new Date(loan.dueDate) < new Date();
                        return (
                          <div key={loan.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: isOverdue ? `${colors.error}15` : colors.bg,
                            padding: spacing.md,
                            borderRadius: borderRadius.md,
                            border: isOverdue ? `1px solid ${colors.error}50` : 'none',
                          }}>
                            <div>
                              <p style={{ color: colors.white, fontWeight: 600, margin: 0, fontSize: '14px' }}>{loan.book.title}</p>
                              <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{loan.book.author}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ color: isOverdue ? colors.error : colors.gray, fontSize: '12px', margin: 0 }}>
                                İade: {new Date(loan.dueDate).toLocaleDateString('tr-TR')}
                              </p>
                              {isOverdue && <Badge variant="danger">Gecikmiş</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Loan History */}
                <div style={{ marginBottom: spacing.xl }}>
                  <h3 style={{ color: colors.white, fontSize: '16px', marginBottom: spacing.md }}>📖 Ödünç Geçmişi (Son 50)</h3>
                  {memberDetail.loanHistory.length === 0 ? (
                    <p style={{ color: colors.gray, fontSize: '14px' }}>Henüz ödünç alınmamış</p>
                  ) : (
                    <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: colors.bg }}>
                            <th style={{ padding: spacing.sm, textAlign: 'left', color: colors.gray }}>Kitap</th>
                            <th style={{ padding: spacing.sm, textAlign: 'center', color: colors.gray }}>Alınma</th>
                            <th style={{ padding: spacing.sm, textAlign: 'center', color: colors.gray }}>İade</th>
                            <th style={{ padding: spacing.sm, textAlign: 'center', color: colors.gray }}>Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberDetail.loanHistory.map((loan) => (
                            <tr key={loan.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                              <td style={{ padding: spacing.sm }}>
                                <p style={{ color: colors.white, margin: 0 }}>{loan.book.title}</p>
                                <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>{loan.book.author}</p>
                              </td>
                              <td style={{ padding: spacing.sm, textAlign: 'center', color: colors.gray }}>
                                {new Date(loan.borrowedAt).toLocaleDateString('tr-TR')}
                              </td>
                              <td style={{ padding: spacing.sm, textAlign: 'center', color: colors.gray }}>
                                {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString('tr-TR') : '-'}
                              </td>
                              <td style={{ padding: spacing.sm, textAlign: 'center' }}>
                                <Badge variant={loan.status === 'RETURNED' ? 'success' : loan.status === 'ACTIVE' ? 'warning' : 'danger'}>
                                  {loan.status === 'RETURNED' ? 'İade' : loan.status === 'ACTIVE' ? 'Aktif' : 'Gecikmiş'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Reservations */}
                {memberDetail.reservations.length > 0 && (
                  <div style={{ marginBottom: spacing.xl }}>
                    <h3 style={{ color: colors.white, fontSize: '16px', marginBottom: spacing.md }}>📅 Aktif Rezervasyonlar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                      {memberDetail.reservations.map((res) => (
                        <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md }}>
                          <div>
                            <p style={{ color: colors.white, fontWeight: 600, margin: 0, fontSize: '14px' }}>{res.book.title}</p>
                            <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{res.book.author}</p>
                          </div>
                          <Badge variant={res.status === 'READY' ? 'success' : 'warning'}>
                            {res.status === 'READY' ? 'Hazır' : 'Bekliyor'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorites */}
                {memberDetail.favorites.length > 0 && (
                  <div>
                    <h3 style={{ color: colors.white, fontSize: '16px', marginBottom: spacing.md }}>❤️ Favoriler ({memberDetail.favorites.length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
                      {memberDetail.favorites.map((fav) => (
                        <div key={fav.id} style={{ backgroundColor: colors.bg, padding: spacing.sm, borderRadius: borderRadius.md, fontSize: '12px' }}>
                          <span style={{ color: colors.white }}>{fav.book.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* QR Code Modal */}
      {qrBook && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setQrBook(null)}
        >
          <Card style={{ padding: spacing.xl, maxWidth: '350px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: colors.white, marginTop: 0, marginBottom: spacing.sm }}>{qrBook.title}</h3>
            <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.lg }}>{qrBook.author}</p>
            <div style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              borderRadius: borderRadius.md,
              display: 'inline-block',
              marginBottom: spacing.lg,
            }}>
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}/books/${qrBook.id}` : `/books/${qrBook.id}`}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p style={{ color: colors.gray, fontSize: '12px', fontFamily: 'monospace', marginBottom: spacing.lg }}>
              ISBN: {qrBook.isbn || 'N/A'}
            </p>
            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
              <Button onClick={handlePrintQR}>Yazdır</Button>
              <Button variant="ghost" onClick={() => setQrBook(null)}>Kapat</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
