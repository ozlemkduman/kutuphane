'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { colors, spacing } from '@/lib/theme';
import { getJsonHeaders } from './utils';
import { SchoolSettings, UserInfo } from './types';

interface AdminSettingsProps {
  schoolSettings: SchoolSettings | null;
  setSchoolSettings: (settings: SchoolSettings) => void;
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

export function AdminSettings({ schoolSettings, setSchoolSettings, userInfo, selectedSchoolId, getToken }: AdminSettingsProps) {
  const [form, setForm] = useState({
    loanDays: schoolSettings?.loanDays ?? 14,
    maxLoans: schoolSettings?.maxLoans ?? 3,
    maxRenewals: schoolSettings?.maxRenewals ?? 2,
    finePerDay: schoolSettings?.finePerDay ?? 1.0,
    maxFine: schoolSettings?.maxFine ?? 50.0,
    reservationDays: schoolSettings?.reservationDays ?? 3,
    maxReservations: schoolSettings?.maxReservations ?? 2,
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my/settings`, {
        method: 'PUT', headers, body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setSchoolSettings(updated);
        toast.success('Ayarlar kaydedildi');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Ayarlar kaydedilemedi');
      }
    } catch { toast.error('Bir hata oluştu'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>⚙️ Kütüphane Ayarları</h2>
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: spacing.xl }}>
          {/* Ödünç Alma Ayarları */}
          <Card>
            <Card.Header><Card.Title>📚 Ödünç Alma Ayarları</Card.Title></Card.Header>
            <Card.Content>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <div>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Ödünç Süresi (Gün)</label>
                  <Input type="number" value={form.loanDays.toString()} onChange={(e) => setForm({ ...form, loanDays: parseInt(e.target.value) || 14 })} min={1} max={90} />
                  <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>Kitapların varsayılan ödünç alma süresi</p>
                </div>
                <div>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Maksimum Ödünç Kitap Sayısı</label>
                  <Input type="number" value={form.maxLoans.toString()} onChange={(e) => setForm({ ...form, maxLoans: parseInt(e.target.value) || 3 })} min={1} max={20} />
                  <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>Bir üyenin aynı anda ödünç alabileceği kitap sayısı</p>
                </div>
                <div>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Maksimum Yenileme Sayısı</label>
                  <Input type="number" value={form.maxRenewals.toString()} onChange={(e) => setForm({ ...form, maxRenewals: parseInt(e.target.value) || 2 })} min={0} max={10} />
                  <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>Bir kitabın kaç kez yenilenebileceği</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Ceza Ayarları */}
          <Card>
            <Card.Header><Card.Title>💰 Ceza Ayarları</Card.Title></Card.Header>
            <Card.Content>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <div>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Günlük Ceza Miktarı (₺)</label>
                  <Input type="number" step="0.50" value={form.finePerDay.toString()} onChange={(e) => setForm({ ...form, finePerDay: parseFloat(e.target.value) || 1 })} min={0} max={100} />
                  <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>Her geciken gün için uygulanacak ceza</p>
                </div>
                <div>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Maksimum Ceza Miktarı (₺)</label>
                  <Input type="number" step="1" value={form.maxFine.toString()} onChange={(e) => setForm({ ...form, maxFine: parseFloat(e.target.value) || 50 })} min={0} max={1000} />
                  <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>Bir kitap için uygulanabilecek maksimum ceza</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Rezervasyon Ayarları */}
          <Card>
            <Card.Header><Card.Title>📅 Rezervasyon Ayarları</Card.Title></Card.Header>
            <Card.Content>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <div>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Rezervasyon Bekleme Süresi (Gün)</label>
                  <Input type="number" value={form.reservationDays.toString()} onChange={(e) => setForm({ ...form, reservationDays: parseInt(e.target.value) || 3 })} min={1} max={14} />
                  <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>Kitap müsait olduğunda üyenin teslim alması gereken süre</p>
                </div>
                <div>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Maksimum Aktif Rezervasyon</label>
                  <Input type="number" value={form.maxReservations.toString()} onChange={(e) => setForm({ ...form, maxReservations: parseInt(e.target.value) || 2 })} min={0} max={10} />
                  <p style={{ color: colors.gray, fontSize: '12px', marginTop: spacing.xs }}>Bir üyenin yapabileceği maksimum rezervasyon sayısı</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        <div style={{ marginTop: spacing.xl, display: 'flex', gap: spacing.md }}>
          <Button type="submit" disabled={saving}>{saving ? '⏳ Kaydediliyor...' : '💾 Ayarları Kaydet'}</Button>
          {schoolSettings && (
            <Button type="button" variant="outline" onClick={() => setForm({
              loanDays: schoolSettings.loanDays, maxLoans: schoolSettings.maxLoans, maxRenewals: schoolSettings.maxRenewals,
              finePerDay: schoolSettings.finePerDay, maxFine: schoolSettings.maxFine,
              reservationDays: schoolSettings.reservationDays, maxReservations: schoolSettings.maxReservations,
            })}>
              ↩️ Değişiklikleri Geri Al
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
