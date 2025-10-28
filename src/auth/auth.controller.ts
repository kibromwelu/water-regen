import { Body, Controller, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckUsernameDto, LoginDto, RefreshTokenDto, ResetPasswordDto, SignupDto, VerifyCodeDto, VerifyPhoneDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { CheckUsernameResponse, LoginResponse, VerifyCodeResponse, VerifyFindAccountResponse } from './response';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiOperation({ summary: 'Send verification code' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: MessageResponse })
    @Post('verify-phone')
    async verifyPhone(@Body() body: VerifyPhoneDto): Promise<MessageResponse> {
        return this.authService.verifyPhone(body);
    }

    @ApiOperation({ summary: 'Verify code' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: VerifyCodeResponse })
    @Post('verify-code')
    async verifyCode(@Body() body: VerifyCodeDto): Promise<VerifyCodeResponse> {
        return this.authService.verifyCode(body);
    }

    @ApiOperation({ summary: 'Check username availability' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: CheckUsernameResponse })
    @Post('check-username')
    async checkUsername(@Body() body: CheckUsernameDto): Promise<CheckUsernameResponse> {
        return this.authService.checkUsername(body);
    }


    @ApiOperation({ summary: 'Signup user' })
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({ status: 201, type: LoginResponse })
    @Post('signup')
    async signup(@Body() body: SignupDto): Promise<LoginResponse> {
        return this.authService.signup(body);
    }

    @ApiOperation({ summary: 'Login user' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: LoginResponse })
    @Post('login')
    async login(@Body() dto: LoginDto): Promise<LoginResponse> {
        return this.authService.login(dto);
    }

    @ApiOperation({ summary: 'Refresh token' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: LoginResponse })
    @Post('refresh-token')
    async refreshToken(@Body() dto: RefreshTokenDto): Promise<LoginResponse> {
        return this.authService.refreshToken(dto);
    }

    @ApiOperation({ summary: 'Login with Kakao' })
    @ApiResponse({ status: 200, type: LoginResponse })
    @HttpCode(HttpStatus.OK)
    @Post('login/kakao')
    async loginWithKakao(
        @Query('accessToken') accessToken: string
    ): Promise<LoginResponse> {
        return this.authService.loginWithKakao(accessToken);
    }

    @ApiOperation({ summary: 'Login with Naver' })
    @ApiResponse({ status: 200, type: LoginResponse })
    @HttpCode(HttpStatus.OK)
    @Post('login/naver')
    async loginWithNaver(
        @Query('accessToken') accessToken: string
    ): Promise<LoginResponse> {
        return this.authService.loginWithNaver(accessToken);
    }

    @ApiOperation({ summary: 'Login with Google' })
    @ApiResponse({ status: 200, type: LoginResponse })
    @HttpCode(HttpStatus.OK)
    @Post('login/google')
    async loginWithGoogle(
        @Query('accessToken') accessToken: string,
    ): Promise<LoginResponse> {
        return this.authService.loginWithGoogle(accessToken);
    }

    @ApiOperation({ summary: 'Login with Apple' })
    @ApiResponse({ status: 200, type: LoginResponse })
    @HttpCode(HttpStatus.OK)
    @Post('login/apple')
    async loginWithApple(
        @Query('identityToken') identityToken: string,
    ): Promise<LoginResponse> {
        return this.authService.loginWithApple(identityToken);
    }

    @ApiOperation({ summary: 'Find account by phone number', description: 'Initiate account recovery by sending a verification code to the provided phone number.' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: MessageResponse })
    @Post('find-account')
    async findAccount(@Body() body: VerifyPhoneDto): Promise<MessageResponse> {
        return this.authService.findAccount(body);
    }

    @ApiOperation({ summary: 'Verify find account code', description: 'Verify the code sent for account recovery and receive a token for password reset.' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: VerifyFindAccountResponse })
    @Post('verify-find-account')
    async verifyFindAccountCode(@Body() body: VerifyCodeDto): Promise<VerifyFindAccountResponse> {
        return this.authService.verifyFindAccountCode(body);
    }

    @ApiOperation({ summary: 'Reset password', description: 'Reset the user password using the provided token and new password.' })
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ status: 200, type: LoginResponse })
    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordDto): Promise<LoginResponse> {
        return this.authService.resetPassword(body);
    }
}
