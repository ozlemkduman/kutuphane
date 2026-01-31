// Tarih formatlama utility'leri
// Türkçe locale ile tutarlı tarih formatları

/**
 * Tarihi "5 Ocak 2024" formatında gösterir
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Tarihi "5 Oca 2024" formatında gösterir (kısa)
 */
export function formatDateShort(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Tarihi "5 Oca, 14:30" formatında gösterir
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Tarihi "14:30" formatında gösterir
 */
export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Göreceli tarih gösterir: "2 gün önce", "3 saat önce" vb.
 */
export function formatRelative(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dakika önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay < 7) return `${diffDay} gün önce`;
  if (diffWeek < 4) return `${diffWeek} hafta önce`;
  if (diffMonth < 12) return `${diffMonth} ay önce`;

  return formatDateShort(date);
}

/**
 * Tarihin geçmiş olup olmadığını kontrol eder
 */
export function isOverdue(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date < new Date();
}

/**
 * İki tarih arasındaki gün farkını hesaplar
 */
export function getDaysRemaining(dateString: string | Date): number {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const diff = date.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Tarihi ISO formatına çevirir
 */
export function toISOString(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toISOString();
}

export default {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatTime,
  formatRelative,
  isOverdue,
  getDaysRemaining,
  toISOString,
};
