// NotificationsController - Bildirim endpoint'leri

import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // GET /api/notifications - Bildirimlerimi getir
  @Get()
  @UseGuards(AuthGuard)
  async getMyNotifications(@Req() req: any) {
    return this.notificationsService.getUserNotifications(
      req.user.id,
      req.user.schoolId,
    );
  }

  // GET /api/notifications/unread-count - Okunmamış sayısı
  @Get('unread-count')
  @UseGuards(AuthGuard)
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.id,
      req.user.schoolId,
    );
    return { count };
  }

  // POST /api/notifications/:id/read - Okundu işaretle
  @Post(':id/read')
  @UseGuards(AuthGuard)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    await this.notificationsService.markAsRead(id, req.user.id);
    return { success: true };
  }

  // POST /api/notifications/read-all - Tümünü okundu işaretle
  @Post('read-all')
  @UseGuards(AuthGuard)
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id, req.user.schoolId);
    return { success: true };
  }

  // POST /api/notifications/send - Genel bildirim gönder (Admin)
  @Post('send')
  @UseGuards(AdminGuard)
  async sendNotification(
    @Body() data: { title: string; message: string; userIds?: string[] },
    @Req() req: any,
  ) {
    return this.notificationsService.sendGeneralNotification(
      req.user.schoolId,
      data.title,
      data.message,
      data.userIds,
    );
  }

  // POST /api/notifications/send-reminders - Gecikme hatırlatmalarını gönder (Admin/Cron)
  @Post('send-reminders')
  @UseGuards(AdminGuard)
  async sendReminders() {
    return this.notificationsService.sendOverdueReminders();
  }
}
