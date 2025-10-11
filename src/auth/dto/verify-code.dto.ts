import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class VerifyCodeDto {
    @ApiProperty()
    @IsString()
    @Length(6, 6)
    code: string

    @ApiProperty()
    @IsString()
    phoneNumber: string
}