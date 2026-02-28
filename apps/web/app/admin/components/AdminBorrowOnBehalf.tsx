'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { getHeaders, getJsonHeaders } from './utils';
import { SchoolStudent, Book, UserInfo } from './types';

interface AdminBorrowOnBehalfProps {
  userInfo: UserInfo | null;
  selectedSchoolId: string | null;
  getToken: () => Promise<string | null>;
}

interface StudentLoan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  status: string;
  book: { id: string; title: string; author: string };
}

export function AdminBorrowOnBehalf({ userInfo, selectedSchoolId, getToken }: AdminBorrowOnBehalfProps) {
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SchoolStudent | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [studentLoans, setStudentLoans] = useState<StudentLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [returning, setReturning] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const [studentsRes, booksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/school-students`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books`, { headers }),
      ]);
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (booksRes.ok) setBooks(await booksRes.json());
    } catch {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentLoans = async (studentId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = getHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${studentId}/detail`, { headers });
      if (res.ok) {
        const detail = await res.json();
        setStudentLoans(detail.activeLoans || []);
      }
    } catch {
      // Silent fail
    }
  };

  const handleSelectStudent = (student: SchoolStudent) => {
    setSelectedStudent(student);
    setStudentSearch('');
    fetchStudentLoans(student.id);
  };

  const handleBorrow = async (bookId: string) => {
    if (!selectedStudent) return;
    setBorrowing(true);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/on-behalf/${bookId}`, {
        method: 'POST', headers, body: JSON.stringify({ userId: selectedStudent.id }),
      });
      if (res.ok) {
        toast.success('Kitap ödünç verildi');
        await fetchStudentLoans(selectedStudent.id);
        // Refresh books for updated availability
        const booksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books`, {
          headers: getHeaders(token, selectedSchoolId, userInfo?.role),
        });
        if (booksRes.ok) setBooks(await booksRes.json());
      } else {
        const error = await res.json();
        toast.error(error.message || 'Ödünç verilemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setBorrowing(false);
    }
  };

  const handleReturn = async (loanId: string) => {
    setReturning(loanId);
    try {
      const token = await getToken();
      if (!token) { toast.error('Oturum hatası'); return; }
      const headers = getJsonHeaders(token, selectedSchoolId, userInfo?.role);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loans/on-behalf/${loanId}/return`, {
        method: 'POST', headers,
      });
      if (res.ok) {
        toast.success('Kitap iade edildi');
        if (selectedStudent) await fetchStudentLoans(selectedStudent.id);
        // Refresh books
        const booksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books`, {
          headers: getHeaders(token, selectedSchoolId, userInfo?.role),
        });
        if (booksRes.ok) setBooks(await booksRes.json());
      } else {
        const error = await res.json();
        toast.error(error.message || 'İade edilemedi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setReturning(null);
    }
  };

  // Filter students (show all when no search)
  const filteredStudents = studentSearch.trim()
    ? students.filter(s => {
        const search = studentSearch.toLowerCase();
        return s.name.toLowerCase().includes(search) ||
          s.studentNumber?.includes(search) ||
          s.className?.toLowerCase().includes(search);
      })
    : students;

  // Filter books
  const filteredBooks = bookSearch.trim()
    ? books.filter(b => {
        const search = bookSearch.toLowerCase();
        return b.title.toLowerCase().includes(search) ||
          b.author.toLowerCase().includes(search) ||
          b.isbn?.toLowerCase().includes(search);
      }).slice(0, 20)
    : [];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
        <p style={{ color: colors.gray }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>Öğrenci Adına Ödünç Ver</h2>

      {/* Step 1: Student Selection */}
      <Card style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
        <h3 style={{ color: colors.white, marginTop: 0, marginBottom: spacing.lg }}>1. Öğrenci Seç</h3>

        {selectedStudent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, padding: spacing.lg, borderRadius: borderRadius.md, flexWrap: 'wrap', gap: spacing.md }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <span style={{ color: colors.white, fontWeight: 600, fontSize: '16px' }}>{selectedStudent.name}</span>
                <Badge variant={selectedStudent.status === 'PASSIVE' ? 'warning' : 'success'}>
                  {selectedStudent.status === 'PASSIVE' ? 'Pasif' : 'Aktif'}
                </Badge>
              </div>
              <p style={{ color: colors.gray, fontSize: '13px', margin: `${spacing.xs} 0 0` }}>
                {selectedStudent.className}-{selectedStudent.section} | No: {selectedStudent.studentNumber}
              </p>
            </div>
            <Button variant="ghost" onClick={() => { setSelectedStudent(null); setStudentLoans([]); }}>Değiştir</Button>
          </div>
        ) : (
          <div>
            <Input
              label=""
              type="text"
              placeholder="Öğrenci adı, numarası veya sınıfı ile filtrele..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            <div style={{
              backgroundColor: colors.card, border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md, maxHeight: '300px', overflowY: 'auto',
              marginTop: spacing.sm,
            }}>
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  style={{
                    width: '100%', padding: spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: 'none', borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: 'transparent', color: colors.white, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{student.name}</span>
                    <span style={{ color: colors.gray, fontSize: '13px', marginLeft: spacing.sm }}>
                      {student.className}-{student.section} | No: {student.studentNumber}
                    </span>
                  </div>
                  <Badge variant={student.status === 'PASSIVE' ? 'warning' : 'success'} style={{ fontSize: '10px' }}>
                    {student.status === 'PASSIVE' ? 'Pasif' : 'Aktif'}
                  </Badge>
                </button>
              )) : (
                <p style={{ color: colors.gray, fontSize: '13px', padding: spacing.md, margin: 0 }}>Öğrenci bulunamadı</p>
              )}
            </div>
          </div>
        )}
      </Card>

      {selectedStudent && (
        <>
          {/* Student's Active Loans */}
          {studentLoans.length > 0 && (
            <Card style={{ marginBottom: spacing.xl, padding: spacing.xl }}>
              <h3 style={{ color: colors.white, marginTop: 0, marginBottom: spacing.lg }}>
                Aktif Ödünçler ({studentLoans.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {studentLoans.map((loan) => {
                  const isOverdue = new Date(loan.dueDate) < new Date();
                  return (
                    <div key={loan.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: isOverdue ? `${colors.error}15` : colors.bg,
                      padding: spacing.md, borderRadius: borderRadius.md,
                      border: isOverdue ? `1px solid ${colors.error}50` : 'none',
                      flexWrap: 'wrap', gap: spacing.sm,
                    }}>
                      <div>
                        <p style={{ color: colors.white, fontWeight: 600, margin: 0, fontSize: '14px' }}>{loan.book.title}</p>
                        <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{loan.book.author}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: isOverdue ? colors.error : colors.gray, fontSize: '12px', margin: 0 }}>
                            İade: {new Date(loan.dueDate).toLocaleDateString('tr-TR')}
                          </p>
                          {isOverdue && <Badge variant="danger">Gecikmiş</Badge>}
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReturn(loan.id)}
                          disabled={returning === loan.id}
                        >
                          {returning === loan.id ? '...' : 'İade Et'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Step 2: Book Selection */}
          <Card style={{ padding: spacing.xl }}>
            <h3 style={{ color: colors.white, marginTop: 0, marginBottom: spacing.lg }}>2. Kitap Seç ve Ödünç Ver</h3>
            <Input
              label=""
              type="text"
              placeholder="Kitap adı, yazar veya ISBN ile arayınız..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
            />
            {filteredBooks.length > 0 && (
              <div style={{ marginTop: spacing.md, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {filteredBooks.map((book) => (
                  <div key={book.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md,
                    flexWrap: 'wrap', gap: spacing.sm,
                  }}>
                    <div>
                      <p style={{ color: colors.white, fontWeight: 600, margin: 0, fontSize: '14px' }}>{book.title}</p>
                      <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{book.author}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <Badge variant={book.available > 0 ? 'success' : 'danger'}>
                        {book.available}/{book.quantity}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleBorrow(book.id)}
                        disabled={book.available <= 0 || borrowing}
                      >
                        {borrowing ? '...' : 'Ödünç Ver'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookSearch.trim() && filteredBooks.length === 0 && (
              <p style={{ color: colors.gray, fontSize: '13px', marginTop: spacing.sm }}>Kitap bulunamadi</p>
            )}
            {!bookSearch.trim() && (
              <p style={{ color: colors.gray, fontSize: '13px', marginTop: spacing.sm }}>
                Odunc vermek istediginiz kitabi arayiniz
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
