import { ApiProperty } from "@nestjs/swagger";
import { SensorType } from "@prisma/client";

class TankObject {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;
}

export class AlertConditionDetailResponse {
    @ApiProperty()
    id: string;
    @ApiProperty()
    name: string;
    @ApiProperty()
    tank: TankObject;
    @ApiProperty({ enum: SensorType })
    sensor: SensorType;
    @ApiProperty()
    value: number;
    @ApiProperty()
    condition: string;
}