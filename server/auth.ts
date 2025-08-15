import type { RequestHandler } from "express";
import { isAuthenticated as replitIsAuthenticated } from "./replitAuth";

export const requireAuth: RequestHandler = async (req: any, res, next) => {
  // In development mode, allow access with mock user unless explicitly logged out
  if (process.env.NODE_ENV === 'development') {
    // Initialize session if it doesn't exist
    if (!req.session) {
      req.session = {};
    }
    
    // Check if user has been explicitly logged out
    if (req.session.loggedOut === true) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Set mock user for development
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
  
  // In production, use Replit authentication
  return replitIsAuthenticated(req, res, next);
};

export const optionalAuth: RequestHandler = async (req: any, res, next) => {
  // In development mode, set mock user if not logged out
  if (process.env.NODE_ENV === 'development') {
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
  
  // In production, check if authenticated but don't require it
  if (req.isAuthenticated && req.isAuthenticated()) {
    return replitIsAuthenticated(req, res, next);
  }
  
  return next();
};

export const getCurrentUserId = (req: any): string => {
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  
  // In development, return mock user ID if not logged out
  if (process.env.NODE_ENV === 'development') {
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