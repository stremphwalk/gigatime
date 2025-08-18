import { auth } from 'express-openid-connect';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

export const auth0Config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET || 'a-long-random-string',
  baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:5001',
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

export function setupAuth0(app: Express) {
  // Auth0 middleware
  app.use(auth(auth0Config));

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    if (req.oidc.isAuthenticated()) {
      const user = req.oidc.user;
      
      // Upsert user to database
      try {
        await storage.upsertUser({
          id: user.sub,
          email: user.email || '',
          firstName: user.given_name || user.name?.split(' ')[0] || '',
          lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: user.picture || null
        });
      } catch (error) {
        console.error('Error upserting user:', error);
      }

      res.json({
        id: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
        firstName: user.given_name || user.name?.split(' ')[0] || '',
        lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || ''
      });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Protected route example
  app.get('/api/auth/profile', isAuth0Authenticated, (req: any, res) => {
    res.json(req.oidc.user);
  });
}

// Middleware to check authentication
export const isAuth0Authenticated: RequestHandler = (req: any, res, next) => {
  if (req.oidc && req.oidc.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Get current user ID from Auth0
export const getAuth0UserId = (req: any): string => {
  if (req.oidc && req.oidc.isAuthenticated() && req.oidc.user) {
    return req.oidc.user.sub;
  }
  throw new Error('User not authenticated');
};