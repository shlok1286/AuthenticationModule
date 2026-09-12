import { IOTPRepository, AuthOTP, CreateOTPInput } from '../types';
import { OTP, IOTP } from '../../models/OTP';

function mapToAuthOTP(doc: IOTP): AuthOTP {
  return {
    id: (doc._id as any).toString(),
    userId: doc.userId ? (doc.userId as any).toString() : null,
    email: doc.email,
    tokenHash: doc.tokenHash,
    purpose: doc.purpose,
    expiresAt: doc.expiresAt,
    attempts: doc.attempts,
    createdAt: doc.createdAt,
  };
}

export class MongoOTPRepository implements IOTPRepository {
  async create(data: CreateOTPInput): Promise<AuthOTP> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const otp = await OTP.create({
      userId: data.userId,
      email: normalizedEmail,
      tokenHash: data.tokenHash,
      purpose: data.purpose,
      expiresAt: data.expiresAt,
      attempts: data.attempts ?? 0,
    });
    return mapToAuthOTP(otp);
  }

  async findActive(email: string, purpose: 'verification' | 'reset-password'): Promise<AuthOTP | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const otp = await OTP.findOne({
      email: normalizedEmail,
      purpose,
    }).sort({ createdAt: -1 });
    return otp ? mapToAuthOTP(otp) : null;
  }

  async incrementAttempts(id: string): Promise<AuthOTP | null> {
    const otp = await OTP.findByIdAndUpdate(
      id,
      { $inc: { attempts: 1 } },
      { new: true }
    );
    return otp ? mapToAuthOTP(otp) : null;
  }

  async deleteById(id: string): Promise<void> {
    await OTP.deleteOne({ _id: id });
  }

  async deleteByEmail(email: string, purpose?: 'verification' | 'reset-password'): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const query: any = { email: normalizedEmail };
    if (purpose) query.purpose = purpose;
    await OTP.deleteMany(query);
  }
}
