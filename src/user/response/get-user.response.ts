import { ApiProperty } from "@nestjs/swagger";


export class GetUserResponse {
    @ApiProperty()
    id: string;
    
    @ApiProperty({type:String})
    username: string | null;

    @ApiProperty()
    phoneNumber: string;
    
    @ApiProperty()
    createdAt: Date;
}