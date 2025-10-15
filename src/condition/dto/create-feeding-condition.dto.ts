import { ApiProperty } from "@nestjs/swagger"
import { ConditionValueType, SensorType } from "@prisma/client";
import { IsEnum, IsNumber, IsString, isString } from "class-validator"

export class CreateFeedingConditionDto {
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