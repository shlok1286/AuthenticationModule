import { IUserRepository, AuthUser, CreateUserInput, UpdateUserInput } from '../types';
import { User, IUser } from '../../models/User';

function mapToAuthUser(doc: IUser): AuthUser {
  return {
    id: (doc._id as any).toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash || null,
    googleId: doc.googleId || null,
    provider: doc.provider || 'local',
    profilePicture: doc.profilePicture || null,
    emailVerified: Boolean(doc.emailVerified),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<AuthUser | null> {
    const user = await User.findById(id);
    return user ? mapToAuthUser(user) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    return user ? mapToAuthUser(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    const user = await User.findOne({ googleId });
    return user ? mapToAuthUser(user) : null;
  }

  async create(data: CreateUserInput): Promise<AuthUser> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await User.create({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      googleId: data.googleId,
      provider: data.provider || 'local',
      profilePicture: data.profilePicture || '',
      emailVerified: data.emailVerified ?? false,
    });
    return mapToAuthUser(user);
  }

  async update(id: string, data: UpdateUserInput): Promise<AuthUser> {
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.passwordHash !== undefined) updatePayload.passwordHash = data.passwordHash;
    if (data.googleId !== undefined) updatePayload.googleId = data.googleId;
    if (data.provider !== undefined) updatePayload.provider = data.provider;
    if (data.profilePicture !== undefined) updatePayload.profilePicture = data.profilePicture;
    if (data.emailVerified !== undefined) updatePayload.emailVerified = data.emailVerified;

    const user = await User.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!user) {
      throw new Error(`User not found with ID: ${id}`);
    }
    return mapToAuthUser(user);
  }

  async updatePassword(email: string, passwordHash: string): Promise<AuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { passwordHash },
      { new: true }
    );
    return user ? mapToAuthUser(user) : null;
  }

  async markEmailVerified(email: string): Promise<AuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { emailVerified: true },
      { new: true }
    );
    return user ? mapToAuthUser(user) : null;
  }
}
