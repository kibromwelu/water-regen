import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class GetUsersListDto {
    
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    search?: string
}