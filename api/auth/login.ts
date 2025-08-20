import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const baseUrl = process.env.AUTH0_BASE_URL || 'https://gigatime.vercel.app';
  
  if (!auth0Domain || !clientId) {
    return res.status(500).json({ error: 'Auth0 configuration missing' });
  }

  // Generate a random state parameter for security
  const state = randomBytes(32).toString('hex');
  
  // Build the authorization URL manually
  const redirectUri = `${baseUrl}/api/auth/callback`;
  const scope = 'openid profile email';
  const responseType = 'code';

  const authUrl = `${auth0Domain}/authorize?` + 
    `response_type=${responseType}&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;

  console.log('Auth0 Login initiated:', {
    auth0Domain,
    clientId: clientId ? 'SET' : 'NOT SET',
    redirectUri,
    state
  });

  // Set state in a cookie for verification in callback
  res.setHeader('Set-Cookie', `auth0_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  
  // Redirect to Auth0
  res.redirect(authUrl);
}