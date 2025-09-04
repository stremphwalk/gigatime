import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { requireAuth, optionalAuth, getCurrentUserId } from "./auth.js";
import { verifyClerkToken, syncClerkUser, getClerkUserId } from "./clerkAuth.js";
import session from "express-session";
import { 
  insertNoteSchema, 
  insertNoteTemplateSchema, 
  insertSmartPhraseSchema,
  insertTeamTodoSchema,
  insertTeamCalendarEventSchema,
  insertUserSchema,
  insertUserLabSettingSchema,
  insertAutocompleteItemSchema,
  smartPhrases,
  noteTemplates,
  autocompleteItems
} from "../shared/schema.js";
import { z } from "zod";
import { eq, or } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Auth0 if configured, otherwise use session for development
  if (process.env.AUTH0_CLIENT_ID) {
    const { setupAuth0 } = await import('./auth0.js');
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

  // Clerk sync endpoint (when Clerk is configured)
  app.post('/api/auth/sync', verifyClerkToken, syncClerkUser);

  // Auth routes with proper authentication
  app.get('/api/auth/user', optionalAuth, async (req: any, res) => {
    try {
      // In development mode, allow access unless explicitly logged out
      if (process.env.NODE_ENV === 'development') {
        // Initialize session if it doesn't exist
        if (!req.session) {
          req.session = {};
        }
        
        // Check if user has been explicitly logged out
        if (req.session.loggedOut === true) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        
        // Otherwise, use mock user
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
      
      // Production authentication logic
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist and we have claims from auth, create user from auth data
      if (!user && req.user?.claims) {
        const claims = req.user.claims;
        user = await storage.createUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name || "User",
          lastName: claims.last_name || "",
          specialty: "General Practice"
        });
      } else if (!user) {
        // Fallback for development mode
        user = await storage.createUser({
          id: userId,
          email: "doctor@hospital.com",
          firstName: "Dr. Sarah",
          lastName: "Mitchell",
          specialty: "Emergency Medicine"
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Development login route (when Auth0 is not configured)
  app.get('/api/auth/login', (req: any, res) => {
    if (!req.session) {
      req.session = {};
    }
    // Clear logout flag
    req.session.loggedOut = false;
    // Redirect to home
    res.redirect('/');
  });

  // Logout route
  app.post('/api/auth/logout', (req: any, res) => {
    // In development, mark as logged out but keep session
    if (process.env.NODE_ENV === 'development') {
      // Initialize session if it doesn't exist
      if (!req.session) {
        req.session = {};
      }
      req.session.loggedOut = true;
      return res.json({ message: 'Logged out successfully' });
    }
    
    // In production, properly logout with Replit Auth
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      // Destroy the session completely in production
      req.session.destroy((sessionErr: any) => {
        if (sessionErr) {
          console.error('Session destroy error:', sessionErr);
          return res.status(500).json({ message: 'Failed to clear session' });
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Login route for development
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      // In development, clear the logged out flag
      if (process.env.NODE_ENV === 'development') {
        // Initialize session if it doesn't exist
        if (!req.session) {
          req.session = {};
        }
        req.session.loggedOut = false;
        res.json({ message: 'Logged in successfully' });
      } else {
        res.status(400).json({ message: 'Manual login not available in production' });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Initialize user endpoint
  app.post("/api/init-user", requireAuth, async (req, res) => {
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
      res.json({ message: "User initialized", user });
    } catch (error) {
      console.error("Error initializing user:", error);
      res.status(500).json({ message: "Failed to initialize user" });
    }
  });

  // Note template routes
  app.get("/api/note-templates", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Auto-initialize default templates if they don't exist
      const existingTemplates = await storage.getNoteTemplates();
      const existingDefaultTemplates = existingTemplates.filter(t => t.isDefault);
      
      if (existingDefaultTemplates.length === 0) {
        // Create default templates automatically
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
      const templateData = insertNoteTemplateSchema.parse({ ...req.body, userId });
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

  app.put("/api/note-templates/:id", requireAuth, async (req, res) => {
    const startTime = Date.now();
    console.log("[PUT /api/note-templates] Request received", { 
      id: req.params.id,
      timestamp: new Date().toISOString(),
      bodyKeys: Object.keys(req.body || {})
    });
    
    try {
      const { id } = req.params;
      console.log("[PUT /api/note-templates] Raw request body:", JSON.stringify(req.body, null, 2));
      
      const templateData = insertNoteTemplateSchema.partial().parse(req.body);
      console.log("[PUT /api/note-templates] Schema validation passed", {
        hasName: !!templateData.name,
        hasType: !!templateData.type,
        hasSections: !!(templateData as any).sections,
        sectionsLen: Array.isArray((templateData as any).sections) ? (templateData as any).sections.length : null,
      });
      
      console.log("[PUT /api/note-templates] Starting database update...");
      const template = await storage.updateNoteTemplate(id, templateData);
      console.log("[PUT /api/note-templates] Database update successful", { 
        id: template.id,
        timeTaken: Date.now() - startTime + 'ms'
      });
      
      console.log("[PUT /api/note-templates] Sending response", { statusCode: 200 });
      return res.status(200).json(template);
    } catch (error) {
      console.error("[PUT /api/note-templates] ERROR:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timeTaken: Date.now() - startTime + 'ms'
      });
      
      // Handle Zod validation errors specifically
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors = (error as any).issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        console.log("[PUT /api/note-templates] Sending validation error response", { statusCode: 400 });
        return res.status(400).json({ 
          message: "Validation failed", 
          error: `Invalid template data: ${validationErrors}` 
        });
      }
      
      console.log("[PUT /api/note-templates] Sending error response", { statusCode: 500 });
      return res.status(500).json({ 
        message: "Failed to update note template", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.delete("/api/note-templates/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNoteTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting note template:", error);
      res.status(500).json({ message: "Failed to delete note template" });
    }
  });

  app.post("/api/note-templates/import", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      // Ensure user exists for FK constraints
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
      const { shareableId } = req.body;

      if (!shareableId || !shareableId.trim()) {
        return res.status(400).json({ error: "Shareable ID is required" });
      }

      const result = await storage.importNoteTemplate(shareableId.trim().toUpperCase(), userId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Error importing template:", error);
      res.status(500).json({ error: "Failed to import template" });
    }
  });

  // Note routes
  app.get("/api/notes", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const notes = await storage.getNotes(userId, limit);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
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

  app.put("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const noteData = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(id, noteData);
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNote(id);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Deepgram API key endpoint
  app.get("/api/deepgram-key", requireAuth, (req, res) => {
    res.json({ apiKey: process.env.DEEPGRAM_API_KEY });
  });

  // Smart phrase routes
  app.get("/api/smart-phrases", optionalAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub || 'default-user';
      
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
      
      // Helper to project DB elements into client-friendly type/options
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
        // Fallback when multiple/mixed elements exist
        return { ...base, type: 'text', options: null };
      };

      let phrases;
      if (query) {
        phrases = await storage.searchSmartPhrases(userId, query);
      } else {
        phrases = await storage.getSmartPhrases(userId);
      }

      // Enrich with computed fields for the current UI
      const enriched = (phrases || []).map(mapElementsToClient);
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching smart phrases:", error);
      res.status(500).json({ message: "Failed to fetch smart phrases" });
    }
  });

  app.post("/api/smart-phrases", optionalAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub || 'default-user';
      
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
      
      // Accept client payload with type/options and convert to elements
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
      const phraseData = insertSmartPhraseSchema.parse({ ...body, userId });
      const phrase = await storage.createSmartPhrase(phraseData);
      // Respond enriched for UI based on stored elements
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
  // Batch export/import via short codes
  app.post('/api/share/:type/export', requireAuth, async (req: any, res) => {
    const userId = req.user?.id;
    const { type } = req.params;
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids required' });
    try {
      if (type === 'smart-phrases') {
        const rows = await storage.db.select().from(smartPhrases).where(or(...ids.map(id => eq(smartPhrases.id, id))));
        const codes: string[] = [];
        for (const r of rows) {
          let code = r.shortCode;
          if (!code) {
            // Generate and persist
            const gen = await (storage as any).generateUniqueShortCodeFor('smartPhrases');
            await storage.updateSmartPhrase(r.id, { shortCode: gen } as any);
            code = gen;
          }
          codes.push(code);
        }
        return res.json({ type, codes });
      } else if (type === 'note-templates') {
        const rows = await storage.db.select().from(noteTemplates).where(or(...ids.map(id => eq(noteTemplates.id, id))));
        const codes: string[] = [];
        for (const r of rows) {
          let code = (r as any).shortCode as string | null;
          if (!code) {
            const gen = await (storage as any).generateUniqueShortCodeFor('noteTemplates');
            await storage.updateNoteTemplate(r.id, { shortCode: gen } as any);
            code = gen;
          }
          codes.push(code);
        }
        return res.json({ type, codes });
      } else if (type === 'autocomplete-items') {
        const rows = await storage.db.select().from(autocompleteItems).where(or(...ids.map(id => eq(autocompleteItems.id, id))));
        const codes: string[] = [];
        for (const r of rows) {
          let code = (r as any).shortCode as string | null;
          if (!code) {
            const gen = await (storage as any).generateUniqueShortCodeFor('autocompleteItems');
            await storage.updateAutocompleteItem(r.id, { shortCode: gen } as any);
            code = gen;
          }
          codes.push(code);
        }
        return res.json({ type, codes });
      }
      return res.status(400).json({ error: 'Unsupported type' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Export failed' });
    }
  });

  app.post('/api/share/:type/import', requireAuth, async (req: any, res) => {
    const userId = req.user?.id;
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
      console.error(err);
      return res.status(500).json({ error: 'Import failed' });
    }
  });

  app.put("/api/smart-phrases/:id", requireAuth, async (req, res) => {
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
      
      const { id } = req.params;
      // Accept client payload with type/options and convert to elements when present
      const body = { ...req.body } as any;
      if (!body.elements && (body.type || body.options)) {
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
      const phraseData = insertSmartPhraseSchema.partial().parse(body);
      const phrase = await storage.updateSmartPhrase(id, phraseData);
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
      console.error("Error updating smart phrase:", error);
      res.status(500).json({ message: "Failed to update smart phrase" });
    }
  });

  app.delete("/api/smart-phrases/:id", requireAuth, async (req, res) => {
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
      
      const { id } = req.params;
      await storage.deleteSmartPhrase(id);
      res.json({ message: "Smart phrase deleted successfully" });
    } catch (error) {
      console.error("Error deleting smart phrase:", error);
      res.status(500).json({ message: "Failed to delete smart phrase" });
    }
  });

  app.post("/api/smart-phrases/import/:shareableId", requireAuth, async (req: any, res) => {
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
      
      const { shareableId } = req.params;

      if (!shareableId || !shareableId.trim()) {
        return res.status(400).json({ error: "Shareable ID is required" });
      }

      const result = await storage.importSmartPhrase(shareableId.trim().toUpperCase(), userId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Error importing smart phrase:", error);
      res.status(500).json({ error: "Failed to import smart phrase" });
    }
  });

  // Teams management routes
  app.get("/api/teams", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const userTeams = await storage.getUserTeams(userId);
      res.json(userTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams/create", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Team name is required" });
      }

      const teamData = {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: userId,
        groupCode: await storage.generateUniqueGroupCode(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      const newTeam = await storage.createTeam(teamData);
      res.json(newTeam);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.post("/api/teams/join", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const { groupCode } = req.body;

      if (!groupCode || !groupCode.trim()) {
        return res.status(400).json({ error: "Group code is required" });
      }

      const result = await storage.joinTeamByGroupCode(groupCode.trim(), userId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Error joining team:", error);
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  app.post("/api/teams/:teamId/leave", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const { teamId } = req.params;

      const result = await storage.leaveTeam(teamId, userId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Error leaving team:", error);
      res.status(500).json({ error: "Failed to leave team" });
    }
  });

  app.get("/api/teams/:teamId/members", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Team todo routes
  app.get("/api/teams/:teamId/todos", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const todos = await storage.getTeamTodos(teamId);
      res.json(todos);
    } catch (error) {
      console.error("Error fetching team todos:", error);
      res.status(500).json({ message: "Failed to fetch team todos" });
    }
  });

  app.post("/api/teams/:teamId/todos", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const userId = getCurrentUserId(req);
      const todoData = insertTeamTodoSchema.parse({ 
        ...req.body, 
        teamId, 
        createdById: userId 
      });
      const todo = await storage.createTeamTodo(todoData);
      res.json(todo);
    } catch (error) {
      console.error("Error creating team todo:", error);
      res.status(500).json({ message: "Failed to create team todo" });
    }
  });

  app.put("/api/todos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const todoData = insertTeamTodoSchema.partial().parse(req.body);
      const todo = await storage.updateTeamTodo(id, todoData);
      res.json(todo);
    } catch (error) {
      console.error("Error updating team todo:", error);
      res.status(500).json({ message: "Failed to update team todo" });
    }
  });

  app.delete("/api/todos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTeamTodo(id);
      res.json({ message: "Todo deleted successfully" });
    } catch (error) {
      console.error("Error deleting team todo:", error);
      res.status(500).json({ message: "Failed to delete team todo" });
    }
  });

  // Team calendar routes
  app.get("/api/teams/:teamId/calendar", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const events = await storage.getTeamCalendarEvents(teamId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/teams/:teamId/calendar", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const userId = getCurrentUserId(req);
      const eventData = insertTeamCalendarEventSchema.parse({ 
        ...req.body, 
        teamId, 
        createdById: userId 
      });
      const event = await storage.createTeamCalendarEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.put("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const eventData = insertTeamCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateTeamCalendarEvent(id, eventData);
      res.json(event);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTeamCalendarEvent(id);
      res.json({ message: "Calendar event deleted successfully" });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Autocomplete items routes
  app.get("/api/autocomplete-items", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const category = req.query.category as string | undefined;

      // Ensure user exists (FK constraints)
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

      const items = category
        ? await storage.getAutocompleteItemsByCategory(userId, category)
        : await storage.getAutocompleteItems(userId);

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
          specialty: "Emergency Medicine",
        });
      }

      const itemData = insertAutocompleteItemSchema.parse({ ...req.body, userId });
      try {
        const item = await storage.createAutocompleteItem(itemData);
        return res.json(item);
      } catch (dbErr: any) {
        // Fallback: if DB columns for options don't exist yet, strip array fields and retry
        if (dbErr?.code === '42703') {
          const { dosageOptions, frequencyOptions, dosage, frequency, ...rest } = itemData as any;
          const fallbackData = {
            ...rest,
            // Backfill single fields if not provided
            dosage: dosage ?? (Array.isArray(dosageOptions) && dosageOptions.length === 1 ? dosageOptions[0] : undefined),
            frequency: frequency ?? (Array.isArray(frequencyOptions) && frequencyOptions.length === 1 ? frequencyOptions[0] : undefined),
          } as any;
          const item = await storage.createAutocompleteItem(fallbackData);
          return res.json(item);
        }
        throw dbErr;
      }
    } catch (error) {
      console.error("Error creating autocomplete item:", error);

      // Handle Zod validation errors
      if (error && typeof error === "object" && "issues" in (error as any)) {
        const validationErrors = (error as any).issues
          .map((issue: any) => `${issue.path.join('.')} : ${issue.message}`)
          .join(', ');
        return res.status(400).json({
          message: "Validation failed",
          error: `Invalid autocomplete item data: ${validationErrors}`,
        });
      }

      // Unique constraint violation (duplicate item)
      if ((error as any)?.code === '23505') {
        return res.status(409).json({ message: "Duplicate item", error: "An autocomplete item with this text already exists in this category." });
      }

      const debug = process.env.NODE_ENV === 'development' || process.env.NO_AUTH === '1';
      if (debug) {
        const anyErr: any = error;
        return res.status(500).json({ 
          message: "Failed to create autocomplete item", 
          code: anyErr?.code, 
          detail: anyErr?.detail || anyErr?.message || String(error)
        });
      }
      res.status(500).json({ message: "Failed to create autocomplete item" });
    }
  });

  app.put("/api/autocomplete-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const itemData = insertAutocompleteItemSchema.partial().parse(req.body);
      try {
        const item = await storage.updateAutocompleteItem(id, itemData);
        return res.json(item);
      } catch (dbErr: any) {
        if (dbErr?.code === '42703') {
          const { dosageOptions, frequencyOptions, ...rest } = itemData as any;
          const fallbackData = { ...rest } as any;
          const item = await storage.updateAutocompleteItem(id, fallbackData);
          return res.json(item);
        }
        throw dbErr;
      }
    } catch (error) {
      console.error("Error updating autocomplete item:", error);

      // Handle Zod validation errors
      if (error && typeof error === "object" && "issues" in (error as any)) {
        const validationErrors = (error as any).issues
          .map((issue: any) => `${issue.path.join('.')} : ${issue.message}`)
          .join(', ');
        return res.status(400).json({
          message: "Validation failed",
          error: `Invalid autocomplete item data: ${validationErrors}`,
        });
      }

      const anyErr: any = error;
      const debug = process.env.NODE_ENV === 'development' || process.env.NO_AUTH === '1';
      if (debug) {
        return res.status(500).json({ message: "Failed to update autocomplete item", code: anyErr?.code, detail: anyErr?.detail || anyErr?.message || String(error) });
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

  // Initialize default templates
  app.post("/api/init", optionalAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub || 'default-user';
      // Ensure user exists before creating default content that references the user
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
      
      // Check if default templates already exist
      const existingDefaultTemplates = await storage.getNoteTemplates();
      const currentDefaultTemplates = existingDefaultTemplates.filter(t => t.isDefault);
      if (currentDefaultTemplates.length > 0) {
        return res.json({ message: "Default templates already initialized" });
      }

      // Create default templates
      const defaultTemplates = [
        {
          name: "Admission Note",
          type: "admission",
          isDefault: true,
          userId: null, // Global template
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
          userId: null, // Global template
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
          userId: null, // Global template
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

      for (const template of defaultTemplates) {
        await storage.createNoteTemplate(template);
      }

      // Create default flexible smart phrases
      const defaultPhrases = [
        // Simple text phrases
        {
          trigger: "normal-heart-sounds",
          content: "Heart rate regular, no murmurs, gallops, or rubs appreciated.",
          description: "Normal cardiac examination",
          category: "cardiology",
          elements: [],
          isPublic: true,
          userId
        },
        {
          trigger: "clear-lungs",
          content: "Lungs clear to auscultation bilaterally, no wheezes, rales, or rhonchi.",
          description: "Normal pulmonary examination",
          category: "respiratory",
          elements: [],
          isPublic: true,
          userId
        },
        // Flexible admission phrase with multiple interactive elements
        {
          trigger: "admission",
          content: "Patient admitted on {{admission_date}} for {{reason}}. Current status: {{status}}. Pain level: {{pain}}. Plan: {{plan}}.",
          description: "Comprehensive admission note with date, reason, status, pain, and plan",
          category: "general",
          elements: [
            {
              id: "admission_date",
              type: "date",
              label: "Admission Date",
              placeholder: "{{admission_date}}"
            },
            {
              id: "reason",
              type: "multipicker",
              label: "Admission Reason",
              placeholder: "{{reason}}",
              options: [
                { id: "chest_pain", label: "Chest pain evaluation", value: "chest pain evaluation" },
                { id: "resp_distress", label: "Respiratory distress", value: "respiratory distress" },
                { id: "cardiac_mon", label: "Cardiac monitoring", value: "cardiac monitoring" },
                { id: "surgical", label: "Surgical procedure", value: "surgical procedure" }
              ]
            },
            {
              id: "status",
              type: "nested_multipicker",
              label: "Current Status",
              placeholder: "{{status}}",
              options: [
                {
                  id: "stable",
                  label: "Stable",
                  value: "stable",
                  children: [
                    { id: "stable_improving", label: "Improving", value: "stable and improving" },
                    { id: "stable_unchanged", label: "Unchanged", value: "stable and unchanged" }
                  ]
                },
                {
                  id: "critical",
                  label: "Critical", 
                  value: "critical",
                  children: [
                    { id: "critical_icu", label: "Requires ICU", value: "critical - requires ICU monitoring" },
                    { id: "critical_stable", label: "Stable in ICU", value: "critical but stable in ICU" }
                  ]
                }
              ]
            },
            {
              id: "pain",
              type: "multipicker",
              label: "Pain Level",
              placeholder: "{{pain}}",
              options: [
                { id: "mild", label: "Mild (1-3)", value: "mild (1-3 out of 10)" },
                { id: "moderate", label: "Moderate (4-6)", value: "moderate (4-6 out of 10)" },
                { id: "severe", label: "Severe (7-8)", value: "severe (7-8 out of 10)" },
                { id: "excruciating", label: "Excruciating (9-10)", value: "excruciating (9-10 out of 10)" }
              ]
            },
            {
              id: "plan",
              type: "multipicker",
              label: "Treatment Plan",
              placeholder: "{{plan}}",
              options: [
                { id: "obs", label: "Observation and monitoring", value: "observation and monitoring" },
                { id: "med_mgmt", label: "Medical management", value: "medical management" },
                { id: "surg_eval", label: "Surgical evaluation", value: "surgical evaluation" },
                { id: "discharge_plan", label: "Discharge planning", value: "discharge planning" }
              ]
            }
          ],
          isPublic: true,
          userId
        },
        // Discharge phrase with follow-up date
        {
          trigger: "discharge",
          content: "Patient discharged home on {{discharge_date}} in {{condition}} condition. {{instructions}} Follow-up appointment scheduled for {{followup_date}}.",
          description: "Discharge summary with date and follow-up",
          category: "general",
          elements: [
            {
              id: "discharge_date",
              type: "date",
              label: "Discharge Date",
              placeholder: "{{discharge_date}}"
            },
            {
              id: "condition",
              type: "multipicker",
              label: "Discharge Condition",
              placeholder: "{{condition}}",
              options: [
                { id: "stable", label: "Stable", value: "stable" },
                { id: "improved", label: "Improved", value: "improved" },
                { id: "unchanged", label: "Unchanged", value: "unchanged" }
              ]
            },
            {
              id: "instructions",
              type: "multipicker",
              label: "Discharge Instructions",
              placeholder: "{{instructions}}",
              options: [
                { id: "medications", label: "Continue medications as prescribed.", value: "Continue medications as prescribed." },
                { id: "activity", label: "Resume normal activities as tolerated.", value: "Resume normal activities as tolerated." },
                { id: "diet", label: "No dietary restrictions.", value: "No dietary restrictions." }
              ]
            },
            {
              id: "followup_date",
              type: "date",
              label: "Follow-up Date",
              placeholder: "{{followup_date}}"
            }
          ],
          isPublic: true,
          userId
        }
      ];

      for (const phrase of defaultPhrases) {
        await storage.createSmartPhrase(phrase);
      }

      res.json({ message: "Default templates and phrases initialized successfully" });
    } catch (error) {
      console.error("Error initializing defaults:", error);
      res.status(500).json({ message: "Failed to initialize defaults" });
    }
  });

  // Pertinent negative presets routes
  app.get("/api/pertinent-negative-presets", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const presets = await storage.getPertinentNegativePresets(userId);
      res.json(presets);
    } catch (error) {
      console.error("Error fetching pertinent negative presets:", error);
      res.status(500).json({ message: "Failed to fetch presets" });
    }
  });

  app.post("/api/pertinent-negative-presets", requireAuth, async (req, res) => {
    try {
      const preset = req.body;
      const created = await storage.createPertinentNegativePreset(preset);
      res.json(created);
    } catch (error) {
      console.error("Error creating pertinent negative preset:", error);
      res.status(500).json({ message: "Failed to create preset" });
    }
  });

  app.put("/api/pertinent-negative-presets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updatePertinentNegativePreset(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating pertinent negative preset:", error);
      res.status(500).json({ message: "Failed to update preset" });
    }
  });

  app.delete("/api/pertinent-negative-presets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePertinentNegativePreset(id);
      res.json({ message: "Preset deleted successfully" });
    } catch (error) {
      console.error("Error deleting pertinent negative preset:", error);
      res.status(500).json({ message: "Failed to delete preset" });
    }
  });

  // User lab settings routes
  app.get("/api/user-lab-settings", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const settings = await storage.getUserLabSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user lab settings:", error);
      res.status(500).json({ message: "Failed to fetch lab settings" });
    }
  });

  // Lab presets routes
  app.get("/api/lab-presets", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.sub || 'default-user';
      const presets = await storage.getLabPresets(userId);
      res.json(presets);
    } catch (error) {
      console.error("Error fetching lab presets:", error);
      res.status(500).json({ message: "Failed to fetch lab presets" });
    }
  });

  app.post("/api/lab-presets", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.sub || 'default-user';
      const { name, settings } = req.body || {};
      if (!name || !settings) return res.status(400).json({ message: 'name and settings required' });
      const created = await storage.createLabPreset({ userId, name, settings });
      res.json(created);
    } catch (error) {
      console.error("Error creating lab preset:", error);
      res.status(500).json({ message: "Failed to create lab preset" });
    }
  });

  app.put("/api/lab-presets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as any;
      const updated = await storage.updateLabPreset(id, req.body || {});
      res.json(updated);
    } catch (error) {
      console.error("Error updating lab preset:", error);
      res.status(500).json({ message: "Failed to update lab preset" });
    }
  });

  app.delete("/api/lab-presets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params as any;
      await storage.deleteLabPreset(id);
      res.json({ message: 'Deleted' });
    } catch (error) {
      console.error("Error deleting lab preset:", error);
      res.status(500).json({ message: "Failed to delete lab preset" });
    }
  });

  app.post("/api/user-lab-settings", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const setting = { ...req.body, userId };
      const created = await storage.upsertUserLabSetting(setting);
      res.json(created);
    } catch (error) {
      console.error("Error saving user lab setting:", error);
      res.status(500).json({ message: "Failed to save lab setting" });
    }
  });

  app.delete("/api/user-lab-settings", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const { panelId, labId } = req.query;
      await storage.deleteUserLabSetting(userId, panelId as string, labId as string);
      res.json({ message: "Lab setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting user lab setting:", error);
      res.status(500).json({ message: "Failed to delete lab setting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
