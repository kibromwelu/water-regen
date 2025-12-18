import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { MessageResponse } from 'src/common/response';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

import {
  ChangePasswordDto,
  GetUsersListDto,
  LogoutDto,
  SendVerficationCodeDto,
  SetUsernameDto,
  VerifyVerifcationCodeDto,
} from './dto';
import {
  GetProfileResponse,
  GetUserRoleResponse,
  VerifyPasswordChangeResponse,
  GetUserslistResponse,
  GetUserDropdownResponse,
} from './response';
import axios from 'axios';
import { SmsService } from 'src/sms/sms.service';
import { SocialAccountProvider, UserRole } from '@prisma/client';
import { InfiniteScroll } from 'src/common/dto';

@Injectable()
export class UserService {
  private jwksClient = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
  });
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  async getUserProfile(userId: string): Promise<GetProfileResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          socialAccount: {
            select: {
              provider: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Extract connected provider names
      const connectedProviders = user.socialAccount.map((acc) => acc.provider);

      return {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        linkedSocialAccount: {
          GOOGLE: connectedProviders.includes('GOOGLE'),
          APPLE: connectedProviders.includes('APPLE'),
          KAKAO: connectedProviders.includes('KAKAO'),
          NAVER: connectedProviders.includes('NAVER'),
        },
        isAdmin: user.role === 'ADMIN',
        isRegisteredBySocial: user.registeredBySocialType ? true : false,
        isPasswordSet: !!user.password,
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async sendVerficationCode(
    userId: string,
    { phoneNumber, type }: SendVerficationCodeDto,
  ): Promise<MessageResponse> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (
        (!existingUser || existingUser.phoneNumber != phoneNumber) &&
        type === 'CHANGE_PASSWORD'
      ) {
        throw new BadRequestException('No user with this phone number');
      }

      if (existingUser && type === 'CHANGE_PHONE') {
        if (existingUser.phoneNumber === phoneNumber) {
          throw new BadRequestException('This is your current phone number');
        } else {
          if (existingUser.status == 'PENDING') {
            // delete the pending user and proceed
            await this.prisma.user.delete({
              where: { id: existingUser.id },
            });
          } else {
            // active user with the phone number exists
            //throw new BadRequestException('Phone number already in use');
          }
        }
      }

      let code = '123456'; // temporary for testing;
      // if (phoneNumber != '01012345678') {
      //   // '01012345678' is a test number so it will have a fixed code
      //   code = Math.floor(100000 + Math.random() * 900000).toString();
      // }
            
      code = Math.floor(100000 + Math.random() * 900000).toString();

      // save verification code
      const verification = await this.prisma.verificationCode.upsert({
        where: { phoneNumber: phoneNumber },
        create: {
          phoneNumber: phoneNumber,
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        update: {
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      // if (phoneNumber != '01012345678') {
      //   // '01012345678' is a test number so it will not send SMS
        // Send SMS with the code
        const sms = await this.smsService.sendOtpSms(phoneNumber, code);
      // }

      return {
        message: 'Verification code sent',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async changePhoneNumber(
    userId: string,
    { phoneNumber, code }: VerifyVerifcationCodeDto,
  ): Promise<MessageResponse> {
    try {
      const verification = await this.prisma.verificationCode.findUnique({
        where: { phoneNumber },
      });

      if (
        !verification ||
        !verification.expiresAt ||
        verification.code !== code
      ) {
        throw new BadRequestException('Invalid verification code');
      }

      if (verification.expiresAt < new Date()) {
        throw new BadRequestException('Verification code expired');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { phoneNumber, status: 'ACTIVE' },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new HttpException('Phone number already in use', 409);
      }

      // update user phone number
      await this.prisma.user.update({
        where: { id: userId },
        data: { phoneNumber },
      });

      // delete verification code
      await this.prisma.verificationCode.delete({
        where: { phoneNumber },
      });

      return {
        message: 'Phone number updated',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async verifyPasswordChangeRequest(
    userId: string,
    { phoneNumber, code }: VerifyVerifcationCodeDto,
  ): Promise<VerifyPasswordChangeResponse> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId, phoneNumber },
      });
      if (!existingUser) {
        throw new BadRequestException('No user with this phone number');
      }

      const verification = await this.prisma.verificationCode.findUnique({
        where: { phoneNumber },
      });

      if (
        !verification ||
        !verification.expiresAt ||
        verification.code !== code
      ) {
        throw new BadRequestException('Invalid verification code');
      }

      if (verification.expiresAt < new Date()) {
        throw new BadRequestException('Verification code expired');
      }

      // create password change token
      const token = await this.prisma.passwordChangeRequest.create({
        data: { userId },
      });

      // delete verification code
      await this.prisma.verificationCode.delete({
        where: { phoneNumber },
      });

      return {
        message: 'code verified',
        token: token.id,
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async changePassword(
    userId: string,
    { token, password }: ChangePasswordDto,
  ): Promise<MessageResponse> {
    try {
      const existingRequest = await this.prisma.passwordChangeRequest.findFirst(
        {
          where: { id: token, userId },
        },
      );
      if (!existingRequest) {
        throw new BadRequestException('Invalid or expired token');
      }

      // check token expiry (1 hour)
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
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });

      // delete the token so it can't be used again
      await this.prisma.passwordChangeRequest.delete({
        where: { id: existingRequest.id },
      });

      return {
        message: 'password has been successfuly changed',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async deleteUser(userId: string): Promise<MessageResponse> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!existingUser) {
        throw new BadRequestException('User not found');
      }

      // delete user and all related data
      await this.prisma.user.delete({
        where: { id: userId },
      });

      return {
        message: 'Account has been deleted.',
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async logout(id: string, dto: LogoutDto): Promise<MessageResponse> {
    try {
      console.log('logout', id, dto.fcmToken);

      const existingUser = await this.prisma.user.findFirst({
        where: { id },
      });
      if (!existingUser) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      const deleted = await this.prisma.fcmToken.deleteMany({
        where: {
          userId: id,
          token: dto.fcmToken,
        },
      });

      return { message: 'Account successfully logged out.' };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async setUsername(
    userId: string,
    dto: SetUsernameDto,
  ): Promise<MessageResponse> {
    try {
      let user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (user.username) {
        throw new BadRequestException('User already set its username');
      }
      let checkUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (checkUsername) {
        throw new BadRequestException('Username already in use');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          username: dto.username,
        },
      });

      return { message: 'Username set successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async linkKakao(token: string, userId: string) {
    try {
      const accessToken = token?.replace('Bearer ', '');
      // console.log("Access token: ", accessToken);
      if (!accessToken) {
        throw new BadRequestException('Access token required');
      }
      let user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.registeredBySocialType) {
        throw new ForbiddenException(
          'Account created by social provider is not alloed to link other social provoders',
        );
      }
      const kakaoUser = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // console.log("Kakao user: ", kakaoUser);
      if (!kakaoUser) {
        throw new NotFoundException("We couldn't verify your kakao account");
      }

      const { id } = kakaoUser.data;
      // console.log(id);
      let existingAccount = await this.prisma.socialAccount.findFirst({
        where: { provider: 'KAKAO', providerId: id.toString() },
      });
      if (existingAccount && existingAccount.userId == userId) {
        throw new BadRequestException(
          'You have already connected kakao before!',
        );
      } else if (existingAccount && existingAccount.userId !== userId) {
        throw new BadRequestException(
          "Account is already linked with someone's account",
        );
      }
      let account = await this.prisma.socialAccount.create({
        data: {
          providerId: id.toString(),
          provider: 'KAKAO',
          userId,
        },
      });
      // console.log(account);
      return {
        message: 'You have successfully connected your kakao account!',
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async linkNaver(token: string, userId: string) {
    try {
      const accessToken = token?.replace('Bearer ', '');
      // console.log(accessToken);
      if (!accessToken) {
        throw new BadRequestException('Access token required');
      }
      let localUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      // console.log("local user: ", localUser);
      if (!localUser) {
        throw new NotFoundException('User not found');
      }
      if (localUser.registeredBySocialType) {
        throw new ForbiddenException(
          'Account created by social provider is not alloed to link other social provoders',
        );
      }
      const userResponse = await axios.get(
        'https://openapi.naver.com/v1/nid/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const { response: user } = userResponse.data;
      const id = user.id;
      let existingAccount = await this.prisma.socialAccount.findFirst({
        where: {
          providerId: id,
          provider: 'NAVER',
        },
        include: { user: true },
      });
      if (existingAccount && existingAccount.userId == userId) {
        throw new BadRequestException(
          'You have already connected Naver account before!',
        );
      } else if (existingAccount && existingAccount.userId !== userId) {
        throw new BadRequestException(
          "Account is already linked with someone's account",
        );
      }
      await this.prisma.socialAccount.create({
        data: {
          providerId: id,
          provider: 'NAVER',
          userId,
        },
      });

      return {
        message: 'Naver account connected successfully',
      };
    } catch (error) {
      // throw new UnauthorizedException('Invalid Naver token');
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async linkGoogle(token: string, userId: string) {
    try {
      const accessToken = token?.replace('Bearer ', '');
      if (!accessToken) {
        throw new BadRequestException('Access token is required');
      }

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.registeredBySocialType) {
        throw new ForbiddenException(
          'Account created by social provider is not alloed to link other social provoders',
        );
      }

      // Verify token with Google
      const googleResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const { sub: providerId, email } = googleResponse.data;
      if (!providerId) {
        throw new BadRequestException('Invalid Google token');
      }

      const existingAccount = await this.prisma.socialAccount.findFirst({
        where: { provider: 'GOOGLE', providerId },
      });
      if (existingAccount) {
        if (existingAccount.userId === userId) {
          throw new BadRequestException(
            'Google account already linked to this user',
          );
        }
        throw new BadRequestException(
          "Account is already linked with someone's account",
        );
      }

      await this.prisma.socialAccount.create({
        data: {
          providerId,
          provider: 'GOOGLE',
          userId,
        },
      });

      return { message: 'Google account connected successfully' };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  private async getAppleSigningKey(kid: string): Promise<string> {
    try {
      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      throw new Error(`Failed to get Apple signing key: ${error.message}`);
    }
  }

  async connectWithApple(identityToken: string, userId: string) {
    try {
      if (!identityToken) {
        throw new Error('Identity token is required');
      }
      let user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.registeredBySocialType) {
        throw new ForbiddenException(
          'Account created by social provider is not alloed to link other social provoders',
        );
      }

      // Decode token header to get key ID
      const decodedToken = jwt.decode(identityToken, { complete: true });
      if (!decodedToken) {
        throw new Error('Invalid identity token format');
      }

      const { header, payload } = decodedToken as any;

      if (!header?.kid) {
        throw new Error('Missing key ID in token header');
      }

      // Get Apple's public key
      const publicKey = await this.getAppleSigningKey(header.kid);

      // Verify the token signature and claims
      const verifiedToken = jwt.verify(identityToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_BUNDLE_ID, // Your app's bundle ID
      }) as any;
      let existingAccount = await this.prisma.socialAccount.findFirst({
        where: { provider: 'APPLE', providerId: verifiedToken.sub },
      });
      if (existingAccount && existingAccount.userId == userId) {
        throw new BadRequestException(
          'You have already connected Apple account before!',
        );
      } else if (existingAccount && existingAccount.userId !== userId) {
        throw new BadRequestException(
          "Account is already linked with someone's account",
        );
      }
      let newAccount = await this.prisma.socialAccount.create({
        data: {
          providerId: verifiedToken.sub,
          provider: 'APPLE',
          userId,
        },
      });
      return { message: 'Apple account connected successfully' };
      // return {
      //   email: verifiedToken.email,
      //   sub: verifiedToken.sub,
      //   email_verified: verifiedToken.email_verified === 'true' || verifiedToken.email_verified === true,
      //   is_private_email: verifiedToken.is_private_email === 'true' || verifiedToken.is_private_email === true,
      // };
    } catch (error) {
      //throw new Error(`Apple identity token verification failed: ${error.message}`);
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async disconnectSocialAccount(
    provider: SocialAccountProvider,
    userId: string,
  ) {
    try {
      const existingAccount = await this.prisma.socialAccount.findFirst({
        where: { userId, provider },
        include: { user: true },
      });
      if (!existingAccount) {
        throw new NotFoundException(
          `No linked ${provider} account found for this user`,
        );
      }
      if (existingAccount.user.registeredBySocialType) {
        throw new ForbiddenException(
          'Account created by social provider is not alloed to unlink its social provoder',
        );
      }

      // if (existingAccount.user.registeredBySocialType === provider) {
      //   throw new BadRequestException(
      //     `Cannot disconnect the only linked social account used for registration`,
      //   );
      // }

      await this.prisma.socialAccount.delete({
        where: { id: existingAccount.id },
      });

      return {
        message: `Account disconnected successfully`,
        provider: provider,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  // Admin Functions
  async getUsersList(
    dto: GetUsersListDto,
    userId: string,
    pagination: InfiniteScroll,
  ): Promise<GetUserslistResponse> {
    try {
      const { limit, cursor } = pagination;

      // Base conditions
      const where: any = {
        status: 'ACTIVE',
        id: { not: userId },
        username: { not: null },
      };

      const myDataCondition: any = {
        status: 'ACTIVE',
        id: userId,
        // username: { not: null },
      };

      const countCondition: any = {
        status: 'ACTIVE',
        username: { not: null },
      };

      // Apply search logic once
      const applySearch = (obj: any) => {
        obj.OR = [
          { username: { contains: dto.search, mode: 'insensitive' } },
          { phoneNumber: { contains: dto.search, mode: 'insensitive' } },
        ];
      };

      if (dto.search) {
        applySearch(where);
        applySearch(myDataCondition);
        applySearch(countCondition);
      }

      // Fetch my own user data on first load
      const myData = !cursor
        ? await this.prisma.user.findUnique({
            where: myDataCondition,
            select: {
              id: true,
              username: true,
              phoneNumber: true,
              createdAt: true,
              registeredAt: true,
              tanks: true,
            },
          })
        : null;

      // Adjust take: if myData exists, reserve one slot
      const take = myData ? limit - 1 : limit;

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          phoneNumber: true,
          createdAt: true,
          registeredAt: true,
          tanks: true,
        },
        take,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      // Prepend myData for first page
      if (myData) {
        users.unshift(myData);
      }

      const totalCount = await this.prisma.user.count({
        where: countCondition,
      });

      return {
        users: users.map((u) => ({
          id: u.id,
          username: u.username,
          phoneNumber: u.phoneNumber,
          createdAt: u.registeredAt,
          hasTank: u.tanks.length > 0,
        })),
        total: totalCount,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUserRole(
    id: string,
    role: UserRole = UserRole.ADMIN,
  ): Promise<GetUserRoleResponse> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      if (!existingUser.username) {
        throw new BadRequestException('User must have username to purfome this action.');
      }

      const user = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          role,
        },
      });

      return {
        role: user.role,
      };
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }

  async getUsersDropdown(
    dto: GetUsersListDto,
  ): Promise<GetUserDropdownResponse[]> {
    try {
      let where: any = {
        status: 'ACTIVE',
      };

      if (dto.search) {
        // Apply search filter to username
        where.username = { contains: dto.search, mode: 'insensitive' };
      }

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return users;
    } catch (error) {
      // Handle any errors
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(error.message, statusCode);
    }
  }
}
