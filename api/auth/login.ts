import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from 'express-openid-connect';
import express from 'express';

const auth0Config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET || 'fallback-secret',
  baseURL: process.env.AUTH0_BASE_URL || 'https://gigatime.vercel.app',
  clientID: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || '',
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    postLogoutRedirect: '/'
  }
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Create temporary express app for this route
  const app = express();
  
  // Apply Auth0 middleware
  app.use(auth(auth0Config));
  
  // Handle login
  app.get('/api/auth/login', (req: any, res: any) => {
    // Auth0 middleware will handle the login redirect
  });

  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        console.error('Auth0 login error:', err);
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}