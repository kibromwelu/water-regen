import { ApiProperty } from "@nestjs/swagger"

export class VerifyFindAccountResponse {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: String, })
    username: string | null;
    @ApiProperty({ type: String, nullable: true, description: 'Password reset token' })
    token: string | null;
}