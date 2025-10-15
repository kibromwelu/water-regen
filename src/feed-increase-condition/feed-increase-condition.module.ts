import { Module } from '@nestjs/common';
import { FeedIncreaseConditionController } from './feed-increase-condition.controller';
import { FeedIncreaseConditionService } from './feed-increase-condition.service';

@Module({
  controllers: [FeedIncreaseConditionController],
  providers: [FeedIncreaseConditionService]
})
export class FeedIncreaseConditionModule {}
