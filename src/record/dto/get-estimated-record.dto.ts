import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetEstimatedRecordDto {
    @ApiProperty()
    @IsString()
    tankId: string;
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    startDate: string;
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    endDate: string;
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    time: string;
}