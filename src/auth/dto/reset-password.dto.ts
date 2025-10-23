import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    id: string;
    @ApiProperty()
    @IsString()
    token: string
    @ApiProperty()
    @IsString()
    password: string;
}