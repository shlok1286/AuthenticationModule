import { PrismaClient } from '@prisma/client';
import { IDatabaseAdapter, IUserRepository, IOTPRepository, DatabaseProvider } from '../types';
import { PostgresUserRepository } from './PostgresUserRepository';
import { PostgresOTPRepository } from './PostgresOTPRepository';

export class PostgresAdapter implements IDatabaseAdapter {
  readonly provider: DatabaseProvider = 'postgresql';
  private prisma: PrismaClient;
  private userRepo: PostgresUserRepository;
  private otpRepo: PostgresOTPRepository;
  private connected = false;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
    this.userRepo = new PostgresUserRepository(this.prisma);
    this.otpRepo = new PostgresOTPRepository(this.prisma);
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      await this.prisma.$queryRaw`SELECT 1`;
      this.connected = true;
      console.log('Successfully connected to PostgreSQL via Prisma');
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getHealth(): Promise<{ status: string; provider: DatabaseProvider; connected: boolean }> {
    try {
      if (!this.connected) {
        return { status: 'disconnected', provider: 'postgresql', connected: false };
      }
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', provider: 'postgresql', connected: true };
    } catch {
      this.connected = false;
      return { status: 'error', provider: 'postgresql', connected: false };
    }
  }

  getUserRepository(): IUserRepository {
    return this.userRepo;
  }

  getOTPRepository(): IOTPRepository {
    return this.otpRepo;
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
