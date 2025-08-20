import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const debug = {
    env: {
      AUTH0_SECRET: process.env.AUTH0_SECRET ? 'SET' : 'NOT SET',
      AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
      AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? 'SET' : 'NOT SET',
      AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? 'SET' : 'NOT SET',
      AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
      VITE_AUTH0_DOMAIN: process.env.VITE_AUTH0_DOMAIN,
      VITE_AUTH0_CLIENT_ID: process.env.VITE_AUTH0_CLIENT_ID ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    },
    request: {
      url: req.url,
      method: req.method,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host']
      }
    },
    expectedCallbackURL: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
    actualHost: req.headers.host
  };

  res.json(debug);
}