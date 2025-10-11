import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto, RefreshTokenDto, SignupDto, VerifyCodeDto, VerifyPhoneDto } from './dto';
import { MessageResponse } from 'src/common/response';
import { LoginResponse, VerifyCodeResponse } from './response';

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

    @ApiOperation({ summary: 'Signup user' })
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({ status: 201, type: LoginResponse })
    @Post('signup/:id')
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
}
