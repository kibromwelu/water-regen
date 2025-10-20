import { ApiProperty } from "@nestjs/swagger";


export class GetTanksListResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    tankerId: string;

    @ApiProperty()
    createdAt: Date;
}