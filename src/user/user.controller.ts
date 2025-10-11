import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetProfileResponse, VerifyPasswordChangeResponse } from './response';
import { CurrentUserId } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { changePasswordDto, sendVerficationCodeDto, VerifyVerifcationCodeDto } from './dto';
import { MessageResponse } from 'src/common/response';

@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
    constructor(private readonly UserService: UserService) {}

    @Get('my-profile')
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({ status: 200, type: GetProfileResponse })
    async getUserProfile(
        @CurrentUserId() userId: string,
    ): Promise<GetProfileResponse> {
        return this.UserService.getUserProfile(userId);
    }

    @Post('send-verification-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send verification code to phone number' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async sendVerficationCode(
      @CurrentUserId() userId: string,
      @Body() dto: sendVerficationCodeDto,
    ): Promise<MessageResponse> {
      return this.UserService.sendVerficationCode(userId, dto);
    }

    @Post('change-phone-number')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change phone number (verify code and update)' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async changePhoneNumber(
      @CurrentUserId() userId: string,
      @Body() dto: VerifyVerifcationCodeDto,
    ): Promise<MessageResponse> {
      return this.UserService.changePhoneNumber(userId, dto);
    }

    @Post('verify-password-change')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify password change request (returns token)' })
    @ApiResponse({ status: 200, type: VerifyPasswordChangeResponse })
    async verifyPasswordChangeRequest(
      @CurrentUserId() userId: string,
      @Body() dto: VerifyVerifcationCodeDto,
    ): Promise<VerifyPasswordChangeResponse> {
      return this.UserService.verifyPasswordChangeRequest(userId, dto);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change password using token' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async changePassword(
      @CurrentUserId() userId: string,
      @Body() dto: changePasswordDto,
    ): Promise<MessageResponse> {
      return this.UserService.changePassword(userId, dto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete current user account' })
    @ApiResponse({ status: 200, type: MessageResponse })
    async deleteUser(
      @CurrentUserId() userId: string,
    ): Promise<MessageResponse> {
      return this.UserService.deleteUser(userId);
    }
}
