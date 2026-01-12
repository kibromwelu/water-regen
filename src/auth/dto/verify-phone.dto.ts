import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifyPhoneDto {
    @ApiProperty()
    @IsString()
    phoneNumber: string
}