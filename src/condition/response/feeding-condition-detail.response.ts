import { ApiProperty } from "@nestjs/swagger"
import { ConditionValueType, SensorType } from "@prisma/client";
class TankObject {
    @ApiProperty()
    id: string
    @ApiProperty()
    name: string
}
export class FeedingConditionDetailResponse {
    @ApiProperty()
    id: string;
    @ApiProperty()
    name: string;
    @ApiProperty({ type: TankObject })
    tank: TankObject;
    @ApiProperty({
        enum: SensorType
    })
    sensor: SensorType;
    @ApiProperty()
    value: number;
    @ApiProperty({
        enum: ConditionValueType
    })
    condition: ConditionValueType;
    @ApiProperty({ type: String, nullable: true })
    recommendation: string | null;
}