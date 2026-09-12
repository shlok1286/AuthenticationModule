import bcrypt from 'bcryptjs';
import { getDatabaseAdapter, AuthUser } from '../db';
import { generateNumericOTP, hashOTP, compareOTP } from '../utils/otp';
import { sendOTPEmail } from './emailService';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class AuthService {
  private getUserRepo() {
    return getDatabaseAdapter().getUserRepository();
  }

  private getOtpRepo() {
    return getDatabaseAdapter().getOTPRepository();
  }

  async signup(name: string, email: string, password: string, confirmPassword?: string): Promise<{ email: string }> {
    if (!name || !email || !password) {
      throw new AuthError('Name, email, and password are required.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new AuthError('Passwords do not match.', 400);
    }

    if (password.length < 6) {
      throw new AuthError('Password must be at least 6 characters long.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = this.getUserRepo();
    const otpRepo = this.getOtpRepo();

    const existingUser = await userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      if (existingUser.provider === 'google') {
        throw new AuthError('An account with this email exists via Google login. Please continue with Google.', 400);
      }
      throw new AuthError('An account with this email address already exists.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepo.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      provider: 'local',
      emailVerified: false,
    });

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await otpRepo.deleteByEmail(normalizedEmail);
    await otpRepo.create({
      userId: user.id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'verification',
      expiresAt,
      attempts: 0,
    });

    await sendOTPEmail(normalizedEmail, plainOTP, 'verification');

    return { email: normalizedEmail };
  }

  async login(email: string, password: string): Promise<{ email: string }> {
    if (!email || !password) {
      throw new AuthError('Email and password are required.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = this.getUserRepo();
    const otpRepo = this.getOtpRepo();

    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new AuthError('Invalid email address or password.', 400);
    }

    if (user.provider === 'google' && !user.passwordHash) {
      throw new AuthError('This account uses Google Sign-In. Please click "Continue with Google".', 400);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      throw new AuthError('Invalid email address or password.', 400);
    }

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpRepo.deleteByEmail(normalizedEmail);
    await otpRepo.create({
      userId: user.id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'verification',
      expiresAt,
      attempts: 0,
    });

    await sendOTPEmail(normalizedEmail, plainOTP, 'verification');

    return { email: normalizedEmail };
  }

  async verifyOtp(email: string, otp: string): Promise<AuthUser> {
    if (!email || !otp) {
      throw new AuthError('Email and OTP code are required.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = this.getUserRepo();
    const otpRepo = this.getOtpRepo();

    const otpDoc = await otpRepo.findActive(normalizedEmail, 'verification');
    if (!otpDoc) {
      throw new AuthError('No active OTP verification session found or OTP expired.', 400);
    }

    if (new Date(otpDoc.expiresAt) < new Date()) {
      await otpRepo.deleteById(otpDoc.id);
      throw new AuthError('OTP verification code has expired. Please request a new code.', 400);
    }

    if (otpDoc.attempts >= 5) {
      await otpRepo.deleteById(otpDoc.id);
      throw new AuthError('Maximum verification attempts exceeded. Please request a new code.', 400);
    }

    const isValid = await compareOTP(otp, otpDoc.tokenHash);
    if (!isValid) {
      const updated = await otpRepo.incrementAttempts(otpDoc.id);
      const remainingAttempts = 5 - (updated ? updated.attempts : otpDoc.attempts + 1);
      throw new AuthError(`Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`, 400);
    }

    await otpRepo.deleteById(otpDoc.id);

    const updatedUser = await userRepo.markEmailVerified(normalizedEmail);
    if (!updatedUser) {
      throw new AuthError('User record not found.', 400);
    }

    return updatedUser;
  }

  async resendOtp(email: string): Promise<void> {
    if (!email) {
      throw new AuthError('Email address is required.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = this.getUserRepo();
    const otpRepo = this.getOtpRepo();

    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new AuthError('User account not found.', 400);
    }

    const existingOTP = await otpRepo.findActive(normalizedEmail, 'verification');
    if (existingOTP) {
      const secondsPassed = (Date.now() - new Date(existingOTP.createdAt).getTime()) / 1000;
      if (secondsPassed < 45) {
        throw new AuthError(`Please wait ${Math.ceil(45 - secondsPassed)} seconds before requesting a new code.`, 429);
      }
    }

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpRepo.deleteByEmail(normalizedEmail);
    await otpRepo.create({
      userId: user.id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'verification',
      expiresAt,
      attempts: 0,
    });

    await sendOTPEmail(normalizedEmail, plainOTP, 'verification');
  }

  async forgotPassword(email: string): Promise<{ sent: boolean; email?: string }> {
    if (!email) {
      throw new AuthError('Email address is required.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = this.getUserRepo();
    const otpRepo = this.getOtpRepo();

    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
      return { sent: false };
    }

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpRepo.deleteByEmail(normalizedEmail, 'reset-password');
    await otpRepo.create({
      userId: user.id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'reset-password',
      expiresAt,
      attempts: 0,
    });

    await sendOTPEmail(normalizedEmail, plainOTP, 'reset-password');

    return { sent: true, email: normalizedEmail };
  }

  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword?: string): Promise<void> {
    if (!email || !otp || !newPassword) {
      throw new AuthError('Email, reset code, and new password are required.', 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      throw new AuthError('Passwords do not match.', 400);
    }

    if (newPassword.length < 6) {
      throw new AuthError('New password must be at least 6 characters long.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = this.getUserRepo();
    const otpRepo = this.getOtpRepo();

    const otpDoc = await otpRepo.findActive(normalizedEmail, 'reset-password');
    if (!otpDoc) {
      throw new AuthError('Invalid or expired password reset code.', 400);
    }

    const isValid = await compareOTP(otp, otpDoc.tokenHash);
    if (!isValid) {
      await otpRepo.incrementAttempts(otpDoc.id);
      throw new AuthError('Invalid password reset code.', 400);
    }

    await otpRepo.deleteById(otpDoc.id);

    const user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new AuthError('User account not found.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepo.updatePassword(normalizedEmail, passwordHash);
  }

  async syncGoogleUser(email: string, name: string, googleId: string, profilePicture: string): Promise<AuthUser> {
    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = this.getUserRepo();

    let user = await userRepo.findByEmail(normalizedEmail);
    if (!user) {
      user = await userRepo.create({
        name,
        email: normalizedEmail,
        googleId,
        provider: 'google',
        profilePicture,
        emailVerified: true,
      });
    } else {
      const updateData: any = { emailVerified: true };
      if (!user.googleId) {
        updateData.googleId = googleId;
        updateData.provider = 'google';
      }
      if (profilePicture) {
        updateData.profilePicture = profilePicture;
      }
      user = await userRepo.update(user.id, updateData);
    }

    return user;
  }
}

export const authService = new AuthService();
