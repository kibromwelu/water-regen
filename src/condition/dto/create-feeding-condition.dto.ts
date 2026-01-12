import { ApiProperty } from "@nestjs/swagger"
import { ConditionValueType, SensorType } from "@prisma/client";
import { IsEnum, IsNumber, IsString, isString } from "class-validator"

export enum FeedSensorType {
  DO = 'DO',
  PH = 'PH',
  NH4 = 'NH4',
  NO2 = 'NO2',
  ALK = 'ALK',
  WATER_TEMPERATURE = 'WATER_TEMPERATURE'
}

export class CreateFeedingConditionDto {
    @ApiProperty()
    @IsString()
    name: string;
    @ApiProperty()
    @IsString()
    tankId: string;
    @ApiProperty({ enum: FeedSensorType })
    @IsEnum(FeedSensorType)
    sensor: FeedSensorType;
    @ApiProperty()
    @IsNumber()
    value: number;
    @ApiProperty({ enum: ConditionValueType })
    @IsEnum(ConditionValueType)
    condition: ConditionValueType;
    @ApiProperty()
    @IsString()
    recommendation: string;
}