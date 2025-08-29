import type { VercelRequest, VercelResponse } from '@vercel/node';
import "dotenv/config";
import express from "express";
import { requireAuth, optionalAuth, getCurrentUserId } from "../server/auth.js";
import { storage } from "../server/storage.js";
import { verifyClerkToken, syncClerkUser } from "../server/clerkAuth.js";
import session from "express-session";
import * as schemas from "../shared/schema.js";
import { z } from "zod";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Also handle DATABASE_URL for compatibility
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
  console.log('[Init] Set DATABASE_URL from POSTGRES_URL');
}

// Initialize routes only once
let routesInitialized = false;

async function initializeRoutes() {
  if (routesInitialized) return;
  
  try {
    console.log("[InitRoutes] Starting route initialization");
  } catch (error) {
    console.error("[InitRoutes] Error during initialization:", error);
    throw error;
  }

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
    const { setupAuth0 } = await import('../server/auth0.js');
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
      const noteData = schemas.insertNoteSchema.parse({ ...req.body, userId });
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

  app.post("/api/note-templates", requireAuth, async (req, res) => {
    const startTime = Date.now();
    console.log("[POST /api/note-templates] Starting request handler");
    
    // Set timeout for serverless function
    const timeoutHandle = setTimeout(() => {
      console.error("[POST /api/note-templates] Function timeout after 25s");
      if (!res.headersSent) {
        res.status(504).json({ 
          message: "Request timeout", 
          error: "The operation took too long to complete" 
        });
      }
    }, 25000);
    
    try {
      console.log("[POST /api/note-templates] Getting user ID...");
      const userId = getCurrentUserId(req);
      console.log("[POST /api/note-templates] User ID extracted:", userId);
      
      // Ensure user exists for FK constraints with timeout
      console.log("[POST /api/note-templates] Checking user existence...");
      let user = await Promise.race([
        storage.getUser(userId),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 5000))
      ]) as any;
      
      if (!user) {
        console.log("[POST /api/note-templates] User not found, creating new user");
        user = await Promise.race([
          storage.createUser({
            id: userId,
            email: "doctor@hospital.com",
            firstName: "Dr. Sarah",
            lastName: "Mitchell",
            specialty: "Emergency Medicine",
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Create user timeout")), 5000))
        ]);
      }
      console.log("[POST /api/note-templates] User verified", { userId });
      
      console.log("[POST /api/note-templates] Parsing request body...");
      const templateData = schemas.insertNoteTemplateSchema.parse({ ...req.body, userId });
      console.log("[POST /api/note-templates] Schema validation passed");
      
      console.log("[POST /api/note-templates] Starting database insert...");
      const template = await Promise.race([
        storage.createNoteTemplate(templateData),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database insert timeout")), 10000))
      ]) as any;
      
      clearTimeout(timeoutHandle);
      console.log("[POST /api/note-templates] Success, time taken:", Date.now() - startTime + 'ms');
      
      if (!res.headersSent) {
        return res.status(200).json(template);
      }
    } catch (error) {
      clearTimeout(timeoutHandle);
      console.error("[POST /api/note-templates] ERROR:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        timeTaken: Date.now() - startTime + 'ms'
      });
      
      // Handle Zod validation errors specifically
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors = (error as any).issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        console.log("[POST /api/note-templates] Sending validation error response", { statusCode: 400 });
        return res.status(400).json({ 
          message: "Validation failed", 
          error: `Invalid template data: ${validationErrors}` 
        });
      }
      
      console.log("[POST /api/note-templates] Sending error response", { statusCode: 500 });
      return res.status(500).json({ 
        message: "Failed to create note template", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Deepgram API key endpoint
  app.get("/api/deepgram-key", requireAuth, (req, res) => {
    res.json({ apiKey: process.env.DEEPGRAM_API_KEY });
  });

  // Smart phrase routes
  app.get("/api/smart-phrases", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Ensure user exists
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
      
      const query = req.query.q as string;
      
      const mapElementsToClient = (phrase: any) => {
        const base = { ...phrase };
        const elements = Array.isArray(phrase?.elements) ? phrase.elements : [];
        if (elements.length === 0) {
          return { ...base, type: 'text', options: null };
        }
        if (elements.length === 1) {
          const el: any = elements[0];
          if (el.type === 'date') {
            return { ...base, type: 'date', options: null };
          }
          if (el.type === 'multipicker' || el.type === 'nested_multipicker') {
            return { ...base, type: el.type, options: { choices: Array.isArray(el.options) ? el.options : [] } };
          }
        }
        return { ...base, type: 'text', options: null };
      };
      
      if (query) {
        const phrases = await storage.searchSmartPhrases(userId, query);
        res.json(phrases.map(mapElementsToClient));
      } else {
        const phrases = await storage.getSmartPhrases(userId);
        res.json(phrases.map(mapElementsToClient));
      }
    } catch (error) {
      console.error("Error fetching smart phrases:", error);
      res.status(500).json({ message: "Failed to fetch smart phrases" });
    }
  });

  app.post("/api/smart-phrases", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Ensure user exists
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
      
      const body = { ...req.body } as any;
      if (!body.elements && body.type) {
        if (body.type === 'text') {
          body.elements = [];
        } else if (body.type === 'date') {
          body.elements = [
            {
              id: 'date',
              type: 'date',
              label: 'Date',
              placeholder: '{date}',
            },
          ];
        } else if (body.type === 'multipicker' || body.type === 'nested_multipicker') {
          body.elements = [
            {
              id: 'option',
              type: body.type,
              label: 'Options',
              placeholder: '{option}',
              options: body.options?.choices || [],
            },
          ];
        }
        delete body.type;
        delete body.options;
      }
      const phraseData = schemas.insertSmartPhraseSchema.parse({ ...body, userId });
      const phrase = await storage.createSmartPhrase(phraseData);
      
      const elements = Array.isArray((phrase as any)?.elements) ? (phrase as any).elements : [];
      let type: any = 'text';
      let options: any = null;
      if (elements.length === 1) {
        const el: any = elements[0];
        if (el?.type === 'date') type = 'date';
        if (el?.type === 'multipicker' || el?.type === 'nested_multipicker') {
          type = el.type;
          options = { choices: Array.isArray(el.options) ? el.options : [] };
        }
      }
      res.json({ ...phrase, type, options });
    } catch (error) {
      console.error("Error creating smart phrase:", error);
      res.status(500).json({ message: "Failed to create smart phrase" });
    }
  });

  // Debug endpoint to initialize autocomplete table
  app.post("/api/initialize-autocomplete-table", requireAuth, async (req, res) => {
    try {
      console.log("[InitAutocomplete] Starting table initialization");
      
      // Execute the SQL to create table if it doesn't exist
      await storage.db.execute(`
        CREATE TABLE IF NOT EXISTS autocomplete_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            text VARCHAR(500) NOT NULL,
            category VARCHAR(100) NOT NULL,
            is_priority BOOLEAN DEFAULT false,
            dosage VARCHAR(100),
            frequency VARCHAR(100),
            description TEXT,
            user_id VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_autocomplete_items_user_id ON autocomplete_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_autocomplete_items_category ON autocomplete_items(category);
        CREATE INDEX IF NOT EXISTS idx_autocomplete_items_priority ON autocomplete_items(is_priority);
      `);
      
      console.log("[InitAutocomplete] Table initialization completed");
      res.json({ message: "Autocomplete table initialized successfully" });
    } catch (error) {
      console.error("[InitAutocomplete] Error:", error);
      res.status(500).json({ message: "Failed to initialize table", error: error.message });
    }
  });

  // Autocomplete items endpoints
  app.get("/api/autocomplete-items", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const category = req.query.category as string;
      
      // Ensure user exists
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
      
      let items;
      try {
        items = category 
          ? await storage.getAutocompleteItemsByCategory(userId, category)
          : await storage.getAutocompleteItems(userId);
      } catch (error) {
        console.error("[Autocomplete] Table might not exist, attempting to create it:", error);
        
        // Try to create the table if it doesn't exist
        try {
          await storage.db.execute(`
            CREATE TABLE IF NOT EXISTS autocomplete_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                text VARCHAR(500) NOT NULL,
                category VARCHAR(100) NOT NULL,
                is_priority BOOLEAN DEFAULT false,
                dosage VARCHAR(100),
                frequency VARCHAR(100),
                description TEXT,
                user_id VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_autocomplete_items_user_id ON autocomplete_items(user_id);
            CREATE INDEX IF NOT EXISTS idx_autocomplete_items_category ON autocomplete_items(category);
            CREATE INDEX IF NOT EXISTS idx_autocomplete_items_priority ON autocomplete_items(is_priority);
          `);
          
          console.log("[Autocomplete] Table created successfully, retrying query");
          
          // Retry the query after creating the table
          items = category 
            ? await storage.getAutocompleteItemsByCategory(userId, category)
            : await storage.getAutocompleteItems(userId);
        } catch (createError) {
          console.error("[Autocomplete] Failed to create table:", createError);
          throw error; // Re-throw original error
        }
      }
        
      res.json(items);
    } catch (error) {
      console.error("Error fetching autocomplete items:", error);
      res.status(500).json({ message: "Failed to fetch autocomplete items" });
    }
  });

  app.post("/api/autocomplete-items", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Ensure user exists
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
      
      const itemData = schemas.insertAutocompleteItemSchema.parse({ ...req.body, userId });
      
      let item;
      try {
        item = await storage.createAutocompleteItem(itemData);
      } catch (error) {
        console.error("[Autocomplete] Create failed, table might not exist, attempting to create it:", error);
        
        // Try to create the table if it doesn't exist
        try {
          await storage.db.execute(`
            CREATE TABLE IF NOT EXISTS autocomplete_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                text VARCHAR(500) NOT NULL,
                category VARCHAR(100) NOT NULL,
                is_priority BOOLEAN DEFAULT false,
                dosage VARCHAR(100),
                frequency VARCHAR(100),
                description TEXT,
                user_id VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_autocomplete_items_user_id ON autocomplete_items(user_id);
            CREATE INDEX IF NOT EXISTS idx_autocomplete_items_category ON autocomplete_items(category);
            CREATE INDEX IF NOT EXISTS idx_autocomplete_items_priority ON autocomplete_items(is_priority);
          `);
          
          console.log("[Autocomplete] Table created successfully, retrying create");
          
          // Retry the creation after creating the table
          item = await storage.createAutocompleteItem(itemData);
        } catch (createError) {
          console.error("[Autocomplete] Failed to create table:", createError);
          throw error; // Re-throw original error
        }
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error creating autocomplete item:", error);
      
      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors = (error as any).issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return res.status(400).json({ 
          message: "Validation failed", 
          error: `Invalid autocomplete item data: ${validationErrors}` 
        });
      }
      
      res.status(500).json({ message: "Failed to create autocomplete item" });
    }
  });

  app.put("/api/autocomplete-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const itemData = schemas.insertAutocompleteItemSchema.partial().parse(req.body);
      const item = await storage.updateAutocompleteItem(id, itemData);
      
      res.json(item);
    } catch (error) {
      console.error("Error updating autocomplete item:", error);
      
      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors = (error as any).issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return res.status(400).json({ 
          message: "Validation failed", 
          error: `Invalid autocomplete item data: ${validationErrors}` 
        });
      }
      
      res.status(500).json({ message: "Failed to update autocomplete item" });
    }
  });

  app.delete("/api/autocomplete-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAutocompleteItem(id);
      
      res.json({ message: "Autocomplete item deleted successfully" });
    } catch (error) {
      console.error("Error deleting autocomplete item:", error);
      res.status(500).json({ message: "Failed to delete autocomplete item" });
    }
  });

  // Health check endpoint (no auth required)
  app.get("/api/health", (req, res) => {
    console.log("[Health] Health check requested");
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV 
    });
  });

  // Init endpoint
  app.post("/api/init", requireAuth, async (req, res) => {
    try {
      console.log("[Init] Starting initialization");
      const userId = getCurrentUserId(req);
      console.log("[Init] User ID:", userId);
      
      let user = await storage.getUser(userId);
      console.log("[Init] User lookup complete:", !!user);
      
      if (!user) {
        console.log("[Init] Creating new user");
        user = await storage.createUser({
          id: userId,
          email: "doctor@hospital.com",
          firstName: "Dr. Sarah",
          lastName: "Mitchell",
          specialty: "Emergency Medicine"
        });
        console.log("[Init] User created:", user.id);
      }
      
      res.json({ message: "Initialized", user });
    } catch (error) {
      console.error("[Init] Error initializing:", error);
      res.status(500).json({ 
        message: "Failed to initialize",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  routesInitialized = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("[Handler] Starting request:", req.method, req.url);
    
    await initializeRoutes();
    console.log("[Handler] Routes initialized");

    // Handle the request using Express
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (err: any) => {
        if (err) {
          console.error("[Handler] Express error:", err);
          reject(err);
        } else {
          console.log("[Handler] Request completed successfully");
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error("[Handler] Top-level error:", error);
    
    // Fallback error response
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
    
    throw error;
  }
}