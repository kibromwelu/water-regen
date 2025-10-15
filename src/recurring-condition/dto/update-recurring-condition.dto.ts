//import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurringConditionDto } from './create-recurring-condition.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateRecurringConditionDto extends PartialType(CreateRecurringConditionDto) {}
