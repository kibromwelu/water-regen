import { ApiProperty } from '@nestjs/swagger';
import { IntervalType } from '@prisma/client';
import { IsEnum } from 'class-validator';

class TankInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class GetRecurringConditionDetailResponse {
  @ApiProperty()
  name: string;

  @ApiProperty({type: TankInfo})
  tank: TankInfo;

  @ApiProperty()
  intervalValue: number;

  @ApiProperty({ enum: IntervalType })
  @IsEnum(IntervalType)
  intervalType: IntervalType;

  @ApiProperty({ type: String })
  endDate: string | null;

  @ApiProperty({ type: Number })
  endingCount: number | null;

  @ApiProperty()
  message: string;
}
