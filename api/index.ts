import type { VercelRequest, VercelResponse } from '@vercel/node';
import "dotenv/config";
import express from "express";
import { requireAuth, optionalAuth, getCurrentUserId } from "../server/auth";
import { storage } from "../server/storage";
import { verifyClerkToken, syncClerkUser } from "../server/clerkAuth";
import session from "express-session";
import { 
  insertNoteSchema, 
  insertNoteTemplateSchema, 
  insertSmartPhraseSchema,
  insertTeamTodoSchema,
  insertTeamCalendarEventSchema,
  insertUserSchema,
  insertUserLabSettingSchema
} from "../shared/schema";
import { z } from "zod";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes only once
let routesInitialized = false;

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

  // Register all the essential routes inline (to avoid server creation issues)
  
  // Clerk sync endpoint
  app.post('/api/auth/sync', verifyClerkToken, syncClerkUser);

  // Lightweight logout endpoint to clear our auth cookie
  app.get('/api/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = isProduction 
      ? 'HttpOnly; Secure; SameSite=Lax; Path=/'
      : 'HttpOnly; SameSite=Lax; Path=/';
    res.setHeader('Set-Cookie', `auth0_user=; ${cookieOptions}; Max-Age=0`);
    res.status(200).json({ ok: true });
  });

  // Auth routes
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
      
      const userId = req.user.claims?.sub || req.user.sub;
      let user = await storage.getUser(userId);
      
      if (!user && req.user) {
        const userData = req.user.claims || req.user;
        user = await storage.createUser({
          id: userId,
          email: userData.email || 'user@example.com',
          firstName: userData.given_name || userData.first_name || userData.name?.split(' ')[0] || "User",
          lastName: userData.family_name || userData.last_name || userData.name?.split(' ').slice(1).join(' ') || "",
          specialty: "General Practice"
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Notes endpoints
  app.get("/api/notes", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const notes = await storage.getNotes(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const noteData = insertNoteSchema.parse({ ...req.body, userId });
      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Note templates endpoint
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