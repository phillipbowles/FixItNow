import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw an error when there's no token
  handleRequest(err: any, user: any) {
    // If there's an error or no user, just return null
    // This allows the request to continue without authentication
    if (err || !user) {
      return null;
    }
    return user;
  }
}
