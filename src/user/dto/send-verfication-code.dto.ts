import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

enum VerificationType {
    CHANGE_PHONE = 'CHANGE_PHONE',
    CHANGE_PASSWORD = 'CHANGE_PASSWORD'
}

export class SendVerficationCodeDto {
    @ApiProperty()
    @IsString()
    phoneNumber: string

    @ApiProperty({enum: VerificationType})
    @IsString()
    @IsEnum(VerificationType)
    type: VerificationType
}