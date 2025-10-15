import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateFeedIncreaseConditionDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    tankId: string;

    @ApiProperty()
    @IsString()
    referenceTime: string;
}
