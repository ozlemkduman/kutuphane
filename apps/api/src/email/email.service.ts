// EmailService - E-posta gönderim servisi

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt } from '../utils/crypto.util';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SchoolEmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class EmailService {
  private defaultTransporter: nodemailer.Transporter | null = null;

  constructor(private prisma: PrismaService) {
    // Varsayılan SMTP ayarları (env'den)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.defaultTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  // Okul için transporter oluştur
  private async getTransporter(schoolId: string): Promise<nodemailer.Transporter | null> {
    try {
      const settings = await this.prisma.schoolSettings.findUnique({
        where: { schoolId },
      });

      if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass && settings?.emailEnabled) {
        // Şifrelenmiş SMTP şifresini çöz
        const decryptedPass = decrypt(settings.smtpPass);

        if (!decryptedPass) {
          console.error('SMTP şifresi çözülemedi');
          return this.defaultTransporter;
        }

        return nodemailer.createTransport({
          host: settings.smtpHost,
          port: settings.smtpPort || 587,
          secure: settings.smtpPort === 465,
          auth: {
            user: settings.smtpUser,
            pass: decryptedPass,
          },
        });
      }
    } catch (error) {
      console.error('Transporter oluşturma hatası:', error);
    }

    return this.defaultTransporter;
  }

  // E-posta gönder
  async sendEmail(schoolId: string, options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter(schoolId);

      if (!transporter) {
        console.log('E-posta transporter bulunamadı, e-posta gönderilmedi');
        return false;
      }

      const settings = await this.prisma.schoolSettings.findUnique({
        where: { schoolId },
      });

      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
      });

      const fromName = settings?.fromName || school?.name || 'Kütüphane Sistemi';
      const fromEmail = settings?.fromEmail || process.env.SMTP_FROM || 'noreply@kutuphane.com';

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return true;
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
      return false;
    }
  }

  // Gecikme hatırlatma e-postası
  async sendOverdueReminder(
    schoolId: string,
    to: string,
    userName: string,
    bookTitle: string,
    dueDate: Date,
    daysOverdue: number,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📚 Kütüphane Bildirimi</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Merhaba ${userName},</h2>
          <p style="color: #666; font-size: 16px;">
            Ödünç aldığınız <strong>"${bookTitle}"</strong> kitabının iade tarihi geçmiş bulunmaktadır.
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⏰ İade Tarihi:</strong> ${dueDate.toLocaleDateString('tr-TR')}<br>
              <strong>📅 Gecikme:</strong> ${daysOverdue} gün
            </p>
          </div>
          <p style="color: #666;">
            Lütfen kitabı en kısa sürede iade ediniz. Gecikmeler için ceza uygulanabilir.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Saygılarımızla,<br>
            Kütüphane Yönetimi
          </p>
        </div>
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Bu e-posta otomatik olarak gönderilmiştir.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(schoolId, {
      to,
      subject: `⏰ Gecikmiş Kitap Hatırlatması - ${bookTitle}`,
      html,
      text: `Merhaba ${userName}, "${bookTitle}" kitabının iade tarihi ${daysOverdue} gün geçmiştir. Lütfen en kısa sürede iade ediniz.`,
    });
  }

  // Rezervasyon hazır e-postası
  async sendReservationReady(
    schoolId: string,
    to: string,
    userName: string,
    bookTitle: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #15803d); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📚 Rezervasyonunuz Hazır!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Merhaba ${userName},</h2>
          <p style="color: #666; font-size: 16px;">
            Rezerve ettiğiniz <strong>"${bookTitle}"</strong> kitabı artık müsait durumda!
          </p>
          <div style="background: #d1fae5; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;">
              <strong>✅ Kitap hazır!</strong><br>
              <strong>📅 Son Teslim Alma:</strong> ${expiresAt.toLocaleDateString('tr-TR')}
            </p>
          </div>
          <p style="color: #666;">
            Lütfen belirtilen tarihe kadar kitabı kütüphaneden teslim alınız.
            Aksi halde rezervasyonunuz iptal edilecektir.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Saygılarımızla,<br>
            Kütüphane Yönetimi
          </p>
        </div>
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Bu e-posta otomatik olarak gönderilmiştir.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(schoolId, {
      to,
      subject: `✅ Rezervasyonunuz Hazır - ${bookTitle}`,
      html,
      text: `Merhaba ${userName}, "${bookTitle}" kitabı artık müsait. ${expiresAt.toLocaleDateString('tr-TR')} tarihine kadar teslim alabilirsiniz.`,
    });
  }

  // İade yaklaşıyor hatırlatması
  async sendDueSoonReminder(
    schoolId: string,
    to: string,
    userName: string,
    bookTitle: string,
    dueDate: Date,
    daysLeft: number,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📚 İade Tarihi Yaklaşıyor</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Merhaba ${userName},</h2>
          <p style="color: #666; font-size: 16px;">
            Ödünç aldığınız <strong>"${bookTitle}"</strong> kitabının iade tarihi yaklaşıyor.
          </p>
          <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              <strong>📅 İade Tarihi:</strong> ${dueDate.toLocaleDateString('tr-TR')}<br>
              <strong>⏳ Kalan Süre:</strong> ${daysLeft} gün
            </p>
          </div>
          <p style="color: #666;">
            Kitabı zamanında iade etmeyi unutmayın. İsterseniz süreyi uzatabilirsiniz.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Saygılarımızla,<br>
            Kütüphane Yönetimi
          </p>
        </div>
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Bu e-posta otomatik olarak gönderilmiştir.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(schoolId, {
      to,
      subject: `📅 İade Tarihi Yaklaşıyor - ${bookTitle}`,
      html,
      text: `Merhaba ${userName}, "${bookTitle}" kitabının iade tarihi ${daysLeft} gün sonra. İade tarihi: ${dueDate.toLocaleDateString('tr-TR')}`,
    });
  }

  // Ceza bildirimi
  async sendFineNotice(
    schoolId: string,
    to: string,
    userName: string,
    bookTitle: string,
    fineAmount: number,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">💰 Ceza Bildirimi</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Merhaba ${userName},</h2>
          <p style="color: #666; font-size: 16px;">
            <strong>"${bookTitle}"</strong> kitabının geç iadesi nedeniyle ceza uygulanmıştır.
          </p>
          <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 18px;">
              <strong>💰 Ceza Tutarı:</strong> ${fineAmount.toFixed(2)} ₺
            </p>
          </div>
          <p style="color: #666;">
            Cezanızı kütüphane yönetimine ödeyebilirsiniz.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Saygılarımızla,<br>
            Kütüphane Yönetimi
          </p>
        </div>
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            Bu e-posta otomatik olarak gönderilmiştir.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(schoolId, {
      to,
      subject: `💰 Gecikme Cezası Bildirimi - ${fineAmount.toFixed(2)} ₺`,
      html,
      text: `Merhaba ${userName}, "${bookTitle}" kitabı için ${fineAmount.toFixed(2)} ₺ gecikme cezası uygulanmıştır.`,
    });
  }

  // E-posta bağlantısını test et
  async testConnection(schoolId: string): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = await this.getTransporter(schoolId);

      if (!transporter) {
        return { success: false, message: 'E-posta ayarları yapılandırılmamış' };
      }

      await transporter.verify();
      return { success: true, message: 'E-posta bağlantısı başarılı' };
    } catch (error: any) {
      return { success: false, message: `Bağlantı hatası: ${error.message}` };
    }
  }
}
