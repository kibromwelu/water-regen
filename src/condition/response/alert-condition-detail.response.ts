import { ApiProperty } from "@nestjs/swagger";

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
    @ApiProperty()
    sensor: string;
    @ApiProperty()
    value: number;
    @ApiProperty()
    condition: string;
}