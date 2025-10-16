import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";


export class GetHomeDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    tankId?: string

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    startDate?: string

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    endDate?: string

    @ApiPropertyOptional({default: false})
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @IsOptional()
    isHourlyView?: boolean=false
}