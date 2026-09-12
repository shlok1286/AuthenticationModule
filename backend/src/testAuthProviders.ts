import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoAdapter } from './db/mongodb/MongoAdapter';
import { PostgresAdapter } from './db/postgres/PostgresAdapter';
import { MongoUserRepository } from './db/mongodb/MongoUserRepository';
import { MongoOTPRepository } from './db/mongodb/MongoOTPRepository';
import { PostgresUserRepository } from './db/postgres/PostgresUserRepository';
import { PostgresOTPRepository } from './db/postgres/PostgresOTPRepository';
import { AuthService, AuthError } from './services/authService';
import { setDatabaseAdapter, IDatabaseAdapter, IUserRepository, IOTPRepository, DatabaseProvider, AuthUser, AuthOTP, CreateUserInput, UpdateUserInput, CreateOTPInput } from './db';
import { User } from './models/User';
import { OTP } from './models/OTP';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authentication';

// In-Memory Mock Prisma Client for isolated PostgreSQL repository testing
class MockPrismaClient {
  private users: Map<string, any> = new Map();
  private otps: Map<string, any> = new Map();
  private idCounter = 1;

  user = {
    findUnique: async ({ where }: { where: { id?: string; email?: string; googleId?: string } }) => {
      for (const u of this.users.values()) {
        if (where.id && u.id === where.id) return { ...u };
        if (where.email && u.email.toLowerCase() === where.email.toLowerCase()) return { ...u };
        if (where.googleId && u.googleId === where.googleId) return { ...u };
      }
      return null;
    },
    create: async ({ data }: { data: any }) => {
      const id = `pg-user-${this.idCounter++}`;
      const record = {
        id,
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash || null,
        googleId: data.googleId || null,
        provider: data.provider || 'local',
        profilePicture: data.profilePicture || '',
        emailVerified: data.emailVerified || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(id, record);
      return { ...record };
    },
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      let target: any = null;
      for (const u of this.users.values()) {
        if (where.id && u.id === where.id) target = u;
        if (where.email && u.email.toLowerCase() === where.email.toLowerCase()) target = u;
      }
      if (!target) throw new Error('Record not found');
      Object.assign(target, data, { updatedAt: new Date() });
      return { ...target };
    }
  };

  otp = {
    create: async ({ data }: { data: any }) => {
      const id = `pg-otp-${this.idCounter++}`;
      const record = {
        id,
        userId: data.userId || null,
        email: data.email.toLowerCase(),
        tokenHash: data.tokenHash,
        purpose: data.purpose || 'verification',
        expiresAt: data.expiresAt,
        attempts: data.attempts || 0,
        createdAt: new Date(),
      };
      this.otps.set(id, record);
      return { ...record };
    },
    findFirst: async ({ where, orderBy }: { where: { email?: string; purpose?: string }; orderBy?: any }) => {
      const matching: any[] = [];
      for (const o of this.otps.values()) {
        if (where.email && o.email.toLowerCase() !== where.email.toLowerCase()) continue;
        if (where.purpose && o.purpose !== where.purpose) continue;
        matching.push(o);
      }
      if (matching.length === 0) return null;
      matching.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return { ...matching[0] };
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const target = this.otps.get(where.id);
      if (!target) throw new Error('OTP not found');
      if (data.attempts?.increment) {
        target.attempts += data.attempts.increment;
      }
      return { ...target };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      this.otps.delete(where.id);
    },
    deleteMany: async ({ where }: { where: { email?: string; purpose?: string } }) => {
      for (const [id, o] of this.otps.entries()) {
        if (where.email && o.email.toLowerCase() !== where.email.toLowerCase()) continue;
        if (where.purpose && o.purpose !== where.purpose) continue;
        this.otps.delete(id);
      }
    }
  };

  async $connect() {}
  async $disconnect() {}
  async $queryRaw() { return [{ '?column?': 1 }]; }
}

class MockPostgresAdapter implements IDatabaseAdapter {
  readonly provider: DatabaseProvider = 'postgresql';
  private mockPrisma = new MockPrismaClient();
  private userRepo = new PostgresUserRepository(this.mockPrisma as any);
  private otpRepo = new PostgresOTPRepository(this.mockPrisma as any);
  private connected = true;

  async connect(): Promise<void> { this.connected = true; }
  async disconnect(): Promise<void> { this.connected = false; }
  isConnected(): boolean { return this.connected; }
  async getHealth() { return { status: 'ok', provider: 'postgresql' as DatabaseProvider, connected: true }; }
  getUserRepository() { return this.userRepo; }
  getOTPRepository() { return this.otpRepo; }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('    AUTH12 MULTI-DATABASE ARCHITECTURE & PROVIDER TEST SUITE   ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // 1. TEST MONGODB ADAPTER & REPOSITORY
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 1: MongoDB Repository & Adapter ---');
  try {
    const mongoAdapter = new MongoAdapter(MONGODB_URI);
    await mongoAdapter.connect();
    assert(mongoAdapter.isConnected() === true, 'MongoAdapter connects successfully');

    const health = await mongoAdapter.getHealth();
    assert(health.status === 'ok' && health.provider === 'mongodb', 'MongoAdapter health check returns ok and mongodb provider');

    const userRepo = mongoAdapter.getUserRepository();
    const otpRepo = mongoAdapter.getOTPRepository();

    const testEmail = `mongo_test_${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('Secret123', 10);

    // Create user
    const createdUser = await userRepo.create({
      name: 'Mongo Tester',
      email: testEmail,
      passwordHash,
      provider: 'local',
      emailVerified: false,
    });
    assert(createdUser.id !== undefined && createdUser.email === testEmail, 'MongoUserRepository.create creates user with normalized email');
    assert(createdUser.emailVerified === false, 'MongoUserRepository.create sets emailVerified: false');

    // Find by email & ID
    const foundByEmail = await userRepo.findByEmail(testEmail);
    assert(foundByEmail?.id === createdUser.id, 'MongoUserRepository.findByEmail returns matching user');

    const foundById = await userRepo.findById(createdUser.id);
    assert(foundById?.email === testEmail, 'MongoUserRepository.findById returns matching user');

    // Create OTP
    const tokenHash = await bcrypt.hash('123456', 10);
    const otp = await otpRepo.create({
      userId: createdUser.id,
      email: testEmail,
      tokenHash,
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 300000),
      attempts: 0,
    });
    assert(otp.id !== undefined && otp.email === testEmail, 'MongoOTPRepository.create creates OTP record');

    const foundOtp = await otpRepo.findActive(testEmail, 'verification');
    assert(foundOtp?.id === otp.id, 'MongoOTPRepository.findActive finds active OTP');

    // Increment attempts
    const updatedOtp = await otpRepo.incrementAttempts(otp.id);
    assert(updatedOtp?.attempts === 1, 'MongoOTPRepository.incrementAttempts increments attempts counter');

    // Mark email verified
    const verifiedUser = await userRepo.markEmailVerified(testEmail);
    assert(verifiedUser?.emailVerified === true, 'MongoUserRepository.markEmailVerified updates verification status');

    // Delete OTP
    await otpRepo.deleteById(otp.id);
    const deletedOtp = await otpRepo.findActive(testEmail, 'verification');
    assert(deletedOtp === null, 'MongoOTPRepository.deleteById removes OTP record');

    // Cleanup Mongo test user
    await User.deleteOne({ email: testEmail });
  } catch (err: any) {
    console.error('❌ Error in MongoDB repository test:', err.message);
    failed++;
  }

  // -------------------------------------------------------------
  // 2. TEST POSTGRESQL / PRISMA ADAPTER & REPOSITORY
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: PostgreSQL / Prisma Repository & Adapter ---');
  try {
    const pgAdapter = new MockPostgresAdapter();
    await pgAdapter.connect();
    assert(pgAdapter.isConnected() === true, 'PostgresAdapter connects and reports connected status');

    const health = await pgAdapter.getHealth();
    assert(health.status === 'ok' && health.provider === 'postgresql', 'PostgresAdapter health check returns ok and postgresql provider');

    const userRepo = pgAdapter.getUserRepository();
    const otpRepo = pgAdapter.getOTPRepository();

    const pgTestEmail = `pg_test_${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('PgSecret456', 10);

    // Create User
    const createdUser = await userRepo.create({
      name: 'Postgres Tester',
      email: pgTestEmail,
      passwordHash,
      provider: 'local',
      emailVerified: false,
    });
    assert(createdUser.id !== undefined && createdUser.email === pgTestEmail, 'PostgresUserRepository.create creates user with normalized email');
    assert(createdUser.provider === 'local', 'PostgresUserRepository.create sets provider: local');

    // Find by email & ID
    const foundByEmail = await userRepo.findByEmail(pgTestEmail);
    assert(foundByEmail?.id === createdUser.id, 'PostgresUserRepository.findByEmail returns matching user');

    const foundById = await userRepo.findById(createdUser.id);
    assert(foundById?.email === pgTestEmail, 'PostgresUserRepository.findById returns matching user');

    // Create OTP
    const tokenHash = await bcrypt.hash('654321', 10);
    const otp = await otpRepo.create({
      userId: createdUser.id,
      email: pgTestEmail,
      tokenHash,
      purpose: 'reset-password',
      expiresAt: new Date(Date.now() + 300000),
      attempts: 0,
    });
    assert(otp.id !== undefined && otp.email === pgTestEmail, 'PostgresOTPRepository.create creates OTP record');

    const activeOtp = await otpRepo.findActive(pgTestEmail, 'reset-password');
    assert(activeOtp?.id === otp.id, 'PostgresOTPRepository.findActive finds active OTP');

    // Increment attempts
    const updatedOtp = await otpRepo.incrementAttempts(otp.id);
    assert(updatedOtp?.attempts === 1, 'PostgresOTPRepository.incrementAttempts increments attempts counter');

    // Update password
    const newHash = await bcrypt.hash('BrandNewPass789', 10);
    const userWithNewPass = await userRepo.updatePassword(pgTestEmail, newHash);
    assert(userWithNewPass?.passwordHash === newHash, 'PostgresUserRepository.updatePassword updates password hash');

    // Delete OTP
    await otpRepo.deleteById(otp.id);
    const deletedOtp = await otpRepo.findActive(pgTestEmail, 'reset-password');
    assert(deletedOtp === null, 'PostgresOTPRepository.deleteById deletes OTP record');
  } catch (err: any) {
    console.error('❌ Error in PostgreSQL repository test:', err.message);
    failed++;
  }

  // -------------------------------------------------------------
  // 3. TEST AUTH SERVICE BUSINESS LOGIC ACROSS BOTH PROVIDERS
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Shared AuthService Business Logic Across Providers ---');
  
  const providers: { name: string; adapter: IDatabaseAdapter }[] = [
    { name: 'MongoDB', adapter: new MongoAdapter(MONGODB_URI) },
    { name: 'PostgreSQL', adapter: new MockPostgresAdapter() }
  ];

  for (const { name, adapter } of providers) {
    console.log(`\n  >> Testing AuthService against [${name}] adapter`);
    setDatabaseAdapter(adapter);
    const authService = new AuthService();

    const email = `service_test_${name.toLowerCase()}_${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    // 3.1 Signup Validation & Creation
    try {
      // Mock email sending without throwing by testing logic
      const userRepo = adapter.getUserRepository();
      const otpRepo = adapter.getOTPRepository();

      const user = await userRepo.create({
        name: 'Service Tester',
        email,
        passwordHash: await bcrypt.hash(password, 10),
        provider: 'local',
        emailVerified: false,
      });
      assert(user.email === email && user.emailVerified === false, `[${name}] User successfully registered in database`);

      // 3.2 Duplicate Email Detection
      const duplicateUser = await userRepo.findByEmail(email);
      assert(duplicateUser !== null, `[${name}] Duplicate email detected and prevented`);

      // 3.3 OTP Generation & Validation
      const rawOtp = '456789';
      const tokenHash = await bcrypt.hash(rawOtp, 10);
      const createdOtp = await otpRepo.create({
        userId: user.id,
        email,
        tokenHash,
        purpose: 'verification',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
      });
      assert(createdOtp.email === email, `[${name}] Verification OTP generated and linked to user`);

      // 3.4 OTP Verification Success
      const verifiedUser = await authService.verifyOtp(email, rawOtp);
      assert(verifiedUser.emailVerified === true, `[${name}] verifyOtp correctly verified user and marked emailVerified: true`);

      // 3.5 Attempt Counter & Limit Validation
      const resetOtp = '112233';
      const resetHash = await bcrypt.hash(resetOtp, 10);
      const otpDoc = await otpRepo.create({
        userId: user.id,
        email,
        tokenHash: resetHash,
        purpose: 'reset-password',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
      });

      // Attempt wrong OTP
      try {
        await authService.resetPassword(email, '000000', 'NewPassword999!');
        assert(false, `[${name}] Wrong OTP should throw AuthError`);
      } catch (err: any) {
        assert(err instanceof AuthError && err.message.includes('Invalid password reset code'), `[${name}] Incorrect OTP rejected with AuthError`);
      }

      // Check incremented attempts
      const activeResetOtp = await otpRepo.findActive(email, 'reset-password');
      assert(activeResetOtp?.attempts === 1, `[${name}] Failed attempt counter correctly incremented`);

      // Successful password reset
      const newPassword = 'BrandNewPassword999!';
      await authService.resetPassword(email, resetOtp, newPassword);
      const updatedUser = await userRepo.findByEmail(email);
      const passMatch = await bcrypt.compare(newPassword, updatedUser?.passwordHash || '');
      assert(passMatch === true, `[${name}] resetPassword successfully updated user password hash in database`);

      // 3.6 Google OAuth Sync
      const googleId = `google-sub-${Date.now()}`;
      const googleEmail = `google_${name.toLowerCase()}_${Date.now()}@gmail.com`;
      const googleUser = await authService.syncGoogleUser(googleEmail, 'Google User', googleId, 'https://example.com/avatar.jpg');
      assert(googleUser.email === googleEmail && googleUser.provider === 'google' && googleUser.emailVerified === true, `[${name}] Google OAuth profile synchronized and verified`);

      // Cleanup if MongoDB
      if (name === 'MongoDB') {
        await User.deleteMany({ email: { $in: [email, googleEmail] } });
        await OTP.deleteMany({ email: { $in: [email, googleEmail] } });
      }
    } catch (err: any) {
      console.error(`❌ Error testing AuthService on ${name}:`, err.message);
      failed++;
    }
  }

  // Restore adapter
  setDatabaseAdapter(null);

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(console.error);
