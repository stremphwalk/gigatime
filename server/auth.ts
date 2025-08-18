import type { RequestHandler } from "express";
import { isAuth0Authenticated, getAuth0UserId } from './auth0';

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
  
  // Use Auth0 authentication
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
  
  // With Auth0, just continue (auth not required)
  return next();
};

export const getCurrentUserId = (req: any): string => {
  // Check for Auth0 user first
  if (req.oidc && req.oidc.isAuthenticated() && req.oidc.user) {
    return getAuth0UserId(req);
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