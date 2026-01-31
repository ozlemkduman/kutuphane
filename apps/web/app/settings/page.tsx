// Kullanıcı Ayarları Sayfası - Şifre Değiştirme, Profil Düzenleme ve 2FA
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { colors, spacing } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

export default function SettingsPage() {
  // Şifre değiştirme
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Profil düzenleme
  const [editName, setEditName] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // 2FA (İki Faktörlü Doğrulama)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASuccess, setTwoFASuccess] = useState('');
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [twoFAStep, setTwoFAStep] = useState<'phone' | 'verify'>('phone');

  const { user, profile, loading: authLoading, getToken, refreshProfile } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Profil bilgilerini forma yükle
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditClassName(profile.className || '');
      setEditSection(profile.section || '');
    }
  }, [profile]);

  // Auth yönlendirmeleri - sadece giriş yapmamış kullanıcıları login'e yönlendir
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // 2FA durumunu kontrol et
  useEffect(() => {
    const checkTwoFA = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const mfaUser = multiFactor(currentUser);
        setTwoFAEnabled(mfaUser.enrolledFactors.length > 0);
      }
    };
    checkTwoFA();
  }, [user]);

  // RecaptchaVerifier'ı temizle
  const cleanupRecaptcha = useCallback(() => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  }, []);

  // 2FA kurulumunu başlat
  const handleStartTwoFASetup = async () => {
    setTwoFAError('');
    setShowTwoFASetup(true);
    setTwoFAStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
  };

  // Telefon numarasına doğrulama kodu gönder
  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      setTwoFAError('Telefon numarası girin');
      return;
    }

    // Türkiye formatına çevir
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+90' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+90' + formattedPhone;
    }

    setTwoFALoading(true);
    setTwoFAError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Oturum bulunamadı');

      // RecaptchaVerifier oluştur
      cleanupRecaptcha();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA çözüldü
        },
        'expired-callback': () => {
          setTwoFAError('reCAPTCHA süresi doldu, tekrar deneyin');
          cleanupRecaptcha();
        },
      });

      await window.recaptchaVerifier.render();

      // MFA session al
      const mfaSession = await multiFactor(currentUser).getSession();

      // Telefon doğrulama başlat
      const phoneInfoOptions = {
        phoneNumber: formattedPhone,
        session: mfaSession,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, window.recaptchaVerifier);

      setVerificationId(verId);
      setTwoFAStep('verify');
      toast.success('Doğrulama kodu gönderildi');
    } catch (err: any) {
      console.error('2FA setup error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setTwoFAError('Geçersiz telefon numarası');
      } else if (err.code === 'auth/too-many-requests') {
        setTwoFAError('Çok fazla deneme yaptınız, daha sonra tekrar deneyin');
      } else if (err.code === 'auth/requires-recent-login') {
        setTwoFAError('Bu işlem için yeniden giriş yapmanız gerekiyor');
      } else {
        setTwoFAError(err.message || '2FA kurulumu başarısız');
      }
      cleanupRecaptcha();
    } finally {
      setTwoFALoading(false);
    }
  };

  // Doğrulama kodunu onayla ve 2FA'yı etkinleştir
  const handleVerifyAndEnableTwoFA = async () => {
    if (!verificationCode.trim()) {
      setTwoFAError('Doğrulama kodunu girin');
      return;
    }

    setTwoFALoading(true);
    setTwoFAError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Oturum bulunamadı');

      // Credential oluştur
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // 2FA'yı etkinleştir
      await multiFactor(currentUser).enroll(multiFactorAssertion, 'Telefon');

      setTwoFAEnabled(true);
      setShowTwoFASetup(false);
      setTwoFASuccess('İki faktörlü doğrulama başarıyla etkinleştirildi');
      toast.success('2FA etkinleştirildi');
      cleanupRecaptcha();
    } catch (err: any) {
      console.error('2FA verify error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setTwoFAError('Geçersiz doğrulama kodu');
      } else {
        setTwoFAError(err.message || 'Doğrulama başarısız');
      }
    } finally {
      setTwoFALoading(false);
    }
  };

  // 2FA'yı devre dışı bırak
  const handleDisableTwoFA = async () => {
    if (!confirm('İki faktörlü doğrulamayı devre dışı bırakmak istediğinizden emin misiniz?')) {
      return;
    }

    setTwoFALoading(true);
    setTwoFAError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Oturum bulunamadı');

      const mfaUser = multiFactor(currentUser);
      if (mfaUser.enrolledFactors.length > 0) {
        // İlk faktörü kaldır
        await mfaUser.unenroll(mfaUser.enrolledFactors[0]);
      }

      setTwoFAEnabled(false);
      setTwoFASuccess('İki faktörlü doğrulama devre dışı bırakıldı');
      toast.success('2FA devre dışı bırakıldı');
    } catch (err: any) {
      console.error('2FA disable error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setTwoFAError('Bu işlem için yeniden giriş yapmanız gerekiyor');
      } else {
        setTwoFAError(err.message || '2FA devre dışı bırakılamadı');
      }
    } finally {
      setTwoFALoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Şifre en az 6 karakter olmalı';
    }
    if (!/\d/.test(password)) {
      return 'Şifre en az bir rakam içermeli';
    }
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validasyonlar
    if (!currentPassword) {
      setPasswordError('Mevcut şifrenizi girin');
      return;
    }

    if (!newPassword) {
      setPasswordError('Yeni şifrenizi girin');
      return;
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('Yeni şifre mevcut şifreden farklı olmalı');
      return;
    }

    setPasswordLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('Oturum bulunamadı');
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      setPasswordSuccess('Şifreniz başarıyla güncellendi');
      toast.success('Şifre başarıyla değiştirildi');

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);

      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Mevcut şifre yanlış');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('Yeni şifre çok zayıf');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Bu işlem için yeniden giriş yapmanız gerekiyor');
      } else {
        setPasswordError(err.message || 'Bir hata oluştu');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editName.trim()) {
      setProfileError('Ad soyad boş olamaz');
      return;
    }

    setProfileLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          className: editClassName.trim() || null,
          section: editSection.trim() || null,
        }),
      });

      if (res.ok) {
        setProfileSuccess('Profil başarıyla güncellendi');
        toast.success('Profil güncellendi');
        // Profil bilgilerini yenile
        if (refreshProfile) {
          await refreshProfile();
        }
      } else {
        const error = await res.json();
        setProfileError(error.message || 'Güncelleme başarısız');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Bir hata oluştu');
    } finally {
      setProfileLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: colors.gray }}>Yükleniyor...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '600px', margin: '0 auto', padding: `${spacing['2xl']} ${spacing.lg}`, width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.white, marginBottom: spacing.xl }}>
          Ayarlar
        </h1>

        {/* Profil Düzenleme */}
        <Card style={{ padding: spacing.xl }}>
          <Card.Header>
            <Card.Title>👤 Profil Bilgileri</Card.Title>
          </Card.Header>
          <Card.Content>
            {profileError && (
              <Alert variant="error" style={{ marginBottom: spacing.lg }}>
                {profileError}
              </Alert>
            )}

            {profileSuccess && (
              <Alert variant="success" style={{ marginBottom: spacing.lg }}>
                {profileSuccess}
              </Alert>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <div>
                  <label style={{ color: colors.gray, fontSize: '13px', display: 'block', marginBottom: spacing.xs }}>
                    E-posta (değiştirilemez)
                  </label>
                  <p style={{ color: colors.white, margin: 0, padding: spacing.md, backgroundColor: colors.bgLight, borderRadius: '8px' }}>
                    {user.email}
                  </p>
                </div>

                <Input
                  label="Ad Soyad"
                  placeholder="Adınızı ve soyadınızı girin"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={profileLoading}
                />

                {profile?.studentNumber && (
                  <div>
                    <label style={{ color: colors.gray, fontSize: '13px', display: 'block', marginBottom: spacing.xs }}>
                      Öğrenci No (değiştirilemez)
                    </label>
                    <p style={{ color: colors.white, margin: 0, padding: spacing.md, backgroundColor: colors.bgLight, borderRadius: '8px' }}>
                      {profile.studentNumber}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                  <Input
                    label="Sınıf"
                    placeholder="Örn: 9, 10, 11"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    disabled={profileLoading}
                  />
                  <Input
                    label="Şube"
                    placeholder="Örn: A, B, C"
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    disabled={profileLoading}
                  />
                </div>

                <Button type="submit" disabled={profileLoading} style={{ marginTop: spacing.md }}>
                  {profileLoading ? 'Güncelleniyor...' : 'Profili Güncelle'}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>

        {/* Şifre Değiştirme */}
        <Card style={{ padding: spacing.xl, marginTop: spacing.xl }}>
          <Card.Header>
            <Card.Title>🔐 Şifre Değiştir</Card.Title>
          </Card.Header>
          <Card.Content>
            {passwordError && (
              <Alert variant="error" style={{ marginBottom: spacing.lg }}>
                {passwordError}
              </Alert>
            )}

            {passwordSuccess && (
              <Alert variant="success" style={{ marginBottom: spacing.lg }}>
                {passwordSuccess}
              </Alert>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <Input
                  type="password"
                  label="Mevcut Şifre"
                  placeholder="Mevcut şifrenizi girin"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                />

                <Input
                  type="password"
                  label="Yeni Şifre"
                  placeholder="Yeni şifrenizi girin"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  helperText="En az 6 karakter ve bir rakam içermeli"
                />

                <Input
                  type="password"
                  label="Yeni Şifre (Tekrar)"
                  placeholder="Yeni şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                />

                <Button type="submit" disabled={passwordLoading} style={{ marginTop: spacing.md }}>
                  {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>

        {/* İki Faktörlü Doğrulama (2FA) */}
        <Card style={{ padding: spacing.xl, marginTop: spacing.xl }}>
          <Card.Header>
            <Card.Title>🛡️ İki Faktörlü Doğrulama (2FA)</Card.Title>
          </Card.Header>
          <Card.Content>
            <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.lg }}>
              İki faktörlü doğrulama, hesabınıza ekstra bir güvenlik katmanı ekler.
              Giriş yaparken şifrenize ek olarak telefonunuza gelen kodu girmeniz gerekir.
            </p>

            {twoFAError && (
              <Alert variant="error" style={{ marginBottom: spacing.lg }}>
                {twoFAError}
              </Alert>
            )}

            {twoFASuccess && (
              <Alert variant="success" style={{ marginBottom: spacing.lg }}>
                {twoFASuccess}
              </Alert>
            )}

            {/* 2FA Durumu */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.lg,
              backgroundColor: colors.bgLight,
              borderRadius: '8px',
              marginBottom: spacing.lg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <span style={{ fontSize: '24px' }}>{twoFAEnabled ? '✅' : '⚠️'}</span>
                <div>
                  <p style={{ color: colors.white, fontWeight: 600, margin: 0 }}>
                    {twoFAEnabled ? '2FA Aktif' : '2FA Devre Dışı'}
                  </p>
                  <p style={{ color: colors.gray, fontSize: '13px', margin: 0 }}>
                    {twoFAEnabled
                      ? 'Hesabınız telefon doğrulaması ile korunuyor'
                      : 'Hesabınızı daha güvenli hale getirin'}
                  </p>
                </div>
              </div>
              {!showTwoFASetup && (
                <Button
                  variant={twoFAEnabled ? 'secondary' : 'primary'}
                  onClick={twoFAEnabled ? handleDisableTwoFA : handleStartTwoFASetup}
                  disabled={twoFALoading}
                  size="sm"
                >
                  {twoFALoading ? 'İşleniyor...' : (twoFAEnabled ? 'Devre Dışı Bırak' : 'Etkinleştir')}
                </Button>
              )}
            </div>

            {/* 2FA Kurulum Formu */}
            {showTwoFASetup && (
              <div style={{
                padding: spacing.lg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
              }}>
                {twoFAStep === 'phone' && (
                  <>
                    <h4 style={{ color: colors.white, marginBottom: spacing.md }}>
                      Telefon Numaranızı Girin
                    </h4>
                    <Input
                      label="Telefon Numarası"
                      placeholder="05XX XXX XX XX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={twoFALoading}
                      helperText="Türkiye için +90 otomatik eklenir"
                    />

                    {/* reCAPTCHA container */}
                    <div id="recaptcha-container" style={{ marginTop: spacing.md, marginBottom: spacing.md }}></div>

                    <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowTwoFASetup(false);
                          cleanupRecaptcha();
                        }}
                        disabled={twoFALoading}
                      >
                        İptal
                      </Button>
                      <Button
                        onClick={handleSendVerificationCode}
                        disabled={twoFALoading || !phoneNumber.trim()}
                      >
                        {twoFALoading ? 'Gönderiliyor...' : 'Kod Gönder'}
                      </Button>
                    </div>
                  </>
                )}

                {twoFAStep === 'verify' && (
                  <>
                    <h4 style={{ color: colors.white, marginBottom: spacing.md }}>
                      Doğrulama Kodunu Girin
                    </h4>
                    <p style={{ color: colors.gray, fontSize: '14px', marginBottom: spacing.lg }}>
                      {phoneNumber} numarasına gönderilen 6 haneli kodu girin.
                    </p>
                    <Input
                      label="Doğrulama Kodu"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={twoFALoading}
                      maxLength={6}
                    />
                    <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setTwoFAStep('phone');
                          setVerificationCode('');
                          cleanupRecaptcha();
                        }}
                        disabled={twoFALoading}
                      >
                        Geri
                      </Button>
                      <Button
                        onClick={handleVerifyAndEnableTwoFA}
                        disabled={twoFALoading || verificationCode.length !== 6}
                      >
                        {twoFALoading ? 'Doğrulanıyor...' : '2FA Etkinleştir'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card.Content>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
