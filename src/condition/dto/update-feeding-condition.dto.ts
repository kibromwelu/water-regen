import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ConditionValueType, SensorType } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { FeedSensorType } from "./create-feeding-condition.dto";

export class UpdateFeedingConditionDto {
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