import { ApiProperty } from "@nestjs/swagger"

export class ConditionData {
    @ApiProperty()
    id: string
    @ApiProperty()
    name: string
}

export class ConditionsListResponse {
    @ApiProperty({ type: [ConditionData] })
    feedingConditions: ConditionData[]
    @ApiProperty({ type: [ConditionData] })
    alertConditions: ConditionData[]
    @ApiProperty({ type: [ConditionData] })
    recurringConditions: ConditionData[]
    @ApiProperty({ type: [ConditionData] })
    feedIncreaseConditions: ConditionData[]
}