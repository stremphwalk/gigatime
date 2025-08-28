import { verifyToken } from "@clerk/backend";
import type { RequestHandler } from "express";
import { storage } from "./storage.js";

// Check if Clerk is configured
const isClerkConfigured = () => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  return secretKey && secretKey !== 'your_clerk_secret_key_here';
};

// Middleware to verify Clerk JWT tokens
export const verifyClerkToken: RequestHandler = async (req: any, res, next) => {
  // Skip if Clerk is not configured (development mode)
  if (!isClerkConfigured()) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No valid authorization header" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Add Clerk user ID to request
    req.clerkUserId = payload.sub;
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Sync user data from Clerk to our database
export const syncClerkUser: RequestHandler = async (req: any, res) => {
  try {
    const { id, email, firstName, lastName, profileImageUrl } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Upsert user in database
    await storage.upsertUser({
      id,
      email,
      firstName,
      lastName,
      profileImageUrl,
    });

    // Get the user from database
    const user = await storage.getUser(id);
    
    res.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: "Failed to sync user" });
  }
};

// Get current user ID from Clerk token or development mode
export const getClerkUserId = (req: any): string => {
  // In production with Clerk
  if (req.clerkUserId) {
    return req.clerkUserId;
  }
  
  // In development mode
  if (process.env.NODE_ENV === 'development' && req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  
  throw new Error("User not authenticated");
};