import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class SignupDto {
    @ApiProperty()
    @IsString()
    id: string

    @ApiProperty()
    @IsString()
    @Length(5, 20)
    username: string;

    @ApiProperty()
    @IsString()
    @Length(8, 20)
    password: string;

}