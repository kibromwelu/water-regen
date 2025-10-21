import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Replace with your own validation logic
    const validUsername = process.env.BASIC_AUTH_USER ;
    const validPassword = process.env.BASIC_AUTH_PASS ;

    if (username === validUsername && password === validPassword) {
      return true;
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
