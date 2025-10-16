import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CronModule } from './cron/cron.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SmsModule } from './sms/sms.module';
import { TankModule } from './tank/tank.module';
import { ConditionModule } from './condition/condition.module';
import { FeedIncreaseConditionModule } from './feed-increase-condition/feed-increase-condition.module';
import { RecurringConditionModule } from './recurring-condition/recurring-condition.module';
import { RecordModule } from './record/record.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    ScheduleModule.forRoot(),
    CronModule,
    SmsModule,
    TankModule,
    ConditionModule,
    FeedIncreaseConditionModule,
    RecurringConditionModule,
    RecordModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
