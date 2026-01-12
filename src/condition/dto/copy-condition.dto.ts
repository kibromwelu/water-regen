import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

enum ConditionTypeEnum {
    FEEDING = 'FEEDING',
    ALERT = 'ALERT',
    RECURRING = 'RECURRING',
    FEED_INCREASE = 'FEED_INCREASE'
}
export class CopyConditionDto {
    @ApiProperty()
    @IsString()
    conditionId: string;
    @ApiProperty()
    @IsString()
    targetTankId: string;
    @ApiProperty({
        enum: ConditionTypeEnum
    })
    @IsEnum(ConditionTypeEnum)
    type: ConditionTypeEnum
}