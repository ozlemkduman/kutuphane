'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { formatDate, getHeaders, getJsonHeaders } from './utils';
import { Member, MemberDetail, UserInfo } from './types';

interface AdminMembersProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

export function AdminMembers({ members, setMembers, userInfo, selectedSchoolId, getToken }: AdminMembersProps) {
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const toast = useToast();

  const fetchMemberDetail = async (memberId: string) => {
    setMemberDetailLoading(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${memberId}/detail`, { headers });
      if (res.ok) { setMemberDetail(await res.json()); }
      else { const error = await res.json(); toast.error(error.message || 'Üye bilgileri yüklenemedi'); }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setMemberDetailLoading(false); }
  };

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/members/${memberId}/role`, {
        method: 'PUT', headers, body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
        toast.success('Rol değiştirildi');
      } else { const error = await res.json(); toast.error(error.message || 'Rol değiştirilemedi'); }
    } catch { toast.error('Bir hata oluştu'); }
  };

  return (
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
                    <Badge variant={member.role === 'ADMIN' ? 'admin' : 'member'}>{member.role === 'ADMIN' ? '👑 Admin' : '👤 Üye'}</Badge>
                  </td>
                  <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.white }}>{member.totalLoans}</td>
                  <td style={{ padding: spacing.lg, textAlign: 'center' }}><Badge variant="warning">{member.activeLoans}</Badge></td>
                  <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                    <Badge variant={member.overdueLoans > 0 ? 'danger' : 'success'}>{member.overdueLoans}</Badge>
                  </td>
                  <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontSize: '12px' }}>{formatDate(member.createdAt)}</td>
                  <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                      <Button size="sm" variant="outline" onClick={() => fetchMemberDetail(member.id)}>📋 Detay</Button>
                      {member.id !== userInfo?.id && (
                        <Button size="sm" variant={member.role === 'ADMIN' ? 'ghost' : 'secondary'}
                          onClick={() => handleRoleChange(member.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}>
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

      {/* Member Detail Modal */}
      {(memberDetail || memberDetailLoading) && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: spacing.lg }}
          onClick={() => setMemberDetail(null)}>
          <Card style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: spacing.xl }}
            onClick={(e) => e.stopPropagation()}>
            {memberDetailLoading ? (
              <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
                <div style={{ width: '48px', height: '48px', border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: colors.gray, marginTop: spacing.lg }}>Yükleniyor...</p>
              </div>
            ) : memberDetail && (
              <>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: spacing.md, marginBottom: spacing.xl }}>
                  {[
                    { value: memberDetail.stats.totalLoans, label: 'Toplam Ödünç', color: colors.primary },
                    { value: memberDetail.stats.activeLoans, label: 'Aktif', color: colors.warning },
                    { value: memberDetail.stats.overdueLoans, label: 'Gecikmiş', color: colors.error },
                    { value: memberDetail.stats.returnedLoans, label: 'İade Edilmiş', color: colors.success },
                  ].map((stat, i) => (
                    <div key={i} style={{ backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, textAlign: 'center' }}>
                      <p style={{ color: stat.color, fontSize: '24px', fontWeight: 700, margin: 0 }}>{stat.value}</p>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{stat.label}</p>
                    </div>
                  ))}
                  {memberDetail.stats.unpaidFines > 0 && (
                    <div style={{ backgroundColor: `${colors.error}20`, padding: spacing.md, borderRadius: borderRadius.md, textAlign: 'center' }}>
                      <p style={{ color: colors.error, fontSize: '24px', fontWeight: 700, margin: 0 }}>{memberDetail.stats.unpaidFines.toFixed(2)}₺</p>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Ödenmemiş Ceza</p>
                    </div>
                  )}
                </div>

                {memberDetail.activeLoans.length > 0 && (
                  <div style={{ marginBottom: spacing.xl }}>
                    <h3 style={{ color: colors.white, fontSize: '16px', marginBottom: spacing.md }}>📚 Aktif Ödünçler ({memberDetail.activeLoans.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                      {memberDetail.activeLoans.map((loan) => {
                        const isOverdue = new Date(loan.dueDate) < new Date();
                        return (
                          <div key={loan.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: isOverdue ? `${colors.error}15` : colors.bg,
                            padding: spacing.md, borderRadius: borderRadius.md,
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
                              <td style={{ padding: spacing.sm, color: colors.white }}>{loan.book.title}</td>
                              <td style={{ padding: spacing.sm, textAlign: 'center', color: colors.gray }}>
                                {new Date(loan.borrowedAt).toLocaleDateString('tr-TR')}
                              </td>
                              <td style={{ padding: spacing.sm, textAlign: 'center', color: colors.gray }}>
                                {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString('tr-TR') : '-'}
                              </td>
                              <td style={{ padding: spacing.sm, textAlign: 'center' }}>
                                <Badge variant={loan.status === 'RETURNED' ? 'success' : loan.status === 'OVERDUE' ? 'danger' : 'warning'}>
                                  {loan.status === 'RETURNED' ? 'İade' : loan.status === 'OVERDUE' ? 'Gecikmiş' : 'Aktif'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
