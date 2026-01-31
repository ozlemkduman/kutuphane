// NotificationsModule - Bildirim modülü

import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
