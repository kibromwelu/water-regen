import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";


export class CreateTankDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    whitelegShrimpStrain: string

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    averageBodyWeight: number

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    numberStocked: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    waterTemperature?: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    do?: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    ph?: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    nh4?: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    no2?: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    alk?: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    salinity?: number
}