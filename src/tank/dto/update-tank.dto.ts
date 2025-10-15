//import { PartialType } from '@nestjs/mapped-types';
import { CreateTankDto } from './create-tank.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateTankDto extends PartialType(CreateTankDto) {}
