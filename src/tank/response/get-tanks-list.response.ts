import { ApiProperty } from "@nestjs/swagger";


export class GetTanksListResponse {
    @ApiProperty()
    id: string;
    
    @ApiProperty()
    name: string;

    @ApiProperty()
    tankerId: number;
    
    @ApiProperty()
    createdAt: Date;
}