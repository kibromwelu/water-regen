import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DisconnectSocialAccountResponse, GetProfileResponse, GetUserslistResponse, GetUserRoleResponse, VerifyPasswordChangeResponse, GetUserDropdownResponse } from './response';
import { CurrentUserId, Roles } from 'src/common/decorators';
import { JwtGuard, RoleGuard } from 'src/common/guards';
import {
  ChangePasswordDto,
  GetUsersListDto,
  LogoutDto,
  SendVerficationCodeDto,
  UpdateUserRoleDto,
  VerifyVerifcationCodeDto,
} from './dto';
import { MessageResponse } from 'src/common/response';
import { SocialAccountProvider } from '@prisma/client';
import { InfiniteScroll } from 'src/common/dto';

@ApiBearerAuth()
@UseGuards(JwtGuard, RoleGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('my-profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, type: GetProfileResponse })
  async getUserProfile(
    @CurrentUserId() userId: string,
  ): Promise<GetProfileResponse> {
    return this.userService.getUserProfile(userId);
  }

  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send verification code to phone number' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async sendVerficationCode(
    @CurrentUserId() userId: string,
    @Body() dto: SendVerficationCodeDto,
  ): Promise<MessageResponse> {
    return this.userService.sendVerficationCode(userId, dto);
  }

  @Post('change-phone-number')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change phone number (verify code and update)' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async changePhoneNumber(
    @CurrentUserId() userId: string,
    @Body() dto: VerifyVerifcationCodeDto,
  ): Promise<MessageResponse> {
    return this.userService.changePhoneNumber(userId, dto);
  }

  @Post('verify-password-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password change request (returns token)' })
  @ApiResponse({ status: 200, type: VerifyPasswordChangeResponse })
  async verifyPasswordChangeRequest(
    @CurrentUserId() userId: string,
    @Body() dto: VerifyVerifcationCodeDto,
  ): Promise<VerifyPasswordChangeResponse> {
    return this.userService.verifyPasswordChangeRequest(userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password using token' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponse> {
    return this.userService.changePassword(userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async deleteUser(@CurrentUserId() userId: string): Promise<MessageResponse> {
    return this.userService.deleteUser(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user account',
  })
  @ApiResponse({ status: 200, type: MessageResponse })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized, Token expired or Invalid token',
  })
  @ApiResponse({
    status: 400,
    description: 'User Not Found',
  })
  async logout(
    @CurrentUserId() userId: string,
    @Body() dto: LogoutDto
  ): Promise<MessageResponse> {
    return this.userService.logout(userId, dto);
  }

  @Post('/link-kakao')
  @ApiOperation({
    summary: 'Connect kakao account',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResponse,
    description: 'Connected successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'unauthorized access',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async connectKakao(
    @Query('accessToken') token: string,
    @CurrentUserId() userId: string,
  ) {
    return await this.userService.linkKakao(token, userId);
  }

  @Post('link-naver')
  @ApiOperation({
    summary: 'Connect naver',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async connectNaver(
    @Query('accessToken') token: string,
    @CurrentUserId() userId: string,
  ) {
    return this.userService.linkNaver(token, userId);
  }

  @Post('link-google')
  @ApiOperation({
    summary: 'Connect google',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async linkGoogle(
    @Query('accessToken') token: string,
    @CurrentUserId() userId: string,
  ) {
    return this.userService.linkGoogle(token, userId);
  }

  @Post('link-apple')
  @ApiOperation({ summary: 'Connect Apple account' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized access' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async connectApple(
    @Query('identityToken') identityToken: string,
    @CurrentUserId() userId: string,
  ) {
    return this.userService.connectWithApple(identityToken, userId);
  }
  
  @Post('disconnect-account')
  @ApiOperation({ summary: 'Disconnect linked social account', description: 'Disconnect a linked social account from the user profile' })
  @ApiQuery({ name: 'provider', enum: SocialAccountProvider, description: 'The social account provider to disconnect' })
  @ApiResponse({ status: HttpStatus.OK, type: DisconnectSocialAccountResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Linked account not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized access' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async disconnectSocialAccount(
    @Query('provider') provider: SocialAccountProvider,
    @CurrentUserId() userId: string,
  ): Promise<MessageResponse> {
    return this.userService.disconnectSocialAccount(provider, userId);
  }

  @Get('admin/list')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get users list', })
  @ApiResponse({ status: HttpStatus.OK, type: GetUserslistResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized access' })
  async getUsersList(
    @Query() dto: GetUsersListDto,
    @Query() pagination: InfiniteScroll,
    @CurrentUserId() userId: string,
  ): Promise<GetUserslistResponse> {
    return this.userService.getUsersList(dto, userId ,pagination);
  }

  @Patch('admin/update-role/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user role', })
  @ApiResponse({ status: HttpStatus.OK, type: GetUserRoleResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized access' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto
  ): Promise<GetUserRoleResponse> {
    return this.userService.updateUserRole(id, dto.role);
  }

  @Get('condition/list')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get users list for condition copy dropdown', })
  @ApiResponse({ status: HttpStatus.OK, type: [GetUserDropdownResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized access' })
  async getUsersListD(
    @Query() dto: GetUsersListDto,
  ): Promise<GetUserDropdownResponse[]> {
    return this.userService.getUsersDropdown(dto);
  }
}
