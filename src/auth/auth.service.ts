import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CheckUsernameDto,
  FindAccountDto,
  LoginDto,
  loginWithAppleDto,
  loginWithSocialDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignupDto,
  VerifyCodeDto,
  VerifyPhoneDto,
} from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageResponse } from 'src/common/response';
import {
  CheckUsernameResponse,
  LoginResponse,
  SocialLoginResponse,
  VerifyCodeResponse,
  VerifyFindAccountResponse,
} from './response';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { changeExpireInToMillisecond } from 'src/common/utils';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { SmsService } from 'src/sms/sms.service';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
@Injectable()
export class AuthService {
  private jwksClient = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
  });
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly smsService: SmsService,
  ) {}

  async verifyPhone(
    dto: VerifyPhoneDto,
    findAccount: boolean = false,
  ): Promise<MessageResponse> {
    try {
      let code = '123456'; // temporary for testing;
      // if (dto.phoneNumber != '01012345678') { // '01012345678' is a test number so it will have a fixed code
      //   code = Math.floor(100000 + Math.random() * 900000).toString();
      // }
      code = Math.floor(100000 + Math.random() * 900000).toString();

      let verificationRecord = await this.prisma.verificationCode.upsert({
        where: { phoneNumber: dto.phoneNumber },
        update: {
          code: code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        },
        create: {
          phoneNumber: dto.phoneNumber,
          code: code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        },
      });

      // if (dto.phoneNumber != '01012345678') {  // '01012345678' is a test number so it will not send SMS
        // Send SMS with the code
        const sms = await this.smsService.sendOtpSms(dto.phoneNumber, code);
      // }
      return { message: 'Verification code sent' };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async verifyCode(body: VerifyCodeDto): Promise<VerifyCodeResponse> {
    try {
      const verificationRecord = await this.prisma.verificationCode.findUnique({
        where: { phoneNumber: body.phoneNumber },
      });

      if (!verificationRecord) {
        throw new BadRequestException('Invalid phone number');
      }

      if (verificationRecord.code !== body.code) {
        throw new BadRequestException('Invalid verification code');
      }

      if (verificationRecord.expiresAt < new Date()) {
        throw new BadRequestException('Verification code expired');
      }

      // const existingAccount = await this.prisma.user.findUnique({ where: { phoneNumber: body.phoneNumber } });
      // if (existingAccount && existingAccount.status == 'ACTIVE') {
      //     throw new BadRequestException('Phone number already in use');
      // }

      if (body.id) {
        // register with social account
        let checkPhone = await this.prisma.user.findUnique({
          where: { phoneNumber: body.phoneNumber },
        });
        if (checkPhone && checkPhone.status == 'ACTIVE') {
          throw new HttpException('Phone number already in use', 409);
        }
        if (checkPhone && checkPhone.status == 'PENDING') {
          await this.prisma.user.delete({
            where: { id: checkPhone.id },
          });
        }
        let existingUser = await this.prisma.user.findUnique({
          where: { id: body.id },
        });
        if (!existingUser || !existingUser.socialProviderId) {
          throw new NotFoundException('Account not found');
        }
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            phoneNumber: body.phoneNumber,
          },
        });
        await this.prisma.verificationCode.delete({
          where: { phoneNumber: body.phoneNumber },
        });
        return {
          message: 'Phone number verified successfully',
          id: existingUser.id,
        };
      } else {
        // register with normal signup
        let user = await this.prisma.user.upsert({
          where: { phoneNumber: body.phoneNumber },
          create: {
            phoneNumber: body.phoneNumber,
          },
          update: {
            registeredBySocialType: null,
            socialProviderId: null,
            socialEmail: null,
            socialPhoneNumber: null,
          },
        });

        if (user && user.status == 'ACTIVE') {
          throw new HttpException('Phone number already in use', 409);
        }
        await this.prisma.verificationCode.delete({
          where: { phoneNumber: body.phoneNumber },
        });
        return { message: 'Phone number verified successfully', id: user.id };
      }
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async checkUsername(dto: CheckUsernameDto): Promise<CheckUsernameResponse> {
    try {
      let existingAccount = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existingAccount) {
        return { available: false };
      } else {
        return { available: true };
      }
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async signup(dto: SignupDto): Promise<LoginResponse> {
    try {
      let user = await this.prisma.user.findUnique({ where: { id: dto.id } });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      let checkUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (checkUsername) {
        throw new BadRequestException('Username already in use');
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password, salt);
      const updateUser = await this.prisma.user.update({
        where: { id: dto.id },
        data: {
          username: dto.username,
          password: hashedPassword,
          status: 'ACTIVE',
          registeredAt: new Date(),
        },
      });
      if (updateUser.registeredBySocialType && updateUser.socialProviderId) {
        await this.prisma.socialAccount.create({
          data: {
            userId: updateUser.id,
            provider: updateUser.registeredBySocialType,
            providerId: updateUser.socialProviderId,
          },
        });
      }
      let tokens = await this.generateTokens(dto.id);
      return { id: dto.id, ...tokens };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAccount(dto: VerifyPhoneDto) {
    try {
      let user = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber, status: 'ACTIVE' },
      });
      // if (!user) {
      //     throw new NotFoundException('Account not found');
      // }
      return this.verifyPhone({ phoneNumber: dto.phoneNumber }, true);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async verifyFindAccountCode(
    body: VerifyCodeDto,
  ): Promise<VerifyFindAccountResponse> {
    try {
      const verificationRecord = await this.prisma.verificationCode.findUnique({
        where: { phoneNumber: body.phoneNumber },
      });

      if (!verificationRecord) {
        throw new BadRequestException('Invalid phone number');
      }

      if (verificationRecord.code !== body.code) {
        throw new BadRequestException('Invalid verification code');
      }

      if (verificationRecord.expiresAt < new Date()) {
        throw new BadRequestException('Verification code expired');
      }
      // let user = await this.prisma.user.findUnique({ where: { phoneNumber: body.phoneNumber, status:'ACTIVE' } });
      // if (!user) {
      //     throw new NotFoundException('Account not found');
      // }
      let user = await this.prisma.user.upsert({
        where: { phoneNumber: body.phoneNumber },
        create: {
          phoneNumber: body.phoneNumber,
        },
        update: {},
      });

      let passwordChangeRequest =
        await this.prisma.passwordChangeRequest.create({
          data: {
            userId: user.id,
          },
        });
      await this.prisma.verificationCode.delete({
        where: { phoneNumber: body.phoneNumber },
      });
      return {
        hasAccount: user.status === 'ACTIVE' ? true : false,
        id: user.id,
        username: user.username,
        token: user.status === 'ACTIVE' ? passwordChangeRequest?.id : null,
        isRegisteredBySocial: user.registeredBySocialType ? true : false,
        providerType: user.registeredBySocialType,
        providerInfo: user.registeredBySocialType
          ? (user.socialEmail ?? user.socialPhoneNumber ?? null)
          : null,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<LoginResponse> {
    try {
      let { token, id, password } = dto;
      let user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (!user.username && !dto.username) {
        throw new BadRequestException('Username is required');
      }
      if (!user.username && !dto.username) {
        // if username is changing, first check the user is free to be used
        let checkUsername = await this.prisma.user.findUnique({
          where: { username: dto.username },
        });
        if (checkUsername) {
          throw new HttpException('Username already in use', 409);
        }
      }
      const existingRequest = await this.prisma.passwordChangeRequest.findFirst(
        {
          where: { id: token, userId: id },
        },
      );
      if (!existingRequest) {
        throw new BadRequestException('Invalid or expired token');
      }
      const oneHour = 60 * 60 * 1000;
      if (existingRequest.createdAt.getTime() + oneHour < Date.now()) {
        // delete expired token
        await this.prisma.passwordChangeRequest.delete({
          where: { id: existingRequest.id },
        });
        throw new BadRequestException('Invalid or expired token');
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // update user
      await this.prisma.user.update({
        where: { id: id },
        data: {
          password: hashedPassword,
          username: user.username ? undefined : dto.username, // if username is set before, can't be changed
        },
      });

      // delete the token so it can't be used again
      await this.prisma.passwordChangeRequest.delete({
        where: { id: existingRequest.id },
      });
      let tokens = await this.generateTokens(user.id);
      return { id: user.id, ...tokens };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    try {
      let { username, password } = dto;
      let user = await this.prisma.user.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [{ username }, { phoneNumber: username }],
        },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (!user.password) {
        throw new ForbiddenException('Password is not set for this account');
      }
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password || '',
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }
      let tokens = await this.generateTokens(user.id);
      return { id: user.id, ...tokens };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async refreshToken(dto: RefreshTokenDto): Promise<LoginResponse> {
    try {
      const { refreshToken: token } = dto;
      let expireRT = changeExpireInToMillisecond(
        this.config.get('JWT_EXPIRATION_REFRESH') || '1d',
      );

      const refreshToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: token,
        },
      });
      if (!refreshToken) {
        throw new BadRequestException('Invalid token');
      }
      if (refreshToken.expiresAt < new Date()) {
        throw new BadRequestException('Token has expired');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: refreshToken.userId, status: 'ACTIVE' },
      });
      // console.log('Found user for refresh token:', user);
      if (!user) {
        throw new BadRequestException('Account not found');
      }

      const accessToken = await this.signToken(user.id);

      // expand the refresh token's expiration time
      await this.prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: {
          expiresAt: new Date(Date.now() + expireRT),
        },
      });

      return {
        id: user.id,
        accessToken: accessToken,
        refreshToken: token,
      };
    } catch (error) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async signToken(id: string): Promise<string> {
    try {
      let expireAT = this.config.get('JWT_EXPIRATION');
      const secret = this.config.get('JWT_SECRET');
      return await this.jwt.signAsync(
        { id },
        {
          expiresIn: expireAT,
          secret,
        },
      );
    } catch (error) {
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async generateTokens(id: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      let expireRT = changeExpireInToMillisecond(
        this.config.get('JWT_EXPIRATION_REFRESH') || '1d',
      );

      //generate refreshToken with uuid
      const refreshToken = uuidv4();

      //save refreshToken in db
      const token = await this.prisma.refreshToken.upsert({
        where: {
          userId: id,
        },
        create: {
          userId: id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + expireRT),
        },
        update: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + expireRT),
        },
      });

      //sign accessToken with jwt
      const accessToken = await this.signToken(id);

      // return accessToken and refreshToken
      return {
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async loginWithKakao(dto: loginWithSocialDto): Promise<SocialLoginResponse> {
    try {
      let token = { accessToken: '', refreshToken: '' };
      const accessToken = dto.accessToken?.replace('Bearer ', '');
      if (!accessToken) {
        throw new BadRequestException('Please provide kakao access token');
      }
      const kakaoUser = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // console.log("Kakao user: ", kakaoUser);
      if (!kakaoUser) {
        throw new NotFoundException("We couldn't verify your kakao account");
      }

      const { id } = kakaoUser.data;
      // console.log(id, typeof id);
      let user = await this.prisma.user.findFirst({
        where: {
          socialAccount: {
            some: {
              providerId: id.toString(),
              provider: 'KAKAO',
            },
          },
        },
      });
      if (!user) {
        // throw new NotFoundException("You haven't connected your account");
        //create an account if not found
        user = await this.prisma.user.create({
          data: {
            status: 'PENDING',
            registeredBySocialType: 'KAKAO',
            socialProviderId: id.toString(),
            socialEmail: dto.email,
            socialPhoneNumber: dto.phoneNumber,
          },
        });

        return {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          id: user.id,
          isNewUser: true,
        };
      } else {
        token = await this.generateTokens(user.id);

        return {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          id: user.id,
          isNewUser: false,
        };
      }
    } catch (error) {
      console.log(error.message);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async loginWithNaver(dto: loginWithSocialDto): Promise<SocialLoginResponse> {
    try {
      let token = { accessToken: '', refreshToken: '' };
      const accessToken = dto.accessToken?.replace('Bearer ', '');
      // console.log(accessToken);
      if (!accessToken) {
        throw new BadRequestException('Access token required');
      }
      const userResponse = await axios.get(
        'https://openapi.naver.com/v1/nid/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      // console.log(userResponse);
      if (!userResponse) {
        throw new NotFoundException("We couldn't verify your naver account");
      }
      const { response: user } = userResponse.data;
      const id = user.id;

      let localUser = await this.prisma.user.findFirst({
        where: {
          socialAccount: {
            some: {
              providerId: id,
              provider: 'NAVER',
            },
          },
        },
      });
      if (!localUser) {
        // throw new NotFoundException("You haven't connected your account");
        //create an account if not found
        localUser = await this.prisma.user.create({
          data: {
            status: 'PENDING',
            registeredBySocialType: 'NAVER',
            socialProviderId: id,
            socialEmail: dto.email,
            socialPhoneNumber: dto.phoneNumber,
          },
        });

        return {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          id: localUser.id,
          isNewUser: true,
        };
      }
      token = await this.generateTokens(localUser.id);
      return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        id: localUser.id,
        isNewUser: false,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async loginWithGoogle(dto: loginWithSocialDto): Promise<SocialLoginResponse> {
    try {
      let token = { accessToken: '', refreshToken: '' };
      const googleAccessToken = dto.accessToken?.replace('Bearer ', '');
      if (!googleAccessToken) {
        throw new BadRequestException('Access token is required');
      }

      // Verify token with Google
      const googleResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        },
      );

      const { sub: providerId } = googleResponse.data;
      if (!providerId) {
        throw new BadRequestException('Invalid Google token');
      }
      let localUser = await this.prisma.user.findFirst({
        where: {
          socialAccount: {
            some: {
              providerId: providerId,
              provider: 'GOOGLE',
            },
          },
        },
      });

      if (!localUser) {
        //throw new NotFoundException("You haven't connected your account");
        //create an account if not found
        localUser = await this.prisma.user.create({
          data: {
            status: 'PENDING',
            registeredBySocialType: 'GOOGLE',
            socialProviderId: providerId,
            socialEmail: dto.email,
            socialPhoneNumber: dto.phoneNumber,
          },
        });

        return {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          id: localUser.id,
          isNewUser: true,
        };
      }
      token = await this.generateTokens(localUser.id);
      return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        id: localUser.id,
        isNewUser: false,
      };
    } catch (error) {
      console.log('Google sso login:', error.message);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  private async getAppleSigningKey(kid: string): Promise<string> {
    try {
      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      //throw new Error(`Failed to get Apple signing key: ${error.message}`);
      console.log(`Failed to get Apple signing key: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async loginWithApple(dto: loginWithAppleDto): Promise<SocialLoginResponse> {
    try {
      let token = { accessToken: '', refreshToken: '' };
      if (!dto.identityToken) {
        throw new BadRequestException('Identity token is required');
      }

      // Decode token header to get key ID
      const decodedToken = jwt.decode(dto.identityToken, { complete: true });
      if (!decodedToken) {
        throw new BadRequestException('Invalid identity token format');
      }

      const { header, payload } = decodedToken as any;

      if (!header?.kid) {
        throw new BadRequestException('Missing key ID in token header');
      }

      // Get Apple's public key
      const publicKey = await this.getAppleSigningKey(header.kid);

      // Verify the token signature and claims
      const verifiedToken = jwt.verify(dto.identityToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_BUNDLE_ID, // Your app's bundle ID
      }) as any;
      let localUser = await this.prisma.user.findFirst({
        where: {
          socialAccount: {
            some: {
              providerId: verifiedToken.sub,
              provider: 'APPLE',
            },
          },
        },
      });
      if (!localUser) {
        // throw new NotFoundException("You haven't connected your account");

        //create an account if not found
        localUser = await this.prisma.user.create({
          data: {
            status: 'PENDING',
            registeredBySocialType: 'APPLE',
            socialProviderId: verifiedToken.sub,
            socialEmail: dto.email,
            socialPhoneNumber: dto.phoneNumber,
          },
        });

        return {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          id: localUser.id,
          isNewUser: true,
        };
      }
      token = await this.generateTokens(localUser.id);
      return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        id: localUser.id,
        isNewUser: false,
      };
    } catch (error) {
      console.log(`Apple identity token verification failed: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async signupWithApple(id: string): Promise<SocialLoginResponse> {
    try {
      let token = { accessToken: '', refreshToken: '' };
      let user = await this.prisma.user.findUnique({
        where: { id, status: 'PENDING', registeredBySocialType: 'APPLE' },
      });
      if (!user || !user.socialProviderId) {
        throw new NotFoundException('Account not found');
      }
      //create an account if not found
      const updateUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          registeredAt: new Date(),
          socialAccount: {
            create: {
              provider: 'APPLE',
              providerId: user.socialProviderId,
            },
          },
        },
      });
      token = await this.generateTokens(updateUser.id);
      return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        id: updateUser.id,
        isNewUser: true,
      };
    } catch (error) {
      console.log(`Apple identity token verification failed: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
