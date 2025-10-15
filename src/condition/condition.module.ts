import { Module } from '@nestjs/common';
import { ConditionController } from './condition.controller';
import { ConditionService } from './condition.service';

@Module({
  controllers: [ConditionController],
  providers: [ConditionService]
})
export class ConditionModule {}
