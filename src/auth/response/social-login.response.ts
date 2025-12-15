import { ApiProperty } from "@nestjs/swagger"

export class SocialLoginResponse {
    @ApiProperty({type:String})
    accessToken: string
    @ApiProperty({type:String})
    refreshToken: string
    @ApiProperty()
    id: string
    @ApiProperty()
    isNewUser: boolean
}