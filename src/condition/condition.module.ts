import { Module } from '@nestjs/common';
import { ConditionController } from './condition.controller';
import { ConditionService } from './condition.service';
import { RecurringConditionModule } from 'src/recurring-condition/recurring-condition.module';
import { FeedIncreaseConditionModule } from 'src/feed-increase-condition/feed-increase-condition.module';

@Module({
  imports: [RecurringConditionModule, FeedIncreaseConditionModule],
  controllers: [ConditionController],
  providers: [ConditionService]
})
export class ConditionModule { }
