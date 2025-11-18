import { ApiProperty } from "@nestjs/swagger"
import { ConditionValueType, SensorType } from "@prisma/client";
import { FeedSensorType } from "../dto";
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
        enum: FeedSensorType
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