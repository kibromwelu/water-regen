import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class SetUsernameDto {

    @ApiProperty()
    @IsString()
    @Length(5, 20)
    username: string;

}