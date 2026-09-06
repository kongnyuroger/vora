import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import type { AuthSession, RequestOtpResponse } from '@vora/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from './auth.mapper';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpStore } from './otp.store';

const OTP_TTL_MS = 5 * 60 * 1000;

export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpStore: OtpStore,
    private readonly jwtService: JwtService,
  ) {}

  requestOtp(dto: RequestOtpDto): RequestOtpResponse {
    if (dto.role === Role.ADMIN) {
      throw new BadRequestException('Cannot self-register as admin');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.otpStore.set(dto.phone, code, OTP_TTL_MS, dto.role);

    // Dev mode only: log and echo the OTP instead of sending real SMS.
    this.logger.log(`OTP for ${dto.phone}: ${code}`);

    return {
      phone: dto.phone,
      expiresInS: OTP_TTL_MS / 1000,
      devOtp: code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthSession> {
    const { valid, role } = this.otpStore.check(dto.phone, dto.otp);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {},
      create: { phone: dto.phone, role: role ?? Role.RIDER },
    });

    // Only burn the code once login has actually succeeded — a
    // transient failure below (e.g. the database being unreachable)
    // must not invalidate an otherwise-correct code.
    this.otpStore.consume(dto.phone);

    const accessToken = await this.signToken(user.id, user.phone, user.role);
    return { accessToken, user: toPublicUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return toPublicUser(user);
  }

  private signToken(sub: string, phone: string, role: Role) {
    const payload: JwtPayload = { sub, phone, role };
    return this.jwtService.signAsync(payload);
  }
}
