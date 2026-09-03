import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  tokenHash: string;
  purpose: 'verification' | 'reset-password';
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true },
    purpose: { type: String, enum: ['verification', 'reset-password'], default: 'verification' },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

export const OTP = mongoose.model<IOTP>('OTP', OTPSchema);
