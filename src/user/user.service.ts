import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { MessageResponse } from 'src/common/response';
import {
  ChangePasswordDto,
  SendVerficationCodeDto,
  VerifyVerifcationCodeDto,
} from './dto';
import { GetProfileResponse, VerifyPasswordChangeResponse } from './response';
import axios from 'axios';
import { SmsService } from 'src/sms/sms.service';

@Injectable()
export class UserService {
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
        where: { phoneNumber },
      });
      if (
        (!existingUser || existingUser.id != userId) &&
        type === 'CHANGE_PASSWORD'
      ) {
        throw new BadRequestException('No user with this phone number');
      }

      if (existingUser && type === 'CHANGE_PHONE') {
        if (existingUser.id === userId) {
          throw new BadRequestException('This is your current phone number');
        } else {
          if (existingUser.status == 'PENDING') {
            // delete the pending user and proceed
            await this.prisma.user.delete({
              where: { id: existingUser.id },
            });
          } else {
            // active user with the phone number exists
            throw new BadRequestException('Phone number already in use');
          }
        }
      }

      //const code = Math.floor(100000 + Math.random() * 900000).toString();
      const code = '123456'; // temporary for testing

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

      // TODO: send SMS
      //const sms = await this.smsService.sendOtpSms(phoneNumber, code)

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

  async linkKakao(token: string, userId: string) {
    try {
      const accessToken = token?.replace('Bearer ', '');
      // console.log("Access token: ", accessToken);
      if (!accessToken) {
        throw new UnauthorizedException('Access token required');
      }
      let user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
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
        throw new UnauthorizedException('Access token required');
      }
      let localUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      // console.log("local user: ", localUser);
      if (!localUser) {
        throw new NotFoundException('User not found');
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
        throw new UnauthorizedException('Access token is required');
      }

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
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
        throw new UnauthorizedException('Invalid Google token');
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
          'Google account is linked to another user',
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
      console.error('Google linking error:', error.message);
      throw new HttpException(
        error.response?.data?.error_description || error.message,
        error.response?.status || 500,
      );
    }
  }
}
