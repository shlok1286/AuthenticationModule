export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  provider: 'local' | 'google';
  profilePicture?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthOTP {
  id: string;
  userId?: string | null;
  email: string;
  tokenHash: string;
  purpose: 'verification' | 'reset-password';
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  provider?: 'local' | 'google';
  profilePicture?: string;
  emailVerified?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  passwordHash?: string;
  googleId?: string;
  provider?: 'local' | 'google';
  profilePicture?: string;
  emailVerified?: boolean;
}

export interface CreateOTPInput {
  userId?: string;
  email: string;
  tokenHash: string;
  purpose: 'verification' | 'reset-password';
  expiresAt: Date;
  attempts?: number;
}

export interface IUserRepository {
  findById(id: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  findByGoogleId(googleId: string): Promise<AuthUser | null>;
  create(data: CreateUserInput): Promise<AuthUser>;
  update(id: string, data: UpdateUserInput): Promise<AuthUser>;
  updatePassword(email: string, passwordHash: string): Promise<AuthUser | null>;
  markEmailVerified(email: string): Promise<AuthUser | null>;
}

export interface IOTPRepository {
  create(data: CreateOTPInput): Promise<AuthOTP>;
  findActive(email: string, purpose: 'verification' | 'reset-password'): Promise<AuthOTP | null>;
  incrementAttempts(id: string): Promise<AuthOTP | null>;
  deleteById(id: string): Promise<void>;
  deleteByEmail(email: string, purpose?: 'verification' | 'reset-password'): Promise<void>;
}

export type DatabaseProvider = 'mongodb' | 'postgresql';

export interface IDatabaseAdapter {
  readonly provider: DatabaseProvider;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealth(): Promise<{ status: string; provider: DatabaseProvider; connected: boolean }>;
  getUserRepository(): IUserRepository;
  getOTPRepository(): IOTPRepository;
}
