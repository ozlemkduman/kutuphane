'use client';

import { Card } from '@/components/ui/Card';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { formatDate } from './utils';
import { OverdueLoan } from './types';

interface AdminOverdueProps {
  overdueLoans: OverdueLoan[];
}

export function AdminOverdue({ overdueLoans }: AdminOverdueProps) {
  return (
    <div>
      <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>⚠️ Gecikmiş İadeler</h2>
      {overdueLoans.length === 0 ? (
        <Card style={{ padding: spacing['3xl'], textAlign: 'center' }}>
          <span style={{ fontSize: '48px' }}>✅</span>
          <p style={{ color: colors.success, fontSize: '18px', marginTop: spacing.lg }}>Gecikmiş iade yok!</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {overdueLoans.map((loan) => (
            <Card key={loan.id} style={{ padding: spacing.lg, border: `1px solid ${colors.error}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', backgroundColor: colors.error + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ color: colors.white, fontWeight: 600, fontSize: '16px', margin: 0 }}>{loan.book.title}</p>
                  <p style={{ color: colors.gray, fontSize: '13px', margin: 0 }}>{loan.book.author}</p>
                </div>
                <div style={{ minWidth: '150px' }}>
                  <p style={{ color: colors.white, fontWeight: 600, margin: 0 }}>{loan.user.name}</p>
                  <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{loan.user.email}</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                  <p style={{ color: colors.error, fontWeight: 'bold', fontSize: '24px', margin: 0 }}>{loan.daysOverdue}</p>
                  <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>gün gecikmiş</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>Son iade tarihi</p>
                  <p style={{ color: colors.error, fontWeight: 600, margin: 0 }}>{formatDate(loan.dueDate)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
