import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { SocialAccountProvider } from "@prisma/client";

class RegisteredSocialProvider {
    @ApiProperty({enum:SocialAccountProvider})
    providerType: SocialAccountProvider | null;

    @ApiProperty({type:String})
    providerId: string | null;

    @ApiProperty({ type: String })
    email: string | null;

    @ApiProperty({ type: String })
    phoneNumber: string | null;
}
export class VerifyFindAccountResponse {
    @ApiProperty()
    hasAccount: boolean;

    @ApiProperty()
    id: string;

    @ApiProperty({ type: String })
    username: string | null;

    @ApiProperty({ type: String, nullable: true, description: 'Password reset token' })
    token: string | null;

    @ApiProperty()
    isRegisteredBySocial: boolean;

    @ApiPropertyOptional({ enum: String, nullable:true })
    providerType: SocialAccountProvider | null;

    @ApiProperty({ type: String })
    providerInfo: string | null;
}