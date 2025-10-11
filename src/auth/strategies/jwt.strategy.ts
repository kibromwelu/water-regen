import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
    private readonly prisma: PrismaService
  ) {
    const secret = config.get<string>('JWT_SECRET');
if (!secret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { id: string; role: string, permission: string }) {

    let user = await this.prisma.user.findUnique({ where: { id: payload.id } })
      if (!user) {
        throw new UnauthorizedException("Invalid access token")
      }
    return {
      id: payload.id,
    };
  }
}
