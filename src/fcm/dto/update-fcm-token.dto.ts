import { ApiProperty } from '@nestjs/swagger';
import {IsString, IsNotEmpty } from 'class-validator';


export class UpdateFCMTokenDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fcmToken: string
}