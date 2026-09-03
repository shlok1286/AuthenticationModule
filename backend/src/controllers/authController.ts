import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { OTP } from '../models/OTP';
import { generateNumericOTP, hashOTP, compareOTP } from '../utils/otp';
import { sendOTPEmail } from '../services/emailService';

const getJwtSecret = (): string =>
  process.env.JWT_SECRET || 'super_secret_jwt_key_reusable_auth_module_2026_safe_key_32bytes';

const issueToken = (res: Response, userId: string) => {
  const token = jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return token;
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.provider === 'google') {
        res.status(400).json({ message: 'An account with this email exists via Google login. Please continue with Google.' });
        return;
      }
      res.status(400).json({ message: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      provider: 'local',
      emailVerified: false
    });

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ email: normalizedEmail });
    await OTP.create({
      userId: user._id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'verification',
      expiresAt,
      attempts: 0
    });

    try {
      await sendOTPEmail(normalizedEmail, plainOTP, 'verification');
    } catch (emailErr: any) {
      res.status(500).json({ message: emailErr.message || 'Email service is not configured.' });
      return;
    }

    res.status(201).json({
      message: 'Signup successful. Verification OTP sent to email.',
      email: normalizedEmail
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error during signup.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(400).json({ message: 'Invalid email address or password.' });
      return;
    }

    if (user.provider === 'google' && !user.passwordHash) {
      res.status(400).json({ message: 'This account uses Google Sign-In. Please click "Continue with Google".' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email address or password.' });
      return;
    }

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email: normalizedEmail });
    await OTP.create({
      userId: user._id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'verification',
      expiresAt,
      attempts: 0
    });

    try {
      await sendOTPEmail(normalizedEmail, plainOTP, 'verification');
    } catch (emailErr: any) {
      res.status(500).json({ message: emailErr.message || 'Email service is not configured.' });
      return;
    }

    res.status(200).json({
      message: 'Credentials valid. Verification OTP sent to email.',
      email: normalizedEmail
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error during login.' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP code are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpDoc = await OTP.findOne({ email: normalizedEmail, purpose: 'verification' });

    if (!otpDoc) {
      res.status(400).json({ message: 'No active OTP verification session found or OTP expired.' });
      return;
    }

    if (otpDoc.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      res.status(400).json({ message: 'OTP verification code has expired. Please request a new code.' });
      return;
    }

    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      res.status(400).json({ message: 'Maximum verification attempts exceeded. Please request a new code.' });
      return;
    }

    const isValid = await compareOTP(otp, otpDoc.tokenHash);
    if (!isValid) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      res.status(400).json({ message: `Incorrect verification code. ${5 - otpDoc.attempts} attempt(s) remaining.` });
      return;
    }

    await OTP.deleteOne({ _id: otpDoc._id });

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(400).json({ message: 'User record not found.' });
      return;
    }

    user.emailVerified = true;
    await user.save();

    issueToken(res, (user._id as any).toString());

    res.status(200).json({
      message: 'Authentication successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error during OTP verification.' });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email address is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(400).json({ message: 'User account not found.' });
      return;
    }

    const existingOTP = await OTP.findOne({ email: normalizedEmail, purpose: 'verification' });
    if (existingOTP) {
      const secondsPassed = (Date.now() - new Date(existingOTP.createdAt).getTime()) / 1000;
      if (secondsPassed < 45) {
        res.status(429).json({ message: `Please wait ${Math.ceil(45 - secondsPassed)} seconds before requesting a new code.` });
        return;
      }
    }

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email: normalizedEmail });
    await OTP.create({
      userId: user._id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'verification',
      expiresAt,
      attempts: 0
    });

    try {
      await sendOTPEmail(normalizedEmail, plainOTP, 'verification');
    } catch (emailErr: any) {
      res.status(500).json({ message: emailErr.message || 'Email service is not configured.' });
      return;
    }

    res.status(200).json({ message: 'A new verification code has been sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error while resending OTP.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email address is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Security best practice: return generic success message without leaking email existence
      res.status(200).json({ message: 'If an account exists with this email, a reset code has been sent.' });
      return;
    }

    const plainOTP = generateNumericOTP();
    const tokenHash = await hashOTP(plainOTP);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email: normalizedEmail, purpose: 'reset-password' });
    await OTP.create({
      userId: user._id,
      email: normalizedEmail,
      tokenHash,
      purpose: 'reset-password',
      expiresAt,
      attempts: 0
    });

    try {
      await sendOTPEmail(normalizedEmail, plainOTP, 'reset-password');
    } catch (emailErr: any) {
      res.status(500).json({ message: emailErr.message || 'Email service is not configured.' });
      return;
    }

    res.status(200).json({ message: 'If an account exists with this email, a reset code has been sent.', email: normalizedEmail });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error during forgot password request.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: 'Email, reset code, and new password are required.' });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpDoc = await OTP.findOne({ email: normalizedEmail, purpose: 'reset-password' });

    if (!otpDoc) {
      res.status(400).json({ message: 'Invalid or expired password reset code.' });
      return;
    }

    const isValid = await compareOTP(otp, otpDoc.tokenHash);
    if (!isValid) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      res.status(400).json({ message: 'Invalid password reset code.' });
      return;
    }

    await OTP.deleteOne({ _id: otpDoc._id });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(400).json({ message: 'User account not found.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You may now sign in with your new password.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error during password reset.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).userRecord;
  if (!user) {
    res.status(401).json({ message: 'Not authenticated.' });
    return;
  }
  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      emailVerified: user.emailVerified,
      provider: user.provider
    }
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: 'lax'
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

// Google OAuth Handlers
export const googleAuthRedirect = async (req: Request, res: Response): Promise<void> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

  if (!clientSecret || !clientSecret.trim() || clientSecret.includes('PASTE_YOUR_GOOGLE_CLIENT_SECRET_HERE')) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Configuration Error</title></head>
        <body style="font-family: sans-serif; padding: 40px; line-height: 1.5; color: #111;">
          <h2>Google Authentication Error</h2>
          <p><strong>GOOGLE_CLIENT_SECRET</strong> is missing or unconfigured in <code>backend/.env</code>.</p>
          <p>Google OAuth requires a valid Client Secret from Google Cloud Console.</p>
          <p>Required Authorized redirect URI in Google Cloud Console:<br/><code>http://localhost:5000/auth/google/callback</code></p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Return to Login</a>
        </body>
      </html>
    `);
    return;
  }

  const redirectUri = `${backendUrl}/auth/google/callback`;
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  const googleAuthUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ],
    prompt: 'consent'
  });

  res.redirect(googleAuthUrl);
};

export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, error } = req.query;
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

  if (error || !code) {
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent((error as string) || 'Google authentication cancelled')}`);
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret || !clientSecret.trim() || clientSecret.includes('PASTE_YOUR_GOOGLE_CLIENT_SECRET_HERE')) {
    res.status(500).send('Google Client Secret is not configured in backend/.env.');
    return;
  }

  try {
    const redirectUri = `${backendUrl}/auth/google/callback`;
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: clientId
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.redirect(`${frontendUrl}/login?error=Invalid+Google+profile+data`);
      return;
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const googleId = payload.sub;
    const profilePicture = payload.picture || '';

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        provider: 'google',
        profilePicture,
        emailVerified: true
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
      }
      user.emailVerified = true;
      if (profilePicture) user.profilePicture = profilePicture;
      await user.save();
    }

    issueToken(res, (user._id as any).toString());
    res.redirect(`${frontendUrl}/success`);
  } catch (err: any) {
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google OAuth exchange failed')}`);
  }
};
