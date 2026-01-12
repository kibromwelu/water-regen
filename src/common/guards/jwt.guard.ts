import { UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export class JwtGuard extends AuthGuard('jwt'){
    handleRequest(err, user, info) {
        if (err || !user) {
          if (info?.name === 'TokenExpiredError') {
            throw new UnauthorizedException('Token expired');
          } else if (info?.name === 'JsonWebTokenError') {
            throw new UnauthorizedException('Invalid token');
          } else {
            throw new UnauthorizedException('Unauthorized');
          }
        }
        return user;
      }
}