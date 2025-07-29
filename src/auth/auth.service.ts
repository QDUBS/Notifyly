import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateJwtToken(
    userId: string,
    roles: string[] = ['user'],
  ): Promise<string> {
    const payload = { sub: userId, roles };
    return this.jwtService.sign(payload);
  }

  async validateUser(payload: any): Promise<any> {
    return { userId: payload.sub, roles: payload.roles };
  }
}
