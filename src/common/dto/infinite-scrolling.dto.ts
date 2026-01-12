import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsNumber, IsOptional, IsString } from "class-validator"


export class InfiniteScroll {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cursor?: string

    @ApiPropertyOptional({default:50})
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    limit: number = 50
}