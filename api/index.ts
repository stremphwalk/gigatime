import type { VercelRequest, VercelResponse } from '@vercel/node';
import "dotenv/config";
import express from "express";
import { registerRoutes } from "../server/routes";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes only once
let routesInitialized = false;
let server: any = null;

async function initializeRoutes() {
  if (routesInitialized) return;

  // Handle CORS for Vercel
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Register all server routes
  server = await registerRoutes(app);
  routesInitialized = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initializeRoutes();

  // Handle the request using Express
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}