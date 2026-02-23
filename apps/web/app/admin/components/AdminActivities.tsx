'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { colors, borderRadius, spacing } from '@/lib/theme';
import { formatDateTime } from './utils';
import { Activity } from './types';

interface AdminActivitiesProps {
  activities: Activity[];
}

export function AdminActivities({ activities }: AdminActivitiesProps) {
  return (
    <div>
      <h2 style={{ color: colors.white, fontSize: '24px', marginBottom: spacing.xl }}>🔔 Son Aktiviteler</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {activities.map((activity) => (
          <Card key={activity.id} style={{ padding: spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: activity.returnedAt ? colors.success + '20' : colors.warning + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '24px' }}>{activity.returnedAt ? '✅' : '📤'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: colors.white, fontSize: '14px', margin: 0 }}>
                  <strong>{activity.user.name}</strong>
                  {activity.returnedAt ? ' iade etti: ' : ' ödünç aldı: '}
                  <span style={{ color: colors.primaryLight }}>{activity.book.title}</span>
                </p>
                <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>{activity.user.email}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: colors.gray, fontSize: '12px', margin: 0 }}>
                  {formatDateTime(activity.returnedAt || activity.borrowedAt)}
                </p>
                <Badge variant={activity.returnedAt ? 'success' : 'warning'}>
                  {activity.returnedAt ? 'İade Edildi' : 'Aktif'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
