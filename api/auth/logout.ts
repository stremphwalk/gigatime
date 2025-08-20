import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const baseUrl = process.env.AUTH0_BASE_URL || 'https://gigatime.vercel.app';
  
  if (!auth0Domain || !clientId) {
    return res.status(500).json({ error: 'Auth0 configuration missing' });
  }

  // Clear our auth cookie
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = isProduction 
    ? 'HttpOnly; Secure; SameSite=Lax; Path=/'
    : 'HttpOnly; SameSite=Lax; Path=/';
  res.setHeader('Set-Cookie', `auth0_user=; ${cookieOptions}; Max-Age=0`);

  // Redirect to Auth0 logout
  const logoutUrl = `${auth0Domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(baseUrl)}`;
  
  res.redirect(logoutUrl);
}