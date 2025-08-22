import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, randomBytes } from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const baseUrl = process.env.AUTH0_BASE_URL || 'https://gigatime.vercel.app';
  const secret = process.env.AUTH0_SECRET || 'fallback-secret';
  
  if (!auth0Domain || !clientId) {
    return res.status(500).json({ error: 'Auth0 configuration missing' });
  }

  // Generate a timestamp-based state that we can verify without storing
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString('hex');
  const stateData = `${timestamp}-${nonce}`;
  
  // Create HMAC signature of the state data
  const hmac = createHmac('sha256', secret);
  hmac.update(stateData);
  const signature = hmac.digest('hex');
  
  // Combine state data with signature
  const state = Buffer.from(`${stateData}.${signature}`).toString('base64url');
  
  // Build the authorization URL manually
  const redirectUri = `${baseUrl}/auth/callback`;
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
    state: state.substring(0, 20) + '...' // Log partial state for debugging
  });

  // Redirect to Auth0 (no cookies needed!)
  res.redirect(authUrl);
}