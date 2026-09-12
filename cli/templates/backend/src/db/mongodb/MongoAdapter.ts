import mongoose from 'mongoose';
import { IDatabaseAdapter, IUserRepository, IOTPRepository, DatabaseProvider } from '../types';
import { MongoUserRepository } from './MongoUserRepository';
import { MongoOTPRepository } from './MongoOTPRepository';

export class MongoAdapter implements IDatabaseAdapter {
  readonly provider: DatabaseProvider = 'mongodb';
  private userRepo = new MongoUserRepository();
  private otpRepo = new MongoOTPRepository();
  private uri: string;

  constructor(uri?: string) {
    this.uri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/authentication';
  }

  async connect(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    await mongoose.connect(this.uri);
    console.log(`Successfully connected to MongoDB at: ${this.uri}`);
  }

  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async getHealth(): Promise<{ status: string; provider: DatabaseProvider; connected: boolean }> {
    const connected = this.isConnected();
    return {
      status: connected ? 'ok' : 'disconnected',
      provider: 'mongodb',
      connected,
    };
  }

  getUserRepository(): IUserRepository {
    return this.userRepo;
  }

  getOTPRepository(): IOTPRepository {
    return this.otpRepo;
  }
}
