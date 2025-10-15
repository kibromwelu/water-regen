import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IntervalType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";


export class CreateRecurringConditionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    tankId: string

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    intervalValue: number

    @ApiProperty({ enum: IntervalType })
    @IsEnum(IntervalType)
    @IsNotEmpty()
    intervalType: IntervalType

    @ApiPropertyOptional()
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    endDate?: Date

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    endingCount?: number

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string
}