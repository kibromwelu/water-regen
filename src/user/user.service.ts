import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { MessageResponse } from 'src/common/response';
import {
  changePasswordDto,
  sendVerficationCodeDto,
  VerifyVerifcationCodeDto,
} from './dto';
import { GetProfileResponse, VerifyPasswordChangeResponse } from './response';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
    { phoneNumber, type }: sendVerficationCodeDto,
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
          throw new BadRequestException(
            'No user with this phone number',
          );
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
    { token, password }: changePasswordDto,
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
}
