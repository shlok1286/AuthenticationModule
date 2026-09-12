import { PrismaClient } from '@prisma/client';
import { IUserRepository, AuthUser, CreateUserInput, UpdateUserInput } from '../types';

function mapPrismaUserToAuthUser(u: any): AuthUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.passwordHash,
    googleId: u.googleId,
    provider: (u.provider || 'local') as 'local' | 'google',
    profilePicture: u.profilePicture,
    emailVerified: Boolean(u.emailVerified),
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? mapPrismaUserToAuthUser(user) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    return user ? mapPrismaUserToAuthUser(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { googleId },
    });
    return user ? mapPrismaUserToAuthUser(user) : null;
  }

  async create(data: CreateUserInput): Promise<AuthUser> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash: data.passwordHash || null,
        googleId: data.googleId || null,
        provider: data.provider || 'local',
        profilePicture: data.profilePicture || '',
        emailVerified: data.emailVerified ?? false,
      },
    });
    return mapPrismaUserToAuthUser(user);
  }

  async update(id: string, data: UpdateUserInput): Promise<AuthUser> {
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.passwordHash !== undefined) updatePayload.passwordHash = data.passwordHash;
    if (data.googleId !== undefined) updatePayload.googleId = data.googleId;
    if (data.provider !== undefined) updatePayload.provider = data.provider;
    if (data.profilePicture !== undefined) updatePayload.profilePicture = data.profilePicture;
    if (data.emailVerified !== undefined) updatePayload.emailVerified = data.emailVerified;

    const user = await this.prisma.user.update({
      where: { id },
      data: updatePayload,
    });
    return mapPrismaUserToAuthUser(user);
  }

  async updatePassword(email: string, passwordHash: string): Promise<AuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const user = await this.prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
      });
      return mapPrismaUserToAuthUser(user);
    } catch {
      return null;
    }
  }

  async markEmailVerified(email: string): Promise<AuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const user = await this.prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: true },
      });
      return mapPrismaUserToAuthUser(user);
    } catch {
      return null;
    }
  }
}
