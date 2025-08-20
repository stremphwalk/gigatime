import type { RequestHandler } from "express";
import { isAuth0Authenticated, getAuth0UserId } from './auth0';

function extractAuth0UserFromCookie(req: any): { sub: string; email?: string; name?: string; picture?: string } | null {
  try {
    const cookiesHeader = req.headers?.cookie as string | undefined;
    if (!cookiesHeader) return null;
    const cookiePair = cookiesHeader.split(';').find((c) => c.trim().startsWith('auth0_user='));
    if (!cookiePair) return null;
    const rawValue = cookiePair.split('=')[1];
    if (!rawValue) return null;
    const decoded = Buffer.from(rawValue, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.sub === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export const requireAuth: RequestHandler = async (req: any, res, next) => {
  // In development with no Auth0 config, use mock user
  if (process.env.NODE_ENV === 'development' && !process.env.AUTH0_CLIENT_ID) {
    // Initialize session if it doesn't exist
    if (!req.session) {
      req.session = {};
    }
    
    // Check if user has been explicitly logged out
    if (req.session.loggedOut === true) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Set mock user
    if (!req.user) {
      req.user = {
        claims: {
          sub: "123e4567-e89b-12d3-a456-426614174000",
          email: "doctor@hospital.com",
          first_name: "Dr. Sarah",
          last_name: "Mitchell"
        }
      };
    }
    
    return next();
  }
  
  // In production, accept auth via cookie set by /api/auth/callback
  const cookieUser = extractAuth0UserFromCookie(req);
  if (cookieUser) {
    if (!req.user) {
      const [firstName = '', ...rest] = (cookieUser.name || '').split(' ');
      req.user = {
        claims: {
          sub: cookieUser.sub,
          email: cookieUser.email,
          first_name: firstName,
          last_name: rest.join(' ')
        }
      };
    }
    return next();
  }
  
  // Fallback to Auth0 middleware session if configured
  return isAuth0Authenticated(req, res, next);
};

export const optionalAuth: RequestHandler = async (req: any, res, next) => {
  // In development with no Auth0 config, set mock user if not logged out
  if (process.env.NODE_ENV === 'development' && !process.env.AUTH0_CLIENT_ID) {
    // Initialize session if it doesn't exist
    if (!req.session) {
      req.session = {};
    }
    
    if (req.session.loggedOut !== true && !req.user) {
      req.user = {
        claims: {
          sub: "123e4567-e89b-12d3-a456-426614174000",
          email: "doctor@hospital.com",
          first_name: "Dr. Sarah",
          last_name: "Mitchell"
        }
      };
    }
    return next();
  }
  
  // In production, hydrate user from cookie if available
  const cookieUser = extractAuth0UserFromCookie(req);
  if (cookieUser && !req.user) {
    const [firstName = '', ...rest] = (cookieUser.name || '').split(' ');
    req.user = {
      claims: {
        sub: cookieUser.sub,
        email: cookieUser.email,
        first_name: firstName,
        last_name: rest.join(' ')
      }
    };
  }
  
  // Continue without requiring auth
  return next();
};

export const getCurrentUserId = (req: any): string => {
  // Check for Auth0 user first
  if (req.oidc && req.oidc.isAuthenticated() && req.oidc.user) {
    return getAuth0UserId(req);
  }
  
  // Check for cookie user
  const cookieUser = extractAuth0UserFromCookie(req);
  if (cookieUser?.sub) {
    return cookieUser.sub;
  }
  
  // Fallback to mock user in development
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  
  // In development with no Auth0, return mock user ID if not logged out
  if (process.env.NODE_ENV === 'development' && !process.env.AUTH0_CLIENT_ID) {
    // Initialize session if it doesn't exist
    if (!req.session) {
      req.session = {};
    }
    
    if (req.session.loggedOut !== true) {
      return "123e4567-e89b-12d3-a456-426614174000";
    }
  }
  
  throw new Error("User not authenticated");
};