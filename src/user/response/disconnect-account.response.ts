import { ApiProperty } from "@nestjs/swagger";

export class DisconnectSocialAccountResponse {
    @ApiProperty()
    message: string;
    @ApiProperty()
    provider: string;
}