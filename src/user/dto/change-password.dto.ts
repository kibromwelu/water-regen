import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class changePasswordDto {
    
    @ApiProperty()
    @IsString()
    token: string

    @ApiProperty()
    @IsString()
    password: string
}