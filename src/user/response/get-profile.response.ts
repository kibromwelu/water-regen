import { ApiProperty } from "@nestjs/swagger";

class SocialAccount {
    @ApiProperty()
    GOOGLE: boolean;

    @ApiProperty()
    APPLE: boolean;

    @ApiProperty()
    KAKAO: boolean;

    @ApiProperty()
    NAVER: boolean;
}

export class GetProfileResponse {
    @ApiProperty()
    id: string;
    
    @ApiProperty({type:String})
    username: string | null;

    @ApiProperty({type:String})
    phoneNumber: string | null;
    
    @ApiProperty()
    linkedSocialAccount: SocialAccount;

    @ApiProperty()
    isAdmin: boolean;

    @ApiProperty()
    isRegisteredBySocial: boolean;

    @ApiProperty()
    isPasswordSet: boolean;
}