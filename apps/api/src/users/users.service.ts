// UsersService - Kullanıcı işlemleri

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// CSV Import Limitleri
const CSV_MAX_ROWS = 1000;
const CSV_MAX_SIZE = 1024 * 1024; // 1MB
const MAX_FIELD_LENGTH = 100;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // XSS koruması
  private sanitizeString(str: string | undefined): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .slice(0, MAX_FIELD_LENGTH)
      .trim();
  }

  // Yeni kullanıcı oluştur
  async create(data: {
    firebaseUid: string;
    email: string;
    name: string;
    schoolId: string;
    role: 'MEMBER' | 'TEACHER';
    className: string | null;
    section: string | null;
    studentNumber: string | null;
  }) {
    return this.prisma.user.create({
      data: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        name: data.name,
        role: data.role,
        status: 'PENDING',
        schoolId: data.schoolId,
        className: data.className,
        section: data.section,
        studentNumber: data.studentNumber,
      },
      include: { school: true },
    });
  }

  // Firebase UID ile kullanıcı bul
  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { school: true },
    });
  }

  // Pasif öğrenci oluştur
  async createPassiveStudent(data: {
    name: string;
    className: string;
    section: string;
    studentNumber: string;
  }, schoolId: string, createdById: string) {
    // Aynı okulda aynı öğrenci numarası var mı kontrol et (REJECTED hariç)
    const existing = await this.prisma.user.findFirst({
      where: {
        schoolId,
        studentNumber: data.studentNumber,
        status: { not: 'REJECTED' },
      },
    });
    if (existing) {
      throw new BadRequestException('Bu okul numarası zaten kayıtlı');
    }

    return this.prisma.user.create({
      data: {
        name: data.name,
        className: data.className,
        section: data.section,
        studentNumber: data.studentNumber,
        firebaseUid: null,
        email: null,
        role: 'MEMBER',
        status: 'PASSIVE',
        schoolId,
        createdById,
      },
    });
  }

  // Pasif öğrencileri listele (aktif ödünç sayısı ile)
  async findPassiveStudents(schoolId: string) {
    const students = await this.prisma.user.findMany({
      where: { schoolId, status: 'PASSIVE' },
      orderBy: [{ className: 'asc' }, { section: 'asc' }, { name: 'asc' }],
      include: {
        loans: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    });

    return students.map((s) => ({
      id: s.id,
      name: s.name,
      className: s.className,
      section: s.section,
      studentNumber: s.studentNumber,
      activeLoans: s.loans.length,
      createdAt: s.createdAt,
    }));
  }

  // Pasif öğrenci güncelle
  async updatePassiveStudent(id: string, schoolId: string, data: {
    name?: string;
    className?: string;
    section?: string;
    studentNumber?: string;
  }) {
    const student = await this.prisma.user.findUnique({ where: { id } });
    if (!student || student.schoolId !== schoolId || student.status !== 'PASSIVE') {
      throw new BadRequestException('Pasif öğrenci bulunamadı');
    }

    // Öğrenci numarası değişiyorsa benzersizlik kontrolü
    if (data.studentNumber && data.studentNumber !== student.studentNumber) {
      const existing = await this.prisma.user.findFirst({
        where: {
          schoolId,
          studentNumber: data.studentNumber,
          status: { not: 'REJECTED' },
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException('Bu okul numarası zaten kayıtlı');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // Pasif öğrenci sil
  async deletePassiveStudent(id: string, schoolId: string) {
    const student = await this.prisma.user.findUnique({ where: { id } });
    if (!student || student.schoolId !== schoolId || student.status !== 'PASSIVE') {
      throw new BadRequestException('Pasif öğrenci bulunamadı');
    }

    // Aktif ödünç var mı kontrol et
    const activeLoans = await this.prisma.loan.count({
      where: { userId: id, status: 'ACTIVE' },
    });
    if (activeLoans > 0) {
      throw new BadRequestException('Bu öğrencinin aktif ödünçleri var, silinemez');
    }

    return this.prisma.user.delete({ where: { id } });
  }

  // CSV parse et (öğrenci importu için)
  parseStudentCSV(csvContent: string): Array<{
    name: string;
    className: string;
    section: string;
    studentNumber: string;
  }> {
    if (csvContent.length > CSV_MAX_SIZE) {
      throw new BadRequestException(`CSV dosyası çok büyük. Maksimum ${CSV_MAX_SIZE / 1024}KB`);
    }

    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV dosyası en az bir başlık satırı ve bir veri satırı içermelidir');
    }

    if (lines.length > CSV_MAX_ROWS + 1) {
      throw new BadRequestException(`CSV dosyası çok fazla satır içeriyor. Maksimum ${CSV_MAX_ROWS} öğrenci`);
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = headers.findIndex(h => h === 'name' || h === 'ad' || h === 'ad soyad' || h === 'isim');
    const classIndex = headers.findIndex(h => h === 'class' || h === 'sınıf' || h === 'sinif');
    const sectionIndex = headers.findIndex(h => h === 'section' || h === 'şube' || h === 'sube');
    const numberIndex = headers.findIndex(h => h === 'number' || h === 'numara' || h === 'no' || h === 'okul numarası' || h === 'okul numarasi');

    if (nameIndex === -1 || classIndex === -1 || sectionIndex === -1 || numberIndex === -1) {
      throw new BadRequestException('CSV dosyasında "ad/name", "sınıf/class", "şube/section" ve "numara/number" sütunları zorunludur');
    }

    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const name = this.sanitizeString(values[nameIndex]);
      const className = this.sanitizeString(values[classIndex]);
      const section = this.sanitizeString(values[sectionIndex])?.toUpperCase();
      const studentNumber = values[numberIndex]?.trim();

      if (!name || !className || !section || !studentNumber) {
        continue;
      }

      // Öğrenci numarası sadece rakam olmalı
      if (!/^[0-9]+$/.test(studentNumber)) {
        continue;
      }

      students.push({ name, className, section, studentNumber });
    }

    return students;
  }

  // Toplu pasif öğrenci oluştur
  async bulkCreatePassiveStudents(
    schoolId: string,
    students: Array<{ name: string; className: string; section: string; studentNumber: string }>,
    createdById: string,
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Mevcut öğrenci numaralarını kontrol et
    const numbers = students.map(s => s.studentNumber);
    const existingStudents = await this.prisma.user.findMany({
      where: {
        schoolId,
        studentNumber: { in: numbers },
        status: { not: 'REJECTED' },
      },
      select: { studentNumber: true },
    });
    const existingNumbers = new Set(existingStudents.map(s => s.studentNumber));

    const validStudents: Array<{
      name: string;
      className: string;
      section: string;
      studentNumber: string;
      firebaseUid: null;
      email: null;
      role: 'MEMBER';
      status: 'PASSIVE';
      schoolId: string;
      createdById: string;
    }> = [];

    for (const student of students) {
      if (existingNumbers.has(student.studentNumber)) {
        results.failed++;
        results.errors.push(`Numara zaten kayıtlı: ${student.studentNumber} (${student.name})`);
        continue;
      }

      validStudents.push({
        name: student.name,
        className: student.className,
        section: student.section,
        studentNumber: student.studentNumber,
        firebaseUid: null,
        email: null,
        role: 'MEMBER',
        status: 'PASSIVE',
        schoolId,
        createdById,
      });
    }

    if (validStudents.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const student of validStudents) {
            await tx.user.create({ data: student });
            results.success++;
          }
        }, { timeout: 30000 });
      } catch (error: any) {
        results.success = 0;
        results.failed += validStudents.length;
        results.errors.push(`Transaction hatası: ${error.message}`);
      }
    }

    return results;
  }

  // CSV satırını parse et (tırnak içindeki virgülleri koruyarak)
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}
