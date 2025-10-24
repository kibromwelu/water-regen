import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class SensorDataDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    tankerId: string

    @ApiProperty({ example: '2025-11-01T00:00:00.000Z', description: 'UTC formatted date string' })
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    date: Date

    // @ApiPropertyOptional()
    // @IsOptional()
    // @IsBoolean()
    // isClean: boolean

    @ApiPropertyOptional({
        type: String,
    example: "26.4",
    description: "Water temperature (sent as string, converted to float)",
    })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
    @IsNumber()
    waterTemperature: number

    @ApiPropertyOptional({ type: String, example: "7.2" })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
    @IsNumber()
    do: number

    @ApiPropertyOptional({ type: String, example: "5.4" })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
    @IsNumber()
    ph: number

    @ApiPropertyOptional({ type: String, example: "0.12" })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
    @IsNumber()
    nh4: number

    @ApiPropertyOptional({ type: String, example: "0.03" })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
    @IsNumber()
    no2: number

    @ApiPropertyOptional({ type: String, example: "150.5" })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
    @IsNumber()
    alk: number
}