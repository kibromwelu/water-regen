import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class VerifyCodeDto {
    @ApiProperty()
    @IsString()
    @Length(6, 6)
    code: string

    @ApiProperty()
    @IsString()
    phoneNumber: string

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    id?: string
}