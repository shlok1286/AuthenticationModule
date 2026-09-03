"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_APP_PASSWORD;
    if (!emailUser || !emailPass) {
        throw new Error('Email service is not configured.');
    }
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });
    const subject = purpose === 'verification' ? 'Your verification code' : 'Your password reset code';
    const titleText = purpose === 'verification' ? 'Email Verification' : 'Password Reset Request';
    const descText = purpose === 'verification'
        ? 'Use the 6-digit code below to verify your email address and complete your authentication.'
        : 'Use the 6-digit code below to reset your account password.';
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f8; color: #111111; margin: 0; padding: 40px 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 36px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
          .logo { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 24px; color: #111111; }
          h2 { font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: #111111; }
          p { font-size: 14px; line-height: 1.6; color: #666666; margin: 0 0 24px 0; }
          .code-box { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; padding: 18px; text-align: center; font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111111; margin-bottom: 24px; }
          .footer { font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Authentication System</div>
          <h2>${titleText}</h2>
          <p>${descText}</p>
          <div class="code-box">${otp}</div>
          <p>This code expires in <strong>5 minutes</strong>.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <div class="footer">
            This is an automated message. Please do not reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `;
    await transporter.sendMail({
        from: `"Authentication" <${emailUser}>`,
        to: email,
        subject: subject,
        html: htmlContent
    });
};
exports.sendOTPEmail = sendOTPEmail;
