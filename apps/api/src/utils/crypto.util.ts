// Crypto Utility - Hassas verileri şifrelemek için
// SMTP şifreleri gibi bilgileri güvenli saklamak için kullanılır

import * as crypto from 'crypto';

// Şifreleme algoritması ve anahtar uzunluğu
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Şifreleme anahtarı - environment variable'dan alınmalı
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // Development için varsayılan anahtar (production'da mutlaka değiştirilmeli)
    console.warn('UYARI: ENCRYPTION_KEY ayarlanmamış, varsayılan anahtar kullanılıyor!');
    return crypto.scryptSync('default-dev-key-change-in-production', 'salt', KEY_LENGTH);
  }

  // Key'i hash'leyerek sabit uzunlukta anahtar elde et
  return crypto.scryptSync(key, 'kitaphane-salt', KEY_LENGTH);
}

/**
 * Metni şifrele
 * @param text Şifrelenecek metin
 * @returns Şifrelenmiş metin (base64 formatında)
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // IV + AuthTag + EncryptedData formatında birleştir
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]);

  return combined.toString('base64');
}

/**
 * Şifreli metni çöz
 * @param encryptedText Şifrelenmiş metin (base64 formatında)
 * @returns Çözülmüş metin
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedText, 'base64');

    // IV, AuthTag ve EncryptedData'yı ayır
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Şifre çözme hatası:', error);
    return '';
  }
}

/**
 * Metnin şifrelenmiş olup olmadığını kontrol et
 * @param text Kontrol edilecek metin
 * @returns Şifrelenmiş mi?
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;

  try {
    const decoded = Buffer.from(text, 'base64');
    // Minimum uzunluk kontrolü (IV + AuthTag + en az 1 byte veri)
    return decoded.length > IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}
