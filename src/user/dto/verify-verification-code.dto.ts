import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class VerifyVerifcationCodeDto {
    
    @ApiProperty()
    @IsString()
    @Length(6, 6)
    code: string

    @ApiProperty()
    @IsString()
    phoneNumber: string
}