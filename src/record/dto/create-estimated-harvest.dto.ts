import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateEstimatedHarvestDto {
    @ApiProperty()
    @IsString()
    tankId: string;
    @ApiProperty()
    @IsString()
    startDate: string;
    @ApiProperty()
    @IsString()
    endDate: string;
    @ApiProperty()
    @IsString()
    time: string;
    @ApiProperty()
    @IsNumber()
    averageBodyWeight: number;
    @ApiProperty()
    @IsNumber()
    lastShrimpWeight: number;
    @ApiProperty()
    @IsNumber()
    feedAdded: number;
    @ApiProperty()
    @IsNumber()
    fcr: number;
}