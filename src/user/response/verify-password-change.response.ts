import { ApiProperty } from "@nestjs/swagger";

export class VerifyPasswordChangeResponse {
    @ApiProperty()
    message: string;
    
    @ApiProperty()
    token: string;
}