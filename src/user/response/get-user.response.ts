import { ApiProperty } from "@nestjs/swagger";

export class GetUserDropdownResponse {
    @ApiProperty()
    id: string;
    
    @ApiProperty({type:String})
    username: string | null;
}

class GetUserResponse {
    @ApiProperty()
    id: string;
    
    @ApiProperty({type:String})
    username: string | null;

    @ApiProperty()
    phoneNumber: string;
    
    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    hasTank: boolean;
}

export class GetUserslistResponse {
    @ApiProperty({ type: [GetUserResponse] })
    users: GetUserResponse[];

    @ApiProperty()
    total: number;
}