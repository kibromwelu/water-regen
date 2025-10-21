import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { getRealId } from '../utils';

@Injectable()
export class BasicAuthGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    const body = request.body;
    let dbTankerId = getRealId(body.tankerId);

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Lookup user in your database
    const user = await this.prisma.user.findUnique({
      where: { username }, 
      include: { tanks: {where:{tankerId:dbTankerId}} },
    });

    if (!user || user.password === null) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare hashed password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (user.tanks.length === 0) {
      throw new UnauthorizedException('No access to the specified tankerId');
    }

    return true;

    // const validUsername = process.env.BASIC_AUTH_USER ;
    // const validPassword = process.env.BASIC_AUTH_PASS ;

    // if (username === validUsername && password === validPassword) {
    //   return true;
    // }

    // throw new UnauthorizedException('Invalid credentials');
  }
}
