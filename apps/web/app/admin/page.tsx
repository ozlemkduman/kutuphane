'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, spacing, transitions } from '@/lib/theme';
import {
  AdminDashboard,
  AdminBooks,
  AdminCategories,
  AdminMembers,
  AdminApprovals,
  AdminOverdue,
  AdminReports,
  AdminActivities,
  AdminSettings,
  AdminPassiveStudents,
  AdminBorrowOnBehalf,
} from './components';
import type {
  Book, Category, Member, OverdueLoan, Activity, DashboardStats,
  NeverBorrowedMember, PendingUser, School, SchoolSettings, ChartData, UserInfo, TabType,
} from './components/types';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    checkAdminAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const checkAdminAndFetch = async () => {
    try {
      const token = await getToken();
      if (!token) { setLoading(false); router.replace('/login'); return; }

      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!userRes.ok) { setLoading(false); router.replace('/books'); return; }
      const userText = await userRes.text();
      if (!userText) { setLoading(false); router.replace('/books'); return; }
      const userData = JSON.parse(userText);

      if (userData.role !== 'ADMIN' && userData.role !== 'DEVELOPER' && userData.role !== 'TEACHER') {
        setLoading(false); router.replace('/books'); return;
      }

      setUserInfo(userData);
      // Set default tab based on role
      setActiveTab(userData.role === 'TEACHER' ? 'passive-students' : 'dashboard');

      if (userData.role === 'DEVELOPER') {
        const schoolsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (schoolsRes.ok) {
          const schoolsData = await schoolsRes.json();
          setSchools(schoolsData);
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
        setSelectedSchoolId(userData.schoolId);
        if (token) { await fetchAllData(token); }
      }
    } catch { router.replace('/books'); }
    finally { setLoading(false); }
  };

  const fetchAllData = async (token: string, schoolId?: string) => {
    try {
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (schoolId) { headers['X-School-Id'] = schoolId; }

      const [
        booksRes, categoriesRes, statsRes, overdueRes, membersRes, activitiesRes,
        popularRes, neverBorrowedRes, lowStockRes, neverBorrowedMembersRes,
        pendingUsersRes, settingsRes, chartsRes,
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
      }
      if (chartsRes.ok) setChartData(await chartsRes.json());
    } catch {
      // Data fetch failed
    }
  };

  const handleSchoolChange = async (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    localStorage.setItem('developer_selected_school', schoolId);
    setLoading(true);
    try {
      const token = await getToken();
      if (token) { await fetchAllData(token, schoolId); }
    } finally { setLoading(false); }
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

  if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'DEVELOPER' && userInfo.role !== 'TEACHER')) {
    return null;
  }

  const isTeacher = userInfo?.role === 'TEACHER';
  const allTabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: '📊', teacherVisible: false },
    { id: 'books' as TabType, label: 'Kitaplar', icon: '📚', teacherVisible: false },
    { id: 'categories' as TabType, label: 'Kategoriler', icon: '🏷️', teacherVisible: false },
    { id: 'members' as TabType, label: 'Üyeler', icon: '👥', teacherVisible: true },
    { id: 'passive-students' as TabType, label: 'Pasif Öğrenciler', icon: '👤', teacherVisible: true },
    { id: 'borrow-on-behalf' as TabType, label: 'Ödünç Ver', icon: '📖', teacherVisible: true },
    { id: 'approvals' as TabType, label: 'Onay Bekleyenler', icon: '⏳', badge: pendingUsers.length, teacherVisible: false },
    { id: 'overdue' as TabType, label: 'Gecikmeler', icon: '⏰', badge: overdueLoans.length, teacherVisible: true },
    { id: 'reports' as TabType, label: 'Raporlar', icon: '📈', teacherVisible: false },
    { id: 'activities' as TabType, label: 'Aktiviteler', icon: '🔔', teacherVisible: false },
    { id: 'settings' as TabType, label: 'Ayarlar', icon: '⚙️', teacherVisible: false },
  ];
  const tabs = isTeacher ? allTabs.filter(t => t.teacherVisible) : allTabs;

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
                  padding: `${spacing.sm} ${spacing.md}`, backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`, borderRadius: borderRadius.md,
                  color: colors.white, fontSize: '14px', minWidth: '250px', cursor: 'pointer',
                }}
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name} ({school.slug})</option>
                ))}
              </select>
              <Link href="/developer" style={{ marginLeft: 'auto' }}>
                <Button variant="secondary">← Developer Panel</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.xl, overflowX: 'auto', paddingBottom: spacing.sm, WebkitOverflowScrolling: 'touch' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: activeTab === tab.id ? colors.primary : colors.card,
                color: activeTab === tab.id ? colors.white : colors.gray,
                border: `1px solid ${activeTab === tab.id ? colors.primary : colors.border}`,
                borderRadius: borderRadius.md, cursor: 'pointer', fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 500, whiteSpace: 'nowrap',
                position: 'relative', transition: `all ${transitions.normal}`,
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '14px' }}>{tab.icon}</span>
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span style={{
                  backgroundColor: colors.error, color: 'white', fontSize: '10px',
                  padding: '1px 5px', borderRadius: borderRadius.full, fontWeight: 'bold',
                }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && stats && (
          <AdminDashboard stats={stats} chartData={chartData} activities={activities}
            pendingUsers={pendingUsers} overdueLoans={overdueLoans} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'books' && (
          <AdminBooks books={books} setBooks={setBooks} categories={categories}
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}

        {activeTab === 'categories' && (
          <AdminCategories categories={categories} setCategories={setCategories}
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}

        {activeTab === 'members' && (
          <AdminMembers members={members} setMembers={setMembers}
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}

        {activeTab === 'approvals' && (
          <AdminApprovals pendingUsers={pendingUsers} setPendingUsers={setPendingUsers}
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}

        {activeTab === 'overdue' && <AdminOverdue overdueLoans={overdueLoans} />}

        {activeTab === 'reports' && (
          <AdminReports popularBooks={popularBooks} neverBorrowed={neverBorrowed}
            lowStock={lowStock} neverBorrowedMembers={neverBorrowedMembers}
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}

        {activeTab === 'passive-students' && (
          <AdminPassiveStudents
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}

        {activeTab === 'borrow-on-behalf' && (
          <AdminBorrowOnBehalf
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}

        {activeTab === 'activities' && <AdminActivities activities={activities} />}

        {activeTab === 'settings' && (
          <AdminSettings schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings}
            userInfo={userInfo} selectedSchoolId={selectedSchoolId} getToken={getToken} />
        )}
      </main>

      <Footer />
    </div>
  );
}
