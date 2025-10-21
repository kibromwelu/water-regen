import { ApiProperty } from "@nestjs/swagger";

export class CreateEstimatedRecordResponse {
    @ApiProperty()
    estimatedCount: number;
    @ApiProperty()
    estimatedHarvest: number;
}