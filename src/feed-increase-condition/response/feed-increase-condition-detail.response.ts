import { ApiProperty } from "@nestjs/swagger"
class TankObject {
    @ApiProperty()
    id: string
    @ApiProperty()
    name: string
}
export class FeedIncreaseConditionResponse {
    @ApiProperty()
    id: string
    @ApiProperty()
    name: string
    @ApiProperty()
    referenceTime: string
    @ApiProperty({ type: TankObject })
    tank: TankObject
}