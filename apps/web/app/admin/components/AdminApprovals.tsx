'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { colors, spacing } from '@/lib/theme';
import { formatDate, getHeaders, getJsonHeaders } from './utils';
import { PendingUser, UserInfo } from './types';

interface AdminApprovalsProps {
  pendingUsers: PendingUser[];
  setPendingUsers: (users: PendingUser[]) => void;
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

export function AdminApprovals({ pendingUsers, setPendingUsers, userInfo, selectedSchoolId, getToken }: AdminApprovalsProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const toast = useToast();

  const handleApprove = async (userId: string) => {
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatasi'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/approve`, { method: 'POST', headers });
      if (res.ok) { setPendingUsers(pendingUsers.filter(u => u.id !== userId)); toast.success('Kullanici onaylandi'); }
      else { const error = await res.json(); toast.error(error.message || 'Onaylama basarisiz'); }
    } catch { toast.error('Bir hata olustu'); }
  };

  const handleReject = async (userId: string) => {
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatasi'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/reject`, { method: 'POST', headers });
      if (res.ok) { setPendingUsers(pendingUsers.filter(u => u.id !== userId)); toast.success('Kullanici reddedildi'); }
      else { const error = await res.json(); toast.error(error.message || 'Reddetme basarisiz'); }
    } catch { toast.error('Bir hata olustu'); }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) return;
    setBulkProcessing(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/bulk-approve`, {
        method: 'POST', headers, body: JSON.stringify({ userIds: selectedUsers }),
      });
      if (res.ok) {
        const result = await res.json();
        setPendingUsers(pendingUsers.filter((u) => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
        toast.success(`${result.success} kullanıcı onaylandı${result.failed > 0 ? `, ${result.failed} onaylanamadı` : ''}`);
      } else { const error = await res.json(); toast.error(error.message || 'Toplu onay başarısız'); }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setBulkProcessing(false); }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.length === 0) return;
    setBulkProcessing(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/bulk-reject`, {
        method: 'POST', headers, body: JSON.stringify({ userIds: selectedUsers }),
      });
      if (res.ok) {
        const result = await res.json();
        setPendingUsers(pendingUsers.filter((u) => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
        toast.success(`${result.success} kullanıcı reddedildi${result.failed > 0 ? `, ${result.failed} reddedilemedi` : ''}`);
      } else { const error = await res.json(); toast.error(error.message || 'Toplu red başarısız'); }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setBulkProcessing(false); }
  };

  return (
    <div>
      <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>Onay Bekleyen Ogrenciler</h2>
      {pendingUsers.length === 0 ? (
        <Card style={{ padding: spacing['3xl'], textAlign: 'center' }}>
          <span style={{ fontSize: '48px' }}>✓</span>
          <p style={{ color: colors.success, fontSize: '18px', marginTop: spacing.lg }}>Onay bekleyen kimse yok!</p>
        </Card>
      ) : (
        <>
          {selectedUsers.length > 0 && (
            <Card style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.primary + '15', borderColor: colors.primary }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
                <span style={{ color: colors.white, fontWeight: 500 }}>{selectedUsers.length} öğrenci seçildi</span>
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])}>Seçimi Kaldır</Button>
                  <Button size="sm" style={{ backgroundColor: colors.success }} onClick={handleBulkApprove} disabled={bulkProcessing}>
                    {bulkProcessing ? '⏳ İşleniyor...' : `✓ Tümünü Onayla (${selectedUsers.length})`}
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleBulkReject} disabled={bulkProcessing}>
                    {bulkProcessing ? '⏳ İşleniyor...' : `✗ Tümünü Reddet (${selectedUsers.length})`}
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
                      <input type="checkbox" checked={selectedUsers.length === pendingUsers.length && pendingUsers.length > 0}
                        onChange={(e) => { if (e.target.checked) { setSelectedUsers(pendingUsers.map((u) => u.id)); } else { setSelectedUsers([]); } }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }} aria-label="Tümünü seç" />
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
                    <tr key={user.id} style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: selectedUsers.includes(user.id) ? colors.primary + '10' : 'transparent' }}>
                      <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedUsers.includes(user.id)}
                          onChange={(e) => { if (e.target.checked) { setSelectedUsers([...selectedUsers, user.id]); } else { setSelectedUsers(selectedUsers.filter((id) => id !== user.id)); } }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: colors.primary }} aria-label={`${user.name} seç`} />
                      </td>
                      <td style={{ padding: spacing.lg }}>
                        <p style={{ color: colors.white, fontWeight: 600, fontSize: '14px', margin: 0 }}>{user.name}</p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{user.email}</p>
                      </td>
                      <td style={{ padding: spacing.lg, textAlign: 'center' }}>
                        <Badge variant="warning">{user.className}-{user.section}</Badge>
                      </td>
                      <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.white, fontWeight: 600 }}>{user.studentNumber || '-'}</td>
                      <td style={{ padding: spacing.lg, textAlign: 'center', color: colors.gray, fontSize: '12px' }}>{formatDate(user.createdAt)}</td>
                      <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                          <Button size="sm" style={{ backgroundColor: colors.success }} onClick={() => handleApprove(user.id)}>Onayla</Button>
                          <Button size="sm" variant="danger" onClick={() => handleReject(user.id)}>Reddet</Button>
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
  );
}
