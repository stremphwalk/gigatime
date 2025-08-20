import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const baseUrl = process.env.AUTH0_BASE_URL || 'https://gigatime.vercel.app';
  
  if (!auth0Domain || !clientId) {
    return res.status(500).json({ error: 'Auth0 configuration missing' });
  }

  // Manual OAuth2 authorization URL construction
  const redirectUri = `${baseUrl}/api/auth/simple-callback`;
  const scope = 'openid profile email';
  const responseType = 'code';
  const state = Math.random().toString(36).substring(2, 15);

  // Store state in a simple way (in production, use proper state management)
  const authUrl = `${auth0Domain}/authorize?` + 
    `response_type=${responseType}&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;

  console.log('Auth0 Login Debug:', {
    auth0Domain,
    clientId: clientId ? 'SET' : 'NOT SET',
    baseUrl,
    redirectUri,
    authUrl
  });

  // Redirect to Auth0
  res.redirect(authUrl);
}