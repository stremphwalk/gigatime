import type { VercelRequest, VercelResponse } from '@vercel/node';
import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { requireAuth, optionalAuth, getCurrentUserId } from "../server/auth";
import { verifyClerkToken, syncClerkUser, getClerkUserId } from "../server/clerkAuth";
import session from "express-session";
import { storage } from "../server/storage";
import { 
  insertNoteSchema, 
  insertNoteTemplateSchema, 
  insertSmartPhraseSchema,
  insertTeamTodoSchema,
  insertTeamCalendarEventSchema,
  insertUserSchema,
  insertUserLabSettingSchema
} from "../shared/schema";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Initialize routes only once
let routesInitialized = false;

async function initializeRoutes() {
  if (routesInitialized) return;

  // Set up Auth0 if configured, otherwise use session for development
  if (process.env.AUTH0_CLIENT_ID) {
    const { setupAuth0 } = await import('../server/auth0');
    setupAuth0(app);
  } else if (process.env.NODE_ENV === 'development') {
    // Fallback to session for development without Auth0
    app.use(session({
      secret: process.env.SESSION_SECRET || 'dev-secret-key-replace-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Allow in development over HTTP
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
      }
    }));
  }

  // Just the essential auth routes for Vercel
  app.get('/api/auth/user', optionalAuth, async (req: any, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        if (!req.session) {
          req.session = {};
        }
        
        if (req.session.loggedOut === true) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        let user = await storage.getUser(userId);
        
        if (!user) {
          user = await storage.createUser({
            id: userId,
            email: "doctor@hospital.com",
            firstName: "Dr. Sarah",
            lastName: "Mitchell",
            specialty: "Emergency Medicine"
          });
        }
        
        return res.json(user);
      }
      
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user && req.user?.claims) {
        const claims = req.user.claims;
        user = await storage.createUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name || "User",
          lastName: claims.last_name || "",
          specialty: "General Practice"
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Note templates endpoint with auto-initialization
  app.get("/api/note-templates", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      const existingTemplates = await storage.getNoteTemplates();
      const existingDefaultTemplates = existingTemplates.filter(t => t.isDefault);
      
      if (existingDefaultTemplates.length === 0) {
        const defaultTemplateData = [
          {
            name: "Admission Note",
            type: "admission",
            isDefault: true,
            userId: null,
            sections: [
              { id: "reason", name: "Reason for Admission", type: "textarea", required: true },
              { id: "hpi", name: "History of Present Illness", type: "textarea", required: true },
              { id: "pmh", name: "Past Medical History", type: "textarea", required: false },
              { id: "allergies", name: "Allergies", type: "textarea", required: true },
              { id: "social", name: "Social History", type: "textarea", required: false },
              { id: "medications", name: "Medications", type: "textarea", required: true },
              { id: "physical", name: "Physical Exam", type: "textarea", required: true },
              { id: "labs", name: "Labs", type: "textarea", required: false },
              { id: "imaging", name: "Imaging", type: "textarea", required: false },
              { id: "impression", name: "Impression", type: "textarea", required: true },
              { id: "plan", name: "Plan", type: "textarea", required: true }
            ]
          },
          {
            name: "Progress Note",
            type: "progress",
            isDefault: true,
            userId: null,
            sections: [
              { id: "evolution", name: "Evolution", type: "textarea", required: true },
              { id: "physical", name: "Physical Exam", type: "textarea", required: true },
              { id: "labs", name: "Labs", type: "textarea", required: false },
              { id: "imaging", name: "Imaging", type: "textarea", required: false },
              { id: "impression", name: "Impression", type: "textarea", required: true },
              { id: "plan", name: "Plan", type: "textarea", required: true }
            ]
          },
          {
            name: "Consult Note",
            type: "consult",
            isDefault: true,
            userId: null,
            sections: [
              { id: "reason", name: "Reason for Consultation", type: "textarea", required: true },
              { id: "hpi", name: "History of Present Illness", type: "textarea", required: true },
              { id: "pmh", name: "Past Medical History", type: "textarea", required: false },
              { id: "allergies", name: "Allergies", type: "textarea", required: true },
              { id: "social", name: "Social History", type: "textarea", required: false },
              { id: "medications", name: "Medications", type: "textarea", required: true },
              { id: "physical", name: "Physical Exam", type: "textarea", required: true },
              { id: "labs", name: "Labs", type: "textarea", required: false },
              { id: "imaging", name: "Imaging", type: "textarea", required: false },
              { id: "impression", name: "Impression", type: "textarea", required: true },
              { id: "plan", name: "Plan", type: "textarea", required: true }
            ]
          }
        ];

        for (const template of defaultTemplateData) {
          await storage.createNoteTemplate(template);
        }
      }
      
      const templates = await storage.getNoteTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching note templates:", error);
      res.status(500).json({ message: "Failed to fetch note templates" });
    }
  });

  // Deepgram API key endpoint
  app.get("/api/deepgram-key", requireAuth, (req, res) => {
    res.json({ apiKey: process.env.DEEPGRAM_API_KEY });
  });

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