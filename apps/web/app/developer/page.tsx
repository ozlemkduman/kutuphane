// Developer Paneli - Okul Yönetimi
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { colors, borderRadius, shadows, spacing, transitions } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

// Developer panel specific purple theme
const devColors = {
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  accent: '#5b21b6',
};

interface School {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    books: number;
    loans: number;
  };
}

interface SchoolAdmin {
  id: string;
  name: string;
  email: string;
  isMainAdmin: boolean;
  createdAt: string;
}

type TabType = 'schools' | 'create';

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<TabType>('schools');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolAdmins, setSchoolAdmins] = useState<SchoolAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const { user, loading: authLoading, getToken } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Auth yüklenene kadar bekle
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    checkDeveloperAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const checkDeveloperAndFetch = async () => {
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

      const userData = await userRes.json();

      if (userData.role !== 'DEVELOPER') {
        setLoading(false);
        router.replace('/books');
        return;
      }

      setUserInfo(userData);
      await fetchSchools(token);
    } catch {
      router.replace('/books');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      }
    } catch {
      // Schools fetch failed
    }
  };

  const fetchSchoolAdmins = async (schoolId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${schoolId}/admins`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchoolAdmins(data);
      }
    } catch {
      // Admins fetch failed
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = await getToken();
      const url = editingSchool
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/schools/${editingSchool.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/schools`;

      const res = await fetch(url, {
        method: editingSchool ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (token) {
          await fetchSchools(token);
        }
        resetForm();
        setActiveTab('schools');
        toast.success(editingSchool ? 'Okul güncellendi' : 'Okul oluşturuldu');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Bir hata oluştu');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setSchools(schools.filter((s) => s.id !== deleteConfirm.id));
        setSelectedSchool(null);
        toast.success('Okul silindi');
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

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      slug: school.slug,
      logo: school.logo || '',
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
    });
    setActiveTab('create');
  };

  const handleAssignAdmin = async () => {
    if (!selectedSchool || !adminEmail) return;

    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${selectedSchool.id}/assign-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: adminEmail, isMainAdmin: true }),
      });

      if (res.ok) {
        await fetchSchoolAdmins(selectedSchool.id);
        await fetchSchools(token!);
        setShowAdminModal(false);
        setAdminEmail('');
        toast.success('Admin başarıyla atandı!');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Admin atanamadı');
      }
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const resetForm = () => {
    setEditingSchool(null);
    setFormData({ name: '', slug: '', logo: '', address: '', phone: '', email: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const generateSlug = (name: string) => {
    return name
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

  // Loading veya yetki kontrolü - tam ekran loading göster
  if (authLoading || loading || !userInfo || userInfo.role !== 'DEVELOPER') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Navbar />
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: spacing.lg
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${colors.border}`,
            borderTopColor: devColors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ color: devColors.primaryLight, fontSize: '16px' }}>
            {authLoading || loading ? 'Yükleniyor...' : 'Yönlendiriliyor...'}
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'schools' as TabType, label: 'Okullar', icon: '🏫' },
    { id: 'create' as TabType, label: editingSchool ? 'Okul Düzenle' : 'Yeni Okul', icon: '➕' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '1400px', margin: '0 auto', padding: spacing.xl, width: '100%', boxSizing: 'border-box' }}>
        {/* Developer Mode Banner */}
        <Card style={{ marginBottom: spacing.xl, padding: spacing.lg, background: `linear-gradient(135deg, ${devColors.primary}20, ${devColors.accent}20)`, borderColor: devColors.primary }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            <span style={{ fontSize: '32px' }}>🔧</span>
            <div>
              <h1 style={{ color: colors.white, fontSize: '24px', margin: 0, marginBottom: spacing.xs }}>Developer Panel</h1>
              <p style={{ color: colors.gray, margin: 0, fontSize: '14px' }}>Okul yönetimi ve sistem ayarları</p>
            </div>
            <Badge variant="developer" style={{ marginLeft: 'auto' }}>DEVELOPER</Badge>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'create' && !editingSchool) resetForm(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.md} ${spacing.lg}`,
                backgroundColor: activeTab === tab.id ? devColors.primary : colors.card,
                color: activeTab === tab.id ? colors.white : colors.gray,
                border: `1px solid ${activeTab === tab.id ? devColors.primary : colors.border}`,
                borderRadius: borderRadius.lg,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                transition: `all ${transitions.normal}`,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Schools Tab */}
        {activeTab === 'schools' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
              <h2 style={{ color: colors.white, fontSize: '24px', margin: 0 }}>🏫 Okul Yönetimi</h2>
              <div style={{ color: colors.gray, fontSize: '14px' }}>
                Toplam: <span style={{ color: devColors.primaryLight, fontWeight: 600 }}>{schools.length}</span> okul
              </div>
            </div>

            {/* Schools Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: spacing.xl }}>
              {schools.map((school) => (
                <Card
                  key={school.id}
                  hoverable
                  style={{
                    padding: spacing.xl,
                    cursor: 'pointer',
                    borderColor: selectedSchool?.id === school.id ? devColors.primary : colors.border,
                  }}
                  onClick={() => {
                    setSelectedSchool(school);
                    fetchSchoolAdmins(school.id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }}>
                    <div>
                      <h3 style={{ color: colors.white, fontSize: '18px', margin: 0, marginBottom: spacing.xs }}>{school.name}</h3>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>/{school.slug}</p>
                    </div>
                    <Badge variant={school.isActive ? 'success' : 'danger'}>
                      {school.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.md, marginBottom: spacing.lg }}>
                    <div style={{ textAlign: 'center', padding: spacing.md, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                      <p style={{ color: colors.info, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{school._count.users}</p>
                      <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>Üye</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: spacing.md, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                      <p style={{ color: colors.primary, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{school._count.books}</p>
                      <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>Kitap</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: spacing.md, backgroundColor: colors.bg, borderRadius: borderRadius.md }}>
                      <p style={{ color: colors.success, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{school._count.loans}</p>
                      <p style={{ color: colors.gray, fontSize: '11px', margin: 0 }}>Ödünç</p>
                    </div>
                  </div>

                  {school.email && <p style={{ color: colors.gray, fontSize: '12px', margin: 0, marginBottom: spacing.xs }}>📧 {school.email}</p>}
                  {school.phone && <p style={{ color: colors.gray, fontSize: '12px', margin: 0, marginBottom: spacing.xs }}>📞 {school.phone}</p>}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginTop: spacing.lg }}>
                    <Link
                      href={`/admin?schoolId=${school.id}`}
                      style={{ textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button style={{ width: '100%', background: `linear-gradient(135deg, ${colors.success}, #10b981)` }}>
                        🔧 Sisteme Gir
                      </Button>
                    </Link>
                    <div style={{ display: 'flex', gap: spacing.sm }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        style={{ flex: 1, backgroundColor: devColors.primary }}
                        onClick={(e) => { e.stopPropagation(); handleEdit(school); }}
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        style={{ flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedSchool(school); setShowAdminModal(true); }}
                      >
                        Admin Ata
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: school.id, name: school.name }); }}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {schools.length === 0 && (
              <Card style={{ padding: spacing['3xl'], textAlign: 'center' }}>
                <span style={{ fontSize: '48px' }}>🏫</span>
                <p style={{ color: colors.gray, fontSize: '16px', marginTop: spacing.lg }}>Henüz okul eklenmemiş</p>
                <Button
                  style={{ marginTop: spacing.lg, backgroundColor: devColors.primary }}
                  onClick={() => setActiveTab('create')}
                >
                  İlk Okulu Ekle
                </Button>
              </Card>
            )}

            {/* School Detail Panel */}
            {selectedSchool && schoolAdmins.length > 0 && (
              <Card style={{ marginTop: spacing.xl, padding: spacing.xl }}>
                <h3 style={{ color: colors.white, fontSize: '18px', marginBottom: spacing.lg, marginTop: 0 }}>👑 {selectedSchool.name} - Adminler</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {schoolAdmins.map((admin) => (
                    <div key={admin.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: colors.bg,
                      borderRadius: borderRadius.md,
                    }}>
                      <span style={{ fontSize: '24px' }}>{admin.isMainAdmin ? '👑' : '👤'}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: colors.white, fontWeight: 600, margin: 0 }}>{admin.name}</p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{admin.email}</p>
                      </div>
                      {admin.isMainAdmin && (
                        <Badge variant="warning">Ana Admin</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Create/Edit School Tab */}
        {activeTab === 'create' && (
          <div>
            <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>
              {editingSchool ? '✏️ Okul Düzenle' : '➕ Yeni Okul Ekle'}
            </h2>

            <Card style={{ padding: spacing.xl, maxWidth: '600px' }}>
              <form onSubmit={handleSubmit}>
                <Input
                  label="Okul Adı *"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: editingSchool ? formData.slug : generateSlug(e.target.value),
                    });
                  }}
                  required
                  placeholder="Örnek: Atatürk İlkokulu"
                  style={{ marginBottom: spacing.lg }}
                />

                <Input
                  label="Slug (URL) *"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="ataturk-ilkokulu"
                  helperText="Kullanıcılar bu slug ile kayıt olacak"
                  style={{ marginBottom: spacing.lg }}
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@okul.edu.tr"
                  style={{ marginBottom: spacing.lg }}
                />

                <Input
                  label="Telefon"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0312 xxx xx xx"
                  style={{ marginBottom: spacing.lg }}
                />

                <div style={{ marginBottom: spacing.lg }}>
                  <label style={{ display: 'block', color: colors.gray, marginBottom: spacing.sm, fontSize: '14px' }}>Adres</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    placeholder="Okul adresi"
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

                <div style={{ display: 'flex', gap: spacing.md }}>
                  <Button
                    type="submit"
                    disabled={saving}
                    style={{ backgroundColor: devColors.primary }}
                  >
                    {saving ? 'Kaydediliyor...' : (editingSchool ? 'Güncelle' : 'Okul Oluştur')}
                  </Button>
                  {editingSchool && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { resetForm(); setActiveTab('schools'); }}
                    >
                      İptal
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Admin Assignment Modal */}
        <Modal
          isOpen={showAdminModal}
          onClose={() => { setShowAdminModal(false); setAdminEmail(''); }}
          title={`👑 ${selectedSchool?.name} - Admin Ata`}
        >
          <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.lg }}>
            Kullanıcının email adresini girerek admin atayabilirsiniz
          </p>
          <Input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="ornek@email.com"
            style={{ marginBottom: spacing.lg }}
          />
          <div style={{ display: 'flex', gap: spacing.md }}>
            <Button
              onClick={handleAssignAdmin}
              disabled={!adminEmail}
              style={{ flex: 1, backgroundColor: devColors.primary }}
            >
              Ana Admin Ata
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setShowAdminModal(false); setAdminEmail(''); }}
              style={{ flex: 1 }}
            >
              İptal
            </Button>
          </div>
        </Modal>
      </main>

      <Footer />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Okulu Sil"
        message={`"${deleteConfirm?.name}" okulunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />
    </div>
  );
}
