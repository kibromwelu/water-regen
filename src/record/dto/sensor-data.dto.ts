import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from "class-validator"

export class SensorDataDto {
    @ApiProperty()
    @IsNumber()
    tankerId: number
    @ApiProperty()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date: Date
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isClean: boolean
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    waterTemperature: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    do: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    ph: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    nh4: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    no2: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    no3: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    alk: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    salinity: number
}