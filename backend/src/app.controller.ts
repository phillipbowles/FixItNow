import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('debug/config')
  debugConfig() {
    return {
      jwtSecret: this.configService.get('JWT_SECRET') ? 'SET' : 'NOT SET',
      jwtExpiresIn: this.configService.get('JWT_EXPIRES_IN'),
      nodeEnv: this.configService.get('NODE_ENV'),
    };
  }

  @Get('test-auth')
  @UseGuards(AuthGuard('jwt'))
  testAuth(@Request() req) {
    console.log('test-auth endpoint reached!');
    return { message: 'Auth works!', user: req.user };
  }
}
