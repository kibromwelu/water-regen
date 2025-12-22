import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CheckUsernameDto,
  LoginDto,
  loginWithAppleDto,
  loginWithSocialDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignupDto,
  VerifyCodeDto,
  VerifyPhoneDto,
} from './dto';
import { MessageResponse } from 'src/common/response';
import {
  CheckUsernameResponse,
  LoginResponse,
  SocialLoginResponse,
  VerifyCodeResponse,
  VerifyFindAccountResponse,
} from './response';
import { Request, Response } from 'express';
import * as querystring from 'querystring';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async checkUsername(
    @Body() body: CheckUsernameDto,
  ): Promise<CheckUsernameResponse> {
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

  // @ApiOperation({ summary: 'Login with Kakao' })
  // @ApiResponse({ status: 200, type: SocialLoginResponse })
  // @HttpCode(HttpStatus.OK)
  // @Post('login/kakao')
  // async loginWithKakao(
  //     @Body() dto: loginWithSocialDto,
  // ): Promise<SocialLoginResponse> {
  //     return this.authService.loginWithKakao(dto);
  // }

  @ApiOperation({ summary: 'Login with Naver' })
  @ApiResponse({ status: 200, type: SocialLoginResponse })
  @HttpCode(HttpStatus.OK)
  @Post('login/naver')
  async loginWithNaver(
    @Body() dto: loginWithSocialDto,
  ): Promise<SocialLoginResponse> {
    return this.authService.loginWithNaver(dto);
  }

  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 200, type: SocialLoginResponse })
  @HttpCode(HttpStatus.OK)
  @Post('login/google')
  async loginWithGoogle(
    @Body() dto: loginWithSocialDto,
  ): Promise<SocialLoginResponse> {
    return this.authService.loginWithGoogle(dto);
  }

  @ApiOperation({ summary: 'Login with Apple' })
  @ApiResponse({ status: 200, type: SocialLoginResponse })
  @HttpCode(HttpStatus.OK)
  @Post('login/apple')
  async loginWithApple(
    @Body() dto: loginWithAppleDto,
  ): Promise<SocialLoginResponse> {
    return this.authService.loginWithApple(dto);
  }

  @ApiOperation({ summary: 'Signup with Apple' })
  @ApiResponse({ status: 200, type: SocialLoginResponse })
  @HttpCode(HttpStatus.OK)
  @Post('signup/apple/:id')
  async signupWithApple(@Param('id') id: string): Promise<SocialLoginResponse> {
    return this.authService.signupWithApple(id);
  }

  @ApiOperation({
    summary: 'Find account by phone number',
    description:
      'Initiate account recovery by sending a verification code to the provided phone number.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, type: MessageResponse })
  @Post('find-account')
  async findAccount(@Body() body: VerifyPhoneDto): Promise<MessageResponse> {
    return this.authService.findAccount(body);
  }

  @ApiOperation({
    summary: 'Verify find account code',
    description:
      'Verify the code sent for account recovery and receive a token for password reset.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, type: VerifyFindAccountResponse })
  @Post('verify-find-account')
  async verifyFindAccountCode(
    @Body() body: VerifyCodeDto,
  ): Promise<VerifyFindAccountResponse> {
    return this.authService.verifyFindAccountCode(body);
  }

  @ApiOperation({
    summary: 'Reset password',
    description:
      'Reset the user password using the provided token and new password.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, type: LoginResponse })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto): Promise<LoginResponse> {
    return this.authService.resetPassword(body);
  }

  //testing apple login callback
  // @Post('apple/callback')
  // async appleCallback(@Req() req: Request, @Res() res: Response) {
  //   try {
  //     console.log('apple callback', req.body);

  //     const { code, state, error } = req.body as any;

  //     if (error) {
  //       throw new Error(error);
  //     }

  //     if (!code) {
  //       throw new Error('Authorization code not provided');
  //     }

  //     //   const result = await this.authService.loginWithAppleWeb(code);

  //     // Redirect back to mobile app 
  //     return res.redirect(
  //       `myapp://login-success?accessToken=${'result.accessToken'}&refreshToken=${'result.refreshToken'}`,
  //     );
  //   } catch (err) {
  //     return res.redirect(
  //       `myapp://login-error?message=${encodeURIComponent(err.message)}`,
  //     );
  //   }
  // }

  // @Get('apple/callback') // ✅ Apple calls this endpoint with a GET request
  // async handleAppleCallback(
  //   @Query() queryParams: any, // ✅ Data comes in query parameters
  //   @Res() res: Response
  // ) {
  //   // Log for debugging (optional)
  //   console.log('Apple callback received:', queryParams);

  //   // 1. Extract the crucial parameters from the query
  //   //    The 'user' field is a JSON string, handle it with care
  //   const { code, id_token, state, user } = queryParams;

  //   // 2. Prepare the parameters to pass back to your app
  //   const appParams: any = {
  //     code,
  //     id_token,
  //     state,
  //   };
  //   // Only include the 'user' object if it exists and is valid
  //   if (user) {
  //       try {
  //           // Keep it as a string, the Flutter plugin will decode it
  //           appParams.user = user;
  //       } catch (e) {
  //           console.warn('Could not parse user JSON from Apple:', e);
  //       }
  //   }

  //   // 3. URL-encode the parameters
  //   const encodedParams = querystring.stringify(appParams);

  //   // 4. Construct the Android Intent URL
  //   //    DOUBLE-CHECK your package name is correct!
  //   const intentUrl = `intent://callback?${encodedParams}#Intent;package=com.waterregen.app;scheme=waterregenapp;end`;

  //   console.log('Redirecting to:', intentUrl); // Optional debug log

  //   // 5. Send the HTTP 302 Redirect
  //   res.redirect(HttpStatus.FOUND, intentUrl);
  // }

  @Post('apple/callback')
async appleCallback(@Req() req: Request, @Res() res: Response) {
  const { code, id_token, state, user, error } = req.body as any;

  if (error) {
    return res.redirect(
      `waterregenapp://login-error?message=${encodeURIComponent(error)}`,
    );
  }

  // Build params dynamically
  const params: Record<string, string> = {};

  if (code) params.code = code;
  if (id_token) params.id_token = id_token;
  if (state) params.state = state;
  if (user) params.user = user; // keep raw JSON string

  const encodedParams = new URLSearchParams(params).toString();

  // Android deep link (intent://)
  // const intentUrl =
  //   `intent://callback?${encodedParams}` +
  //   `#Intent;scheme=waterregenapp;package=com.waterregen.app;end`;
  const intentUrl = `intent://callback?${encodedParams}#Intent;package=com.waterregen.app;scheme=waterregenapp;end`;

  return res.redirect(302, intentUrl);
}


}
