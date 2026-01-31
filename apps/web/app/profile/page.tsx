// Profil sayfası
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
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, borderRadius, spacing, shadows } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';

interface Loan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  renewCount: number;
  fineAmount: number;
  finePaid: boolean;
  book: {
    id: string;
    title: string;
    author: string;
  };
}

interface Reservation {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  status: 'WAITING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  book: {
    id: string;
    title: string;
    author: string;
    coverImage: string | null;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

type TabType = 'loans' | 'reservations' | 'notifications';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);
  const { user, profile, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Auth yüklenene kadar bekle, giriş yapılmamışsa login'e yönlendir
  // Developer'ları developer paneline yönlendir
  // Okulu olmayan kullanıcıları okul seçimine yönlendir
  // Onay bekleyen kullanıcıları pending-approval sayfasına yönlendir
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role === 'DEVELOPER') {
        router.push('/developer');
      } else if (profile?.role === 'MEMBER' && !profile?.schoolId) {
        router.push('/onboarding/select-school');
      } else if (profile?.role === 'MEMBER' && profile?.status === 'PENDING') {
        router.push('/pending-approval');
      } else if (profile?.role === 'MEMBER' && profile?.status === 'REJECTED') {
        router.push('/pending-approval');
      } else {
        fetchAllData();
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchLoans(), fetchReservations(), fetchNotifications()]);
    setLoading(false);
  };

  const fetchLoans = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch {
      // Loans fetch failed
    }
  };

  const fetchReservations = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setReservations(await res.json());
      }
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {
      // ignore
    }
  };

  const handleReturn = async (loanId: string) => {
    setReturning(loanId);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${loanId}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fineAmount > 0) {
          toast.warning(`Kitap iade edildi. Gecikme cezası: ${data.fineAmount.toFixed(2)} TL`);
        } else {
          toast.success('Kitap başarıyla iade edildi!');
        }
        fetchLoans();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Bir hata oluştu');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setReturning(null);
    }
  };

  const handleRenew = async (loanId: string) => {
    setRenewing(loanId);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/${loanId}/renew`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Süre uzatıldı!');
        fetchLoans();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Süre uzatılamadı');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setRenewing(null);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Rezervasyon iptal edildi');
        fetchReservations();
      } else {
        toast.error('İptal edilemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch {
      // ignore
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysRemaining = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main id="main-content" role="main" aria-label="Profilim" style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: spacing['2xl'] }}>
            <Skeleton variant="text" width="200px" height="36px" style={{ marginBottom: spacing.sm }} />
            <Skeleton variant="text" width="250px" height="20px" />
          </div>

          {/* Stats Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg, marginBottom: spacing['2xl'] }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} style={{ padding: spacing.lg, textAlign: 'center' }}>
                <Skeleton variant="text" width="60px" height="32px" style={{ margin: '0 auto', marginBottom: spacing.sm }} />
                <Skeleton variant="text" width="80px" height="16px" style={{ margin: '0 auto' }} />
              </Card>
            ))}
          </div>

          {/* Loans Skeleton */}
          <Skeleton variant="text" width="180px" height="28px" style={{ marginBottom: spacing.lg }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} style={{ padding: spacing.lg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Skeleton variant="text" width="200px" height="20px" style={{ marginBottom: spacing.sm }} />
                    <Skeleton variant="text" width="150px" height="16px" />
                  </div>
                  <Skeleton variant="rounded" width="100px" height="40px" />
                </div>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || profile?.role === 'DEVELOPER') {
    return null;
  }

  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const pastLoans = loans.filter(l => l.status === 'RETURNED');
  const overdueLoans = activeLoans.filter(l => isOverdue(l.dueDate));
  const activeReservations = reservations.filter(r => r.status === 'WAITING' || r.status === 'READY');
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const tabs = [
    { id: 'loans' as TabType, label: 'Ödünçlerim', count: activeLoans.length },
    { id: 'reservations' as TabType, label: 'Rezervasyonlarım', count: activeReservations.length },
    { id: 'notifications' as TabType, label: 'Bildirimler', count: unreadNotifications.length },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main id="main-content" role="main" aria-label="Profilim" style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ marginBottom: spacing['2xl'] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: colors.white,
              fontWeight: 700,
            }}>
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.white, margin: 0 }}>
                {profile?.name || 'Kullanıcı'}
              </h1>
              <p style={{ color: colors.gray, margin: 0, marginTop: spacing.xs }}>
                {profile?.email}
              </p>
            </div>
            <Badge variant={profile?.role === 'ADMIN' ? 'admin' : 'member'} style={{ marginLeft: 'auto' }}>
              {profile?.role === 'ADMIN' ? 'Yönetici' : 'Üye'}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: spacing.lg, marginBottom: spacing['2xl'] }}>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 700, color: colors.primary, margin: 0 }}>{activeLoans.length}</p>
            <p style={{ color: colors.gray, fontSize: '14px', margin: 0, marginTop: spacing.xs }}>Aktif Ödünç</p>
          </Card>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 700, color: overdueLoans.length > 0 ? colors.error : colors.success, margin: 0 }}>{overdueLoans.length}</p>
            <p style={{ color: colors.gray, fontSize: '14px', margin: 0, marginTop: spacing.xs }}>Gecikmiş</p>
          </Card>
          <Card style={{ padding: spacing.lg, textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 700, color: colors.info, margin: 0 }}>{pastLoans.length}</p>
            <p style={{ color: colors.gray, fontSize: '14px', margin: 0, marginTop: spacing.xs }}>Toplam İade</p>
          </Card>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl, borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.md }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
                border: 'none',
                borderRadius: borderRadius.md,
                color: activeTab === tab.id ? colors.white : colors.gray,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : colors.bgLight,
                  padding: `2px ${spacing.sm}`,
                  borderRadius: borderRadius.full,
                  fontSize: '12px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overdue Alert */}
        {activeTab === 'loans' && overdueLoans.length > 0 && (
          <Alert variant="error" style={{ marginBottom: spacing.xl }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <strong>{overdueLoans.length} kitabınızın iade süresi geçti!</strong>
                <p style={{ margin: 0, marginTop: spacing.xs, opacity: 0.9 }}>
                  Lütfen gecikmiş kitaplarınızı en kısa sürede iade edin.
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <>
        {/* Active Loans */}
        <div style={{ marginBottom: spacing['3xl'] }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: colors.white, marginBottom: spacing.lg }}>
            📚 Ödünç Aldıklarım ({activeLoans.length}/3)
          </h2>

          {activeLoans.length === 0 ? (
            <Card style={{ padding: spacing['2xl'], textAlign: 'center' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: spacing.md }}>📖</span>
              <p style={{ color: colors.gray, fontSize: '16px', margin: 0, marginBottom: spacing.lg }}>
                Henüz ödünç aldığınız kitap yok.
              </p>
              <Link href="/books">
                <Button>Kitaplara Göz At</Button>
              </Link>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {activeLoans.map((loan) => {
                const overdue = isOverdue(loan.dueDate);
                const daysRemaining = getDaysRemaining(loan.dueDate);

                return (
                  <Card key={loan.id} style={{ padding: spacing.lg, borderColor: overdue ? colors.error : colors.border }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: colors.white, margin: 0, marginBottom: spacing.xs }}>
                          {loan.book.title}
                        </h3>
                        <p style={{ color: colors.primaryLight, fontSize: '14px', margin: 0, marginBottom: spacing.md }}>
                          {loan.book.author}
                        </p>
                        <div style={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Alınma tarihi</p>
                            <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>{formatDate(loan.borrowedAt)}</p>
                          </div>
                          <div>
                            <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>İade tarihi</p>
                            <p style={{ color: overdue ? colors.error : colors.warning, fontSize: '14px', fontWeight: 600, margin: 0 }}>
                              {formatDate(loan.dueDate)}
                              {overdue ? (
                                <span style={{ marginLeft: spacing.sm }}>({Math.abs(daysRemaining)} gün gecikmiş)</span>
                              ) : (
                                <span style={{ marginLeft: spacing.sm }}>({daysRemaining} gün kaldı)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
                        {!overdue && loan.renewCount < 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRenew(loan.id)}
                            disabled={renewing === loan.id}
                          >
                            {renewing === loan.id ? 'Uzatılıyor...' : `Süre Uzat (${2 - loan.renewCount} hak)`}
                          </Button>
                        )}
                        <Button
                          variant={overdue ? 'danger' : 'primary'}
                          onClick={() => handleReturn(loan.id)}
                          disabled={returning === loan.id}
                        >
                          {returning === loan.id ? 'İade ediliyor...' : 'İade Et'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Loans */}
        {pastLoans.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: colors.white, marginBottom: spacing.lg }}>
              📋 Geçmiş ({pastLoans.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {pastLoans.map((loan) => (
                <Card key={loan.id} style={{ padding: spacing.md, opacity: 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
                    <div>
                      <span style={{ color: colors.white, fontWeight: 500 }}>{loan.book.title}</span>
                      <span style={{ color: colors.gray }}> - {loan.book.author}</span>
                      {loan.fineAmount > 0 && (
                        <Badge variant={loan.finePaid ? 'success' : 'danger'} size="sm" style={{ marginLeft: spacing.sm }}>
                          Ceza: {loan.fineAmount.toFixed(2)} TL {loan.finePaid ? '(Ödendi)' : ''}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="success" size="sm">
                      İade: {formatDate(loan.returnedAt!)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
          </>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: colors.white, marginBottom: spacing.lg }}>
              📖 Rezervasyonlarım
            </h2>

            {reservations.length === 0 ? (
              <Card style={{ padding: spacing['2xl'], textAlign: 'center' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: spacing.md }}>📚</span>
                <p style={{ color: colors.gray, fontSize: '16px', margin: 0, marginBottom: spacing.lg }}>
                  Henüz rezervasyonunuz yok.
                </p>
                <Link href="/books">
                  <Button>Kitaplara Göz At</Button>
                </Link>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {reservations.map((reservation) => (
                  <Card key={reservation.id} style={{ padding: spacing.lg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: colors.white, margin: 0, marginBottom: spacing.xs }}>
                          {reservation.book.title}
                        </h3>
                        <p style={{ color: colors.primaryLight, fontSize: '14px', margin: 0, marginBottom: spacing.sm }}>
                          {reservation.book.author}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                          <Badge
                            variant={
                              reservation.status === 'READY' ? 'success' :
                              reservation.status === 'WAITING' ? 'warning' :
                              reservation.status === 'COMPLETED' ? 'info' : 'danger'
                            }
                          >
                            {reservation.status === 'READY' ? '✓ Hazır - Alabilirsiniz!' :
                             reservation.status === 'WAITING' ? '⏳ Sırada Bekleniyor' :
                             reservation.status === 'COMPLETED' ? 'Tamamlandı' :
                             reservation.status === 'CANCELLED' ? 'İptal Edildi' : 'Süresi Doldu'}
                          </Badge>
                          {reservation.expiresAt && reservation.status === 'READY' && (
                            <span style={{ color: colors.gray, fontSize: '12px' }}>
                              Son tarih: {formatDate(reservation.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      {(reservation.status === 'WAITING' || reservation.status === 'READY') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelReservation(reservation.id)}
                        >
                          İptal Et
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: colors.white, margin: 0 }}>
                🔔 Bildirimler
              </h2>
              {unreadNotifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
                  Tümünü Okundu İşaretle
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <Card style={{ padding: spacing['2xl'], textAlign: 'center' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: spacing.md }}>🔕</span>
                <p style={{ color: colors.gray, fontSize: '16px', margin: 0 }}>
                  Henüz bildiriminiz yok.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    style={{
                      padding: spacing.lg,
                      opacity: notification.isRead ? 0.7 : 1,
                      borderLeft: notification.isRead ? 'none' : `3px solid ${colors.primary}`,
                      cursor: notification.isRead ? 'default' : 'pointer',
                    }}
                    onClick={() => !notification.isRead && markNotificationRead(notification.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                          <span style={{ fontSize: '16px' }}>
                            {notification.type === 'RESERVATION_READY' ? '📚' :
                             notification.type === 'OVERDUE_WARNING' || notification.type === 'OVERDUE_REMINDER' ? '⚠️' :
                             notification.type === 'LOAN_DUE_SOON' ? '⏰' :
                             notification.type === 'FINE_NOTICE' ? '💰' : '📢'}
                          </span>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, color: colors.white, margin: 0 }}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Badge variant="primary" size="sm">Yeni</Badge>
                          )}
                        </div>
                        <p style={{ color: colors.gray, fontSize: '14px', margin: 0 }}>
                          {notification.message}
                        </p>
                      </div>
                      <span style={{ color: colors.darkGray, fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
