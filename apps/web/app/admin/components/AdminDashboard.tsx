'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { formatDateTime } from './utils';
import { DashboardStats, Activity, PendingUser, OverdueLoan, ChartData, TabType } from './types';

interface AdminDashboardProps {
  stats: DashboardStats;
  chartData: ChartData | null;
  activities: Activity[];
  pendingUsers: PendingUser[];
  overdueLoans: OverdueLoan[];
  setActiveTab: (tab: TabType) => void;
}

export function AdminDashboard({ stats, chartData, activities, pendingUsers, overdueLoans, setActiveTab }: AdminDashboardProps) {
  return (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: spacing.sm }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: spacing.sm }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: spacing.xl, marginBottom: spacing.xl }}>
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
  );
}
