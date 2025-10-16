import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
class FeedingInfo {
    @ApiProperty()
    type: string
    @ApiProperty()
    amount: number
}

class SupplementDosing {
    @ApiProperty()
    name: string
    @ApiProperty()
    dosage: number
}
export class CreateHusbandryDataDto {
    @ApiProperty()
    @IsString()
    tankId: string
    @ApiProperty()
    @IsString()
    date: string
    @ApiProperty()
    @IsString()
    time: string
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
    alk: number
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    salinity: number
    @ApiPropertyOptional({ type: [FeedingInfo] })
    @IsOptional()
    @IsArray()
    feedingInfo: FeedingInfo[]
    @ApiPropertyOptional({ type: [SupplementDosing] })
    @IsOptional()
    @IsArray()
    supplementDosing: SupplementDosing[]
}

