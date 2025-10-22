import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CheckUsernameDto, LoginDto, RefreshTokenDto, SignupDto, VerifyCodeDto, VerifyPhoneDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageResponse } from 'src/common/response';
import { CheckUsernameResponse, LoginResponse, VerifyCodeResponse } from './response';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { changeExpireInToMillisecond } from 'src/common/utils';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { SmsService } from 'src/sms/sms.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly jwt: JwtService,
        private readonly smsService: SmsService,
    ) { }

    async verifyPhone(dto: VerifyPhoneDto): Promise<MessageResponse> {
        // throw new Error('Method not implemented.');
        try {
            let existingAccount = await this.prisma.user.findUnique({ where: { phoneNumber: dto.phoneNumber } });
            if (existingAccount) {
                throw new HttpException('Phone number already in use', 400)
            }

            //const code = Math.floor(100000 + Math.random() * 900000).toString();
            const code = '123456'; // temporary for testing

            let verificationRecord = await this.prisma.verificationCode.upsert({
                where: { phoneNumber: dto.phoneNumber },
                update: { 
                    code: code, 
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now 
                    },
                create: {
                    phoneNumber: dto.phoneNumber,
                    code: code,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
                }
            });

            // Send SMS with the code
            //const sms = await this.smsService.sendOtpSms(dto.phoneNumber, code)
            
            return { message: 'Verification code sent' };

        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async verifyCode(body: VerifyCodeDto): Promise<VerifyCodeResponse> {
        try {

            const verificationRecord = await this.prisma.verificationCode.findUnique({
                where: { phoneNumber: body.phoneNumber }
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

            let user = await this.prisma.user.create({
                data: {
                    phoneNumber: body.phoneNumber
                }
            });
            await this.prisma.verificationCode.delete({
                where: { phoneNumber: body.phoneNumber }
            });

            return { message: 'Phone number verified successfully', id: user.id };

        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }
    async checkUsername(dto: CheckUsernameDto): Promise<CheckUsernameResponse> {
        try {
            let existingAccount = await this.prisma.user.findUnique({ where: { username: dto.username } });
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
            let checkUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
            if (checkUsername) {
                throw new BadRequestException('Username already in use');
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(dto.password, salt);
            await this.prisma.user.update({
                where: { id: dto.id },
                data: {
                    username: dto.username,
                    password: hashedPassword,
                    status: 'ACTIVE'
                }
            });
            let tokens = await this.generateTokens(dto.id);
            return { id: dto.id, ...tokens };

        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }

    async login(dto: LoginDto): Promise<LoginResponse> {
        try {
            let { username, password } = dto;
            let user = await this.prisma.user.findFirst({ where: { OR: [{ username }, { phoneNumber: username }] } });
            if (!user) {
                throw new BadRequestException('User not found');
            }
            const isPasswordValid = await bcrypt.compare(password, user.password || '');
            if (!isPasswordValid) {
                throw new BadRequestException('Invalid password');
            }
            let tokens = await this.generateTokens(user.id);
            return { id: user.id, ...tokens };
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }

    async refreshToken(
        dto: RefreshTokenDto
    ): Promise<LoginResponse> {
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
    async signToken(
        id: string,
    ): Promise<string> {
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

    async generateTokens(
        id: string,
    ): Promise<{
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

    async loginWithKakao(kakaoToken: string): Promise<LoginResponse> {
        try {
            let token = { accessToken: '', refreshToken: '' };
            const accessToken = kakaoToken?.replace('Bearer ', '');
            if (!accessToken) {
                throw new UnauthorizedException('Please provide kakao access token');
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
                throw new NotFoundException("You haven't connected your account");
            } else {

                if (user.status == 'ACTIVE') {
                    token = await this.generateTokens(user.id)
                }


                return {
                    accessToken: token.accessToken,
                    refreshToken: token.refreshToken,
                    id: user.id
                };
            }
        } catch (error) {
            console.log(error.message);
            throw new HttpException(error.message, error.status || 500);
        }
    }

    async loginWithNaver(naverToken: string): Promise<LoginResponse> {
        try {
            let token = { accessToken: '', refreshToken: '' };
            const accessToken = naverToken?.replace('Bearer ', '');
            // console.log(accessToken);
            if (!accessToken) {
                throw new UnauthorizedException('Access token required');
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
            console.log('User naver id: ', user.id, id);
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
                throw new NotFoundException("You haven't connected your account");
            }
            token = await this.generateTokens(localUser.id);
            return {
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                id: localUser.id
            };

        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }

}
