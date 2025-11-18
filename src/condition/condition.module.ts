import { Module } from '@nestjs/common';
import { ConditionController } from './condition.controller';
import { ConditionService } from './condition.service';
import { RecurringConditionModule } from 'src/recurring-condition/recurring-condition.module';

@Module({
  imports: [RecurringConditionModule],
  controllers: [ConditionController],
  providers: [ConditionService]
})
export class ConditionModule { }
