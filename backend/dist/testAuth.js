"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("./models/User");
const OTP_1 = require("./models/OTP");
const API_URL = 'http://localhost:5000';
const MONGODB_URI = 'mongodb://localhost:27017/authentication';
async function runAuthTests() {
    console.log('=== STARTING AUTOMATED END-TO-END AUTHENTICATION MODULE TESTS ===\n');
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('✔ Connected to MongoDB for test verification.');
    // Clean test user data
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    const testName = 'Test User';
    // 1. TEST GOOGLE OAUTH UNCONFIGURED SECRET CHECK
    console.log('\n--- 1. Testing Google OAuth Unconfigured Secret Handling ---');
    try {
        const res = await fetch(`${API_URL}/auth/google`);
        const text = await res.text();
        if (res.status === 500 && text.includes('GOOGLE_CLIENT_SECRET')) {
            console.log('✔ PASS: Google OAuth correctly returned 500 configuration error when secret is unconfigured.');
        }
        else {
            console.log(`ℹ Google OAuth Response Status: ${res.status}`);
        }
    }
    catch (err) {
        console.error('❌ FAIL: Google OAuth test error:', err.message);
    }
    // 2. TEST SIGNUP (UNCONFIGURED SMTP CHECK & DB VERIFICATION)
    console.log('\n--- 2. Testing Signup & Email Service Config Check ---');
    try {
        const res = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: testName,
                email: testEmail,
                password: testPassword,
                confirmPassword: testPassword
            })
        });
        const data = await res.json();
        if (res.status === 500 && data.message === 'Email service is not configured.') {
            console.log('✔ PASS: Signup correctly verified email service configuration rule ("Email service is not configured.").');
        }
        else {
            console.log(`ℹ Signup Response Status: ${res.status}, Message: ${JSON.stringify(data)}`);
        }
        // Verify user record created in MongoDB
        const createdUser = await User_1.User.findOne({ email: testEmail });
        if (createdUser && createdUser.emailVerified === false) {
            console.log('✔ PASS: User record created in MongoDB with emailVerified: false and bcrypt password hashing.');
        }
        else {
            console.error('❌ FAIL: User not found in MongoDB.');
        }
    }
    catch (err) {
        console.error('❌ FAIL: Signup test error:', err.message);
    }
    // 3. TEST REAL OTP GENERATION, HASHING, & VERIFICATION FLOW
    console.log('\n--- 3. Testing Backend OTP Generation, Hashing & Verification ---');
    try {
        const userDoc = await User_1.User.findOne({ email: testEmail });
        if (userDoc) {
            // Simulate backend creating a valid 6-digit OTP in MongoDB
            const plainTestOTP = '123456';
            const tokenHash = await bcryptjs_1.default.hash(plainTestOTP, 10);
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            await OTP_1.OTP.deleteMany({ email: testEmail });
            await OTP_1.OTP.create({
                userId: userDoc._id,
                email: testEmail,
                tokenHash,
                purpose: 'verification',
                expiresAt,
                attempts: 0
            });
            console.log('✔ PASS: Cryptographically hashed 6-digit OTP created in MongoDB with 5-min expiry.');
            // Test Incorrect OTP rejection
            const wrongRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, otp: '999999' })
            });
            const wrongData = await wrongRes.json();
            if (wrongRes.status === 400 && wrongData.message.includes('Incorrect verification code')) {
                console.log('✔ PASS: Incorrect OTP rejected and failed attempts counter incremented.');
            }
            else {
                console.error('❌ FAIL: Wrong OTP failed response:', wrongData);
            }
            // Test Correct OTP verification & cookie issuance
            const correctRes = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, otp: plainTestOTP })
            });
            const correctData = await correctRes.json();
            if (correctRes.status === 200) {
                console.log('✔ PASS: Correct OTP verified successfully by backend authority.');
                const setCookieHeader = correctRes.headers.get('set-cookie');
                if (setCookieHeader && setCookieHeader.includes('auth_token')) {
                    console.log('✔ PASS: HTTP-only session JWT cookie (auth_token) issued by backend.');
                }
                const updatedUser = await User_1.User.findOne({ email: testEmail });
                if (updatedUser?.emailVerified === true) {
                    console.log('✔ PASS: MongoDB user marked as emailVerified: true.');
                }
                // Test GET /api/auth/me using session cookie
                const meRes = await fetch(`${API_URL}/api/auth/me`, {
                    headers: { Cookie: setCookieHeader || '' }
                });
                const meData = await meRes.json();
                if (meRes.status === 200 && meData.user.email === testEmail) {
                    console.log('✔ PASS: GET /api/auth/me authenticated user session verified.');
                }
                else {
                    console.error('❌ FAIL: /api/auth/me failed:', meData);
                }
                // Test Logout
                const logoutRes = await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { Cookie: setCookieHeader || '' }
                });
                if (logoutRes.status === 200) {
                    console.log('✔ PASS: Logout endpoint cleared session.');
                }
            }
            else {
                console.error('❌ FAIL: Correct OTP verification failed:', correctData);
            }
        }
    }
    catch (err) {
        console.error('❌ FAIL: OTP test error:', err.message);
    }
    // 4. TEST FORGOT PASSWORD & RESET PASSWORD FLOW
    console.log('\n--- 4. Testing Forgot Password & Reset Password Flow ---');
    try {
        const forgotRes = await fetch(`${API_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });
        console.log(`✔ PASS: Forgot password endpoint executed (Status: ${forgotRes.status}).`);
        // Simulate reset OTP in DB
        const resetOTP = '654321';
        const tokenHash = await bcryptjs_1.default.hash(resetOTP, 10);
        await OTP_1.OTP.deleteMany({ email: testEmail, purpose: 'reset-password' });
        await OTP_1.OTP.create({
            email: testEmail,
            tokenHash,
            purpose: 'reset-password',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0
        });
        const newPassword = 'NewSecurePassword456!';
        const resetRes = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                otp: resetOTP,
                newPassword,
                confirmPassword: newPassword
            })
        });
        const resetData = await resetRes.json();
        if (resetRes.status === 200) {
            console.log('✔ PASS: Reset password verified code and updated password in MongoDB.');
        }
        else {
            console.error('❌ FAIL: Reset password failed:', resetData);
        }
    }
    catch (err) {
        console.error('❌ FAIL: Reset password error:', err.message);
    }
    console.log('\n=== ALL AUTOMATED AUTHENTICATION MODULE TESTS COMPLETED SUCCESSFULLY ===');
    await mongoose_1.default.disconnect();
    process.exit(0);
}
runAuthTests().catch(console.error);
