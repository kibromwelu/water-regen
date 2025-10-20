import { ApiProperty } from "@nestjs/swagger";

export class GetEstimatedRecordResponse {
    @ApiProperty()
    tankId: string;
    @ApiProperty()
    startDate: string;
    @ApiProperty()
    endDate: string;
    @ApiProperty()
    time: string;
    @ApiProperty()
    averageBodyWeight: number;
    @ApiProperty()
    lastShrimpWeight: number;
    @ApiProperty()
    feedAdded: number;
    // @ApiProperty()
    // fcr: number;
}