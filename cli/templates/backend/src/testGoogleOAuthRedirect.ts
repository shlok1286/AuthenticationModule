import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

function verifyGoogleRedirectUri() {
  console.log('=== VERIFYING GOOGLE OAUTH REDIRECT URI CONFIGURATION ===\n');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret_for_test';
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

  const redirectUri = `${backendUrl}/auth/google/callback`;

  console.log(`1. GOOGLE_CLIENT_ID: ${clientId}`);
  console.log(`2. BACKEND_URL: ${backendUrl}`);
  console.log(`3. Generated OAuth Callback URL: ${redirectUri}`);

  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ],
    prompt: 'consent'
  });

  const parsedUrl = new URL(authUrl);
  const redirectUriParam = parsedUrl.searchParams.get('redirect_uri');

  console.log(`\n4. Extracted redirect_uri from Google Auth URL: ${redirectUriParam}`);

  if (redirectUriParam === 'http://localhost:5000/auth/google/callback') {
    console.log('\n✔ PASS: redirect_uri matches EXACTLY "http://localhost:5000/auth/google/callback"');
  } else {
    console.error(`\n❌ FAIL: redirect_uri mismatch! Expected "http://localhost:5000/auth/google/callback", got "${redirectUriParam}"`);
  }
}

verifyGoogleRedirectUri();
