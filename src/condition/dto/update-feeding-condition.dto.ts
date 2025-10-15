import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ConditionValueType, SensorType } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateFeedingConditionDto {
    @ApiProperty()
    @IsString()
    name: string;
    @ApiProperty()
    @IsString()
    tankId: string;
    @ApiProperty({ enum: SensorType })
    @IsEnum(SensorType)
    sensor: SensorType;
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