import { ApiProperty } from "@nestjs/swagger";

export class GetEstimatedRecordResponse {
    @ApiProperty()
    tankId: string;
    @ApiProperty()
    startDate: string;
    @ApiProperty({type: String})
    endDate: string | null;
    @ApiProperty()
    time: string;
    @ApiProperty()
    averageBodyWeight: number;
    @ApiProperty()
    lastShrimpWeight: number;
    @ApiProperty()
    feedAdded: number;
    @ApiProperty()
    doc: number;
}