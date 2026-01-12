import { ApiProperty } from "@nestjs/swagger";

export class VerifyCodeResponse {
    @ApiProperty()
    message: string;
    @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;
}