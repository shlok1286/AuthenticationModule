import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { authService, AuthError } from '../services/authService';

const getJwtSecret = (): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwtSecret;
};

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
    const result = await authService.signup(name, email, password, confirmPassword);
    res.status(201).json({
      message: 'Signup successful. Verification OTP sent to email.',
      email: result.email
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Internal server error during signup.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({
      message: 'Credentials valid. Verification OTP sent to email.',
      email: result.email
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Internal server error during login.' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const user = await authService.verifyOtp(email, otp);
    issueToken(res, user.id);
    res.status(200).json({
      message: 'Authentication successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified
      }
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Internal server error during OTP verification.' });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    await authService.resendOtp(email);
    res.status(200).json({ message: 'A new verification code has been sent to your email.' });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Internal server error while resending OTP.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    if (!result.sent) {
      res.status(200).json({ message: 'If an account exists with this email, a reset code has been sent.' });
      return;
    }
    res.status(200).json({ message: 'If an account exists with this email, a reset code has been sent.', email: result.email });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Internal server error during forgot password request.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword, confirmPassword);
    res.status(200).json({ message: 'Password reset successful. You may now sign in with your new password.' });
  } catch (error: any) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
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
      id: user.id || user._id,
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

    const user = await authService.syncGoogleUser(email, name, googleId, profilePicture);

    issueToken(res, user.id);
    res.redirect(`${frontendUrl}/success`);
  } catch (err: any) {
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google OAuth exchange failed')}`);
  }
};
