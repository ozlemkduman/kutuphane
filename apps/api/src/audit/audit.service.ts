// AuditService - Hassas işlemleri loglar
// Güvenlik ve izlenebilirlik için önemli

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export enum AuditAction {
  // Auth işlemleri
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  SCHOOL_SELECT = 'SCHOOL_SELECT',

  // Okul işlemleri
  SCHOOL_CREATE = 'SCHOOL_CREATE',
  SCHOOL_UPDATE = 'SCHOOL_UPDATE',
  SCHOOL_DELETE = 'SCHOOL_DELETE',
  ADMIN_ASSIGN = 'ADMIN_ASSIGN',

  // Kullanıcı işlemleri
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  ROLE_CHANGE = 'ROLE_CHANGE',

  // Kitap işlemleri
  BOOK_CREATE = 'BOOK_CREATE',
  BOOK_UPDATE = 'BOOK_UPDATE',
  BOOK_DELETE = 'BOOK_DELETE',

  // Ödünç işlemleri
  LOAN_CREATE = 'LOAN_CREATE',
  LOAN_RETURN = 'LOAN_RETURN',

  // Güvenlik olayları
  AUTH_FAILED = 'AUTH_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface AuditLogEntry {
  timestamp: Date;
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  schoolId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private logFilePath: string;

  constructor(private prisma: PrismaService) {
    // Log dosyası yolu
    this.logFilePath = path.join(process.cwd(), 'logs', 'audit.log');
    this.ensureLogDirectory();
  }

  // Log klasörünün var olduğundan emin ol
  private ensureLogDirectory() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Audit log kaydı oluştur
  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Dosyaya yaz
    await this.writeToFile(fullEntry);

    // Production'da veritabanına da yazılabilir
    // await this.writeToDatabase(fullEntry);
  }

  // Başarılı işlem logu
  async logSuccess(
    action: AuditAction,
    options: {
      userId?: string;
      userEmail?: string;
      schoolId?: string;
      resourceType?: string;
      resourceId?: string;
      details?: Record<string, any>;
      ip?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    await this.log({
      action,
      ...options,
      success: true,
    });
  }

  // Başarısız işlem logu
  async logFailure(
    action: AuditAction,
    errorMessage: string,
    options: {
      userId?: string;
      userEmail?: string;
      schoolId?: string;
      resourceType?: string;
      resourceId?: string;
      details?: Record<string, any>;
      ip?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    await this.log({
      action,
      ...options,
      success: false,
      errorMessage,
    });
  }

  // Dosyaya yaz
  private async writeToFile(entry: AuditLogEntry): Promise<void> {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFilePath, line, 'utf8');
    } catch {
      // Log yazımı başarısız olursa uygulama çökmemeli
    }
  }

  // Son audit loglarını getir (admin paneli için)
  async getRecentLogs(
    limit: number = 100,
    filters?: {
      action?: AuditAction;
      userId?: string;
      schoolId?: string;
      success?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<AuditLogEntry[]> {
    try {
      // Dosyadan oku
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);

      // Parse et ve filtrele
      let logs: AuditLogEntry[] = lines
        .map((line) => {
          try {
            return JSON.parse(line) as AuditLogEntry;
          } catch {
            return null;
          }
        })
        .filter((log): log is AuditLogEntry => log !== null);

      // Filtreleri uygula
      if (filters) {
        if (filters.action) {
          logs = logs.filter((log) => log.action === filters.action);
        }
        if (filters.userId) {
          logs = logs.filter((log) => log.userId === filters.userId);
        }
        if (filters.schoolId) {
          logs = logs.filter((log) => log.schoolId === filters.schoolId);
        }
        if (filters.success !== undefined) {
          logs = logs.filter((log) => log.success === filters.success);
        }
        if (filters.startDate) {
          logs = logs.filter(
            (log) => new Date(log.timestamp) >= filters.startDate!,
          );
        }
        if (filters.endDate) {
          logs = logs.filter(
            (log) => new Date(log.timestamp) <= filters.endDate!,
          );
        }
      }

      // Ters sıralama (en son log en üstte) ve limit uygula
      return logs.reverse().slice(0, limit);
    } catch {
      return [];
    }
  }
}
