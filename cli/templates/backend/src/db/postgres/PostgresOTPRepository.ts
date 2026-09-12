import { PrismaClient } from '@prisma/client';
import { IOTPRepository, AuthOTP, CreateOTPInput } from '../types';

function mapPrismaOtpToAuthOTP(o: any): AuthOTP {
  return {
    id: o.id,
    userId: o.userId || null,
    email: o.email,
    tokenHash: o.tokenHash,
    purpose: o.purpose as 'verification' | 'reset-password',
    expiresAt: o.expiresAt,
    attempts: o.attempts,
    createdAt: o.createdAt,
  };
}

export class PostgresOTPRepository implements IOTPRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateOTPInput): Promise<AuthOTP> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const otp = await this.prisma.otp.create({
      data: {
        userId: data.userId || null,
        email: normalizedEmail,
        tokenHash: data.tokenHash,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        attempts: data.attempts ?? 0,
      },
    });
    return mapPrismaOtpToAuthOTP(otp);
  }

  async findActive(email: string, purpose: 'verification' | 'reset-password'): Promise<AuthOTP | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const otp = await this.prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
      },
      orderBy: { createdAt: 'desc' },
    });
    return otp ? mapPrismaOtpToAuthOTP(otp) : null;
  }

  async incrementAttempts(id: string): Promise<AuthOTP | null> {
    try {
      const otp = await this.prisma.otp.update({
        where: { id },
        data: { attempts: { increment: 1 } },
      });
      return mapPrismaOtpToAuthOTP(otp);
    } catch {
      return null;
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.otp.delete({
        where: { id },
      });
    } catch {
      // Ignored if already deleted
    }
  }

  async deleteByEmail(email: string, purpose?: 'verification' | 'reset-password'): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const whereClause: any = { email: normalizedEmail };
    if (purpose) whereClause.purpose = purpose;
    await this.prisma.otp.deleteMany({
      where: whereClause,
    });
  }
}
