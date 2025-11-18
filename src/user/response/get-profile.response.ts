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

    @ApiProperty()
    phoneNumber: string;
    
    @ApiProperty()
    linkedSocialAccount: SocialAccount;

    @ApiProperty()
    isAdmin: boolean;
}