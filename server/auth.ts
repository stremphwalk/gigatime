import type { RequestHandler } from "express";
import { isAuth0Authenticated, getAuth0UserId } from './auth0.js';

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
  console.log("[requireAuth] Starting auth check, NODE_ENV:", process.env.NODE_ENV);
  
  // Explicit no-auth override for local development/testing
  if (process.env.NO_AUTH === '1') {
    if (!req.session) req.session = {} as any;
    if (req.session.loggedOut === true) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!req.user) {
      // Generate a unique development user ID per session to avoid conflicts
      const devUserId = req.session.devUserId || `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!req.session.devUserId) {
        req.session.devUserId = devUserId;
      }
      
      req.user = {
        claims: {
          sub: devUserId,
          email: process.env.DEV_USER_EMAIL || "dev@example.com",
          first_name: process.env.DEV_USER_FIRST_NAME || "Development",
          last_name: process.env.DEV_USER_LAST_NAME || "User"
        }
      };
    }
    return next();
  }
  
  // In development with no Auth0 config, use session-based development authentication
  if (process.env.NODE_ENV === 'development' && !process.env.AUTH0_CLIENT_ID) {
    console.log("[requireAuth] Using development authentication");
    // Initialize session if it doesn't exist
    if (!req.session) {
      req.session = {};
    }
    
    // Check if user has been explicitly logged out
    if (req.session.loggedOut === true) {
      console.log("[requireAuth] User logged out in session");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Set development user with session-based ID
    if (!req.user) {
      const devUserId = req.session.devUserId || `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!req.session.devUserId) {
        req.session.devUserId = devUserId;
      }
      
      req.user = {
        claims: {
          sub: devUserId,
          email: process.env.DEV_USER_EMAIL || "dev@example.com",
          first_name: process.env.DEV_USER_FIRST_NAME || "Development",
          last_name: process.env.DEV_USER_LAST_NAME || "User"
        }
      };
    }
    console.log("[requireAuth] Development user set, proceeding");
    
    return next();
  }
  
  // In production, accept auth via cookie set by /api/auth/callback
  console.log("[requireAuth] Checking for auth cookie...");
  const cookieUser = extractAuth0UserFromCookie(req);
  if (cookieUser) {
    console.log("[requireAuth] Found auth cookie user:", cookieUser.sub);
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
  
  console.log("[requireAuth] No cookie found, checking Auth0 session...");
  // Fallback to Auth0 middleware session if configured
  return isAuth0Authenticated(req, res, next);
};

export const optionalAuth: RequestHandler = async (req: any, res, next) => {
  // Explicit no-auth override for local development/testing
  if (process.env.NO_AUTH === '1') {
    if (!req.session) req.session = {} as any;
    if (req.session.loggedOut !== true && !req.user) {
      const devUserId = req.session.devUserId || `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!req.session.devUserId) {
        req.session.devUserId = devUserId;
      }
      
      req.user = {
        claims: {
          sub: devUserId,
          email: process.env.DEV_USER_EMAIL || "dev@example.com",
          first_name: process.env.DEV_USER_FIRST_NAME || "Development",
          last_name: process.env.DEV_USER_LAST_NAME || "User"
        }
      };
    }
    return next();
  }
  
  // In development with no Auth0 config, set development user if not logged out
  if (process.env.NODE_ENV === 'development' && !process.env.AUTH0_CLIENT_ID) {
    // Initialize session if it doesn't exist
    if (!req.session) {
      req.session = {};
    }
    
    if (req.session.loggedOut !== true && !req.user) {
      const devUserId = req.session.devUserId || `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!req.session.devUserId) {
        req.session.devUserId = devUserId;
      }
      
      req.user = {
        claims: {
          sub: devUserId,
          email: process.env.DEV_USER_EMAIL || "dev@example.com",
          first_name: process.env.DEV_USER_FIRST_NAME || "Development",
          last_name: process.env.DEV_USER_LAST_NAME || "User"
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
  // Explicit no-auth override
  if (process.env.NO_AUTH === '1') {
    if (!req.session) req.session = {} as any;
    if (req.session.loggedOut !== true) {
      if (!req.session.devUserId) {
        req.session.devUserId = `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      return req.session.devUserId;
    }
    throw new Error("User not authenticated");
  }
  
  // Check for Auth0 user first
  if (req.oidc && req.oidc.isAuthenticated() && req.oidc.user) {
    return getAuth0UserId(req);
  }
  
  // Check for cookie user
  const cookieUser = extractAuth0UserFromCookie(req);
  if (cookieUser?.sub) {
    return cookieUser.sub;
  }
  
  // Fallback to development user in development
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  
  // In development with no Auth0, return session-based development user ID if not logged out
  if (process.env.NODE_ENV === 'development' && !process.env.AUTH0_CLIENT_ID) {
    // Initialize session if it doesn't exist
    if (!req.session) {
      req.session = {};
    }
    
    if (req.session.loggedOut !== true) {
      if (!req.session.devUserId) {
        req.session.devUserId = `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      return req.session.devUserId;
    }
  }
  
  throw new Error("User not authenticated");
};
