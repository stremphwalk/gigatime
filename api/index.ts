import type { VercelRequest, VercelResponse } from '@vercel/node';
import "dotenv/config";
import express from "express";
import { requireAuth, optionalAuth, getCurrentUserId } from "../server/auth.js";
import { storage } from "../server/storage.js";
import { verifyClerkToken, syncClerkUser } from "../server/clerkAuth.js";
import session from "express-session";
import * as schemas from "../shared/schema.js";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

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
// Simple per-user rate limiter for team joins (persisted across invocations)
const joinRate: Map<string, { count: number; resetAt: number }> = new Map();

async function initializeRoutes() {
  if (routesInitialized) return;
  
  try {
    console.log("[InitRoutes] Starting route initialization");
    // Ensure required DB tables/columns exist in deployment
    try {
      console.log("[InitRoutes] Ensuring core DB schema...");
      await storage.ensureCoreSchema();
      console.log("[InitRoutes] Core DB schema ensured");
    } catch (schemaErr) {
      console.error("[InitRoutes] Failed ensuring schema (will continue):", schemaErr);
    }
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
      try { await storage.ensureCoreSchema(); } catch {}
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
      // Last-mile ensure in case of cold start function without init
      try { await storage.ensureCoreSchema(); } catch {}
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
      const anyErr: any = error;
      return res.status(500).json({ 
        message: "Failed to create note template", 
        error: anyErr?.message || String(error),
        code: anyErr?.code,
        detail: anyErr?.detail,
      });
    }
  });

  // Deepgram API key endpoint
  app.get("/api/deepgram-key", requireAuth, (req, res) => {
    res.json({ apiKey: process.env.DEEPGRAM_API_KEY });
  });

  // Initialize user (parity with server routes)
  app.post("/api/init-user", requireAuth, async (req, res) => {
    try {
      try { await storage.ensureCoreSchema(); } catch {}
      const userId = getCurrentUserId(req);
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({
          id: userId,
          email: "doctor@hospital.com",
          firstName: "Dr. Sarah",
          lastName: "Mitchell",
          specialty: "Emergency Medicine",
        });
      }
      res.json({ message: "User initialized", user });
    } catch (error) {
      const anyErr: any = error;
      console.error("[Init-User] Error initializing user:", anyErr);
      res.status(500).json({ message: "Failed to initialize user", error: anyErr?.message || String(error) });
    }
  });

  // Smart phrase routes
  app.get("/api/smart-phrases", requireAuth, async (req, res) => {
    try {
      try { await storage.ensureCoreSchema(); } catch {}
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

  // Share/export short codes
  app.post('/api/share/:type/export', requireAuth, async (req: any, res) => {
    try { await storage.ensureCoreSchema(); } catch {}
    const { type } = req.params;
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids required' });
    try {
      if (type === 'smart-phrases') {
        const rows = await storage.db.select().from(schemas.smartPhrases).where((schemas.smartPhrases.id as any).in(ids as any));
        const codes: string[] = [];
        for (const r of rows) {
          let code = (r as any).shortCode as string | null;
          if (!code) {
            const gen = await (storage as any).generateUniqueShortCodeFor('smartPhrases');
            await storage.updateSmartPhrase((r as any).id, { shortCode: gen } as any);
            code = gen;
          }
          codes.push(code as string);
        }
        return res.json({ type, codes });
      } else if (type === 'note-templates') {
        const rows = await storage.db.select().from(schemas.noteTemplates).where((schemas.noteTemplates.id as any).in(ids as any));
        const codes: string[] = [];
        for (const r of rows) {
          let code = (r as any).shortCode as string | null;
          if (!code) {
            const gen = await (storage as any).generateUniqueShortCodeFor('noteTemplates');
            await storage.updateNoteTemplate((r as any).id, { shortCode: gen } as any);
            code = gen;
          }
          codes.push(code as string);
        }
        return res.json({ type, codes });
      } else if (type === 'autocomplete-items') {
        const rows = await storage.db.select().from(schemas.autocompleteItems).where((schemas.autocompleteItems.id as any).in(ids as any));
        const codes: string[] = [];
        for (const r of rows) {
          let code = (r as any).shortCode as string | null;
          if (!code) {
            const gen = await (storage as any).generateUniqueShortCodeFor('autocompleteItems');
            await storage.updateAutocompleteItem((r as any).id, { shortCode: gen } as any);
            code = gen;
          }
          codes.push(code as string);
        }
        return res.json({ type, codes });
      }
      return res.status(400).json({ error: 'Unsupported type' });
    } catch (err) {
      console.error('[Share Export] Error:', err);
      return res.status(500).json({ error: 'Export failed' });
    }
  });

  // Share/import by short codes
  app.post('/api/share/:type/import', requireAuth, async (req: any, res) => {
    try { await storage.ensureCoreSchema(); } catch {}
    const userId = getCurrentUserId(req);
    const { type } = req.params;
    const { codes } = req.body as { codes: string[] };
    if (!Array.isArray(codes) || codes.length === 0) return res.status(400).json({ error: 'codes required' });
    try {
      const results: any[] = [];
      for (const codeRaw of codes) {
        const code = String(codeRaw || '').toUpperCase().trim();
        if (!code) continue;
        if (type === 'smart-phrases') {
          const r = await (storage as any).importSmartPhraseByShortCode(code, userId);
          results.push({ code, success: r.success, message: r.message });
        } else if (type === 'note-templates') {
          const r = await (storage as any).importNoteTemplateByShortCode(code, userId);
          results.push({ code, success: r.success, message: r.message });
        } else if (type === 'autocomplete-items') {
          const r = await (storage as any).importAutocompleteByShortCode(code, userId);
          results.push({ code, success: r.success, message: r.message });
        }
      }
      return res.json({ type, results });
    } catch (err) {
      console.error('[Share Import] Error:', err);
      return res.status(500).json({ error: 'Import failed' });
    }
  });

  app.post("/api/smart-phrases", requireAuth, async (req, res) => {
    try {
      // Ensure schema before write
      try { await storage.ensureCoreSchema(); } catch {}
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
      let phrase;
      try {
        phrase = await storage.createSmartPhrase(phraseData);
      } catch (dbErr: any) {
        // On undefined table/column, attempt to ensure schema and retry once
        if (dbErr?.code === '42P01' || dbErr?.code === '42703') {
          await storage.ensureCoreSchema();
          phrase = await storage.createSmartPhrase(phraseData);
        } else {
          throw dbErr;
        }
      }
      
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
      const anyErr: any = error;
      res.status(500).json({ 
        message: "Failed to create smart phrase",
        code: anyErr?.code,
        detail: anyErr?.detail || anyErr?.message || String(error),
      });
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
      const anyErr: any = error;
      res.status(500).json({ message: "Failed to initialize table", error: anyErr?.message || String(error) });
    }
  });

  // Autocomplete items endpoints
  app.get("/api/autocomplete-items", requireAuth, async (req, res) => {
    try {
      try { await storage.ensureCoreSchema(); } catch {}
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
      
      // Ensure schema before write
      try { await storage.ensureCoreSchema(); } catch {}
      let item;
      try {
        item = await storage.createAutocompleteItem(itemData);
      } catch (error) {
        console.error("[Autocomplete] Create failed, table might not exist, attempting to create it:", error);
        
        // Try to create the table if it doesn't exist
        try {
          await storage.ensureCoreSchema();
          
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
      
      const anyErr: any = error;
      res.status(500).json({ 
        message: "Failed to create autocomplete item",
        code: anyErr?.code,
        detail: anyErr?.detail || anyErr?.message || String(error)
      });
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

  // -------------------------
  // Teams management routes
  // -------------------------
  async function ensureTeamMember(userId: string, teamId: string) {
    const members = await storage.getTeamMembers(teamId);
    const isMember = members.some(m => m.userId === userId);
    if (!isMember) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    return members;
  }

  app.get("/api/teams", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      try { await storage.deleteExpiredTeams(); } catch {}
      const userTeams = await storage.getUserTeams(userId);
      res.json(userTeams);
    } catch (error) {
      console.error("[Teams] Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams/create", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      try { await storage.deleteExpiredTeams(); } catch {}
      const { name, description } = req.body as { name: string; description?: string };

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Team name is required" });
      }

      // Ensure user exists for FK constraints
      let user = await storage.getUser(userId);
      if (!user) {
        const claims: any = (req as any).user?.claims || (req as any).user || {};
        user = await storage.createUser({
          id: userId,
          email: claims.email || 'user@example.com',
          firstName: claims.first_name || claims.given_name || claims.name?.split(' ')[0] || 'User',
          lastName: claims.last_name || claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '',
          specialty: 'General Practice',
        } as any);
      }

      const teamData = {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: userId,
        groupCode: await storage.generateUniqueGroupCode(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } as schemas.InsertTeam;

      const newTeam = await storage.createTeam(teamData);
      res.json(newTeam);
    } catch (error: any) {
      console.error("[Teams] Error creating team:", error);
      res.status(500).json({ 
        error: "Failed to create team",
        detail: error?.message || String(error)
      });
    }
  });

  app.post("/api/teams/join", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      try { await storage.deleteExpiredTeams(); } catch {}
      const { groupCode } = req.body as { groupCode?: string };

      if (!groupCode || !groupCode.trim()) {
        return res.status(400).json({ error: "Group code is required" });
      }

      // Ensure user exists for FK constraints
      let user = await storage.getUser(userId);
      if (!user) {
        const claims: any = (req as any).user?.claims || (req as any).user || {};
        user = await storage.createUser({
          id: userId,
          email: claims.email || 'user@example.com',
          firstName: claims.first_name || claims.given_name || claims.name?.split(' ')[0] || 'User',
          lastName: claims.last_name || claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '',
          specialty: 'General Practice',
        } as any);
      }

      const now = Date.now();
      const rl = joinRate.get(userId);
      if (!rl || rl.resetAt < now) {
        joinRate.set(userId, { count: 0, resetAt: now + 60 * 60 * 1000 });
      }
      const current = joinRate.get(userId)!;
      if (current.count >= 20) {
        return res.status(429).json({ error: "Too many join attempts. Try again later." });
      }
      current.count++;

      const result = await storage.joinTeamByGroupCode(groupCode.trim(), userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("[Teams] Error joining team:", error);
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  app.post("/api/teams/:teamId/leave", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const { teamId } = req.params as { teamId: string };
      await ensureTeamMember(userId, teamId);
      const result = await storage.leaveTeam(teamId, userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("[Teams] Error leaving team:", error);
      res.status(500).json({ error: "Failed to leave team" });
    }
  });

  app.get("/api/teams/:teamId/members", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const userId = getCurrentUserId(req);
      await ensureTeamMember(userId, teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("[Teams] Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Team todos
  app.get("/api/teams/:teamId/todos", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const userId = getCurrentUserId(req);
      await ensureTeamMember(userId, teamId);
      const todos = await storage.getTeamTodos(teamId);
      res.json(todos);
    } catch (error) {
      console.error("[Teams] Error fetching team todos:", error);
      res.status(500).json({ message: "Failed to fetch team todos" });
    }
  });

  app.post("/api/teams/:teamId/todos", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const userId = getCurrentUserId(req);
      await ensureTeamMember(userId, teamId);
      const todoData = schemas.insertTeamTodoSchema.parse({
        ...req.body,
        teamId,
        createdById: userId,
      });
      const todo = await storage.createTeamTodo(todoData);
      if (Array.isArray((req.body as any).assigneeIds)) {
        await storage.db.delete(schemas.teamTodoAssignees).where(eq(schemas.teamTodoAssignees.todoId, todo.id));
        for (const uid of (req.body as any).assigneeIds) {
          await storage.db.insert(schemas.teamTodoAssignees).values({ todoId: todo.id, userId: uid } as any);
        }
      }
      res.json(todo);
    } catch (error) {
      console.error("[Teams] Error creating team todo:", error);
      res.status(500).json({ message: "Failed to create team todo" });
    }
  });

  app.put("/api/todos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const updates = schemas.insertTeamTodoSchema.partial().parse(req.body);
      const [row]: any = await storage.db.select().from(schemas.teamTodos).where(eq(schemas.teamTodos.id, id));
      if (!row) return res.status(404).json({ message: 'Todo not found' });
      await ensureTeamMember(getCurrentUserId(req), row.teamId);
      const todo = await storage.updateTeamTodo(id, updates);
      if (Array.isArray((req.body as any).assigneeIds)) {
        await storage.db.delete(schemas.teamTodoAssignees).where(eq(schemas.teamTodoAssignees.todoId, id));
        for (const uid of (req.body as any).assigneeIds) {
          await storage.db.insert(schemas.teamTodoAssignees).values({ todoId: id, userId: uid } as any);
        }
      }
      res.json(todo);
    } catch (error) {
      console.error("[Teams] Error updating team todo:", error);
      res.status(500).json({ message: "Failed to update team todo" });
    }
  });

  app.delete("/api/todos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const [row]: any = await storage.db.select().from(schemas.teamTodos).where(eq(schemas.teamTodos.id, id));
      if (!row) return res.status(404).json({ message: 'Todo not found' });
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, row.teamId);
      const creatorMembership = members.find(m => m.userId === row.createdById);
      const me = members.find(m => m.userId === userId);
      if (creatorMembership?.role === 'admin' && me?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can delete this task' });
      }
      await storage.deleteTeamTodo(id);
      res.json({ message: 'Deleted' });
    } catch (error) {
      console.error("[Teams] Error deleting team todo:", error);
      res.status(500).json({ message: "Failed to delete team todo" });
    }
  });

  // Team calendar
  app.get("/api/teams/:teamId/calendar", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      await ensureTeamMember(getCurrentUserId(req), teamId);
      const events = await storage.getTeamCalendarEvents(teamId);
      res.json(events);
    } catch (error) {
      console.error("[Teams] Error fetching team calendar:", error);
      res.status(500).json({ message: "Failed to fetch team calendar" });
    }
  });

  app.post("/api/teams/:teamId/calendar", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const userId = getCurrentUserId(req);
      await ensureTeamMember(userId, teamId);
      const eventData = schemas.insertTeamCalendarEventSchema.parse({ ...req.body, teamId, createdById: userId });
      const ev = await storage.createTeamCalendarEvent(eventData);
      res.json(ev);
    } catch (error) {
      console.error("[Teams] Error creating team event:", error);
      res.status(500).json({ message: "Failed to create team event" });
    }
  });

  app.put("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const [row]: any = await storage.db.select().from(schemas.teamCalendarEvents).where(eq(schemas.teamCalendarEvents.id, id));
      if (!row) return res.status(404).json({ message: 'Event not found' });
      await ensureTeamMember(getCurrentUserId(req), row.teamId);
      const updates = schemas.insertTeamCalendarEventSchema.partial().parse(req.body);
      const ev = await storage.updateTeamCalendarEvent(id, updates);
      res.json(ev);
    } catch (error) {
      console.error("[Teams] Error updating team event:", error);
      res.status(500).json({ message: "Failed to update team event" });
    }
  });

  app.delete("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const [row]: any = await storage.db.select().from(schemas.teamCalendarEvents).where(eq(schemas.teamCalendarEvents.id, id));
      if (!row) return res.status(404).json({ message: 'Event not found' });
      await ensureTeamMember(getCurrentUserId(req), row.teamId);
      await storage.deleteTeamCalendarEvent(id);
      res.json({ message: 'Deleted' });
    } catch (error) {
      console.error("[Teams] Error deleting team event:", error);
      res.status(500).json({ message: "Failed to delete team event" });
    }
  });

  // Prolong, rename, disband, remove member
  app.post("/api/teams/:teamId/prolong", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const members = await ensureTeamMember(getCurrentUserId(req), teamId);
      const me = members.find(m => m.userId === getCurrentUserId(req));
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can prolong team' });
      const [updated] = await storage.db
        .update(schemas.teams)
        .set({ expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } as any)
        .where(eq(schemas.teams.id, teamId))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error('[Teams] Error prolonging team:', error);
      res.status(500).json({ error: 'Failed to prolong team' });
    }
  });

  app.post("/api/teams/:teamId/rename", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const { name, description } = req.body as { name?: string; description?: string | null };
      const members = await ensureTeamMember(getCurrentUserId(req), teamId);
      const me = members.find(m => m.userId === getCurrentUserId(req));
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can rename team' });
      const updates: Partial<schemas.InsertTeam> = {};
      if (typeof name === 'string') (updates as any).name = name;
      if (typeof description !== 'undefined') (updates as any).description = description;
      const [updated] = await storage.db
        .update(schemas.teams)
        .set(updates as any)
        .where(eq(schemas.teams.id, teamId))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error('Error renaming team:', error);
      res.status(500).json({ error: 'Failed to rename team' });
    }
  });

  app.post("/api/teams/:teamId/disband", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can disband team' });
      await storage.db.delete(schemas.teams).where(eq(schemas.teams.id, teamId));
      res.json({ message: 'Team disbanded' });
    } catch (error) {
      console.error('Error disbanding team:', error);
      res.status(500).json({ error: 'Failed to disband team' });
    }
  });

  app.post("/api/teams/:teamId/members/:memberId/remove", requireAuth, async (req, res) => {
    try {
      const { teamId, memberId } = req.params as { teamId: string; memberId: string };
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can remove members' });
      const target = members.find(m => m.userId === memberId);
      if (!target) return res.status(404).json({ error: 'Member not found' });
      if (target.role === 'admin') return res.status(403).json({ error: 'Cannot remove another admin. Transfer their role first.' });
      await storage.db.delete(schemas.teamMembers).where(and(eq(schemas.teamMembers.userId, memberId), eq(schemas.teamMembers.teamId, teamId)));
      res.json({ message: 'Member removed' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  });

  // Bulletin
  app.get("/api/teams/:teamId/bulletin", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      await ensureTeamMember(getCurrentUserId(req), teamId);
      const posts = await storage.getTeamBulletinPosts(teamId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching bulletin:', error);
      res.status(500).json({ message: 'Failed to fetch bulletin' });
    }
  });

  app.post("/api/teams/:teamId/bulletin", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params as { teamId: string };
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      const postData = schemas.insertTeamBulletinPostSchema.parse({ ...req.body, teamId, createdById: userId });
      const post = await storage.createTeamBulletinPost(postData, me?.role || 'member');
      res.json(post);
    } catch (error) {
      console.error('Error creating bulletin post:', error);
      res.status(500).json({ message: 'Failed to create bulletin post' });
    }
  });

  app.put("/api/bulletin/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const [row]: any = await storage.db.select().from(schemas.teamBulletinPosts).where(eq(schemas.teamBulletinPosts.id, id));
      if (!row) return res.status(404).json({ message: 'Post not found' });
      const members = await ensureTeamMember(getCurrentUserId(req), row.teamId);
      const me = members.find(m => m.userId === getCurrentUserId(req));
      if (row.isAdminPost && me?.role !== 'admin') return res.status(403).json({ message: 'Cannot edit admin post' });
      const updates = schemas.insertTeamBulletinPostSchema.partial().parse(req.body);
      const post = await storage.updateTeamBulletinPost(id, updates);
      res.json(post);
    } catch (error) {
      console.error('Error updating bulletin post:', error);
      res.status(500).json({ message: 'Failed to update bulletin post' });
    }
  });

  app.delete("/api/bulletin/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const [row]: any = await storage.db.select().from(schemas.teamBulletinPosts).where(eq(schemas.teamBulletinPosts.id, id));
      if (!row) return res.status(404).json({ message: 'Post not found' });
      const members = await ensureTeamMember(getCurrentUserId(req), row.teamId);
      const me = members.find(m => m.userId === getCurrentUserId(req));
      if (row.isAdminPost && me?.role !== 'admin') return res.status(403).json({ message: 'Cannot delete admin post' });
      await storage.deleteTeamBulletinPost(id);
      res.json({ message: 'Deleted' });
    } catch (error) {
      console.error('Error deleting bulletin post:', error);
      res.status(500).json({ message: 'Failed to delete bulletin post' });
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
