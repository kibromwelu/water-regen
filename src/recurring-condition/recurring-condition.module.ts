import { Module } from '@nestjs/common';
import { RecurringConditionService } from './recurring-condition.service';
import { RecurringConditionController } from './recurring-condition.controller';

@Module({
  providers: [RecurringConditionService],
  controllers: [RecurringConditionController],
  exports: [RecurringConditionService],
})
export class RecurringConditionModule { }
