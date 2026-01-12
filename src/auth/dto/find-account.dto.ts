import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FindAccountDto {
    @ApiProperty({ example: '01012345678', description: 'User phone number' })
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;
}