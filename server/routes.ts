import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { requireAuth, optionalAuth, getCurrentUserId } from "./auth.js";
import { verifyClerkToken, syncClerkUser, getClerkUserId } from "./clerkAuth.js";
import { applySecurity, configureAuthRateLimit } from "./security.js";
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
  autocompleteItems,
  users,
  runLists,
  listPatients,
  runListNotes,
  runListNoteVersions
} from "../shared/schema.js";
import { z } from "zod";
import { eq, or, and, lt, desc } from "drizzle-orm";
import { MEDICATIONS_SYSTEM_PROMPT, LABS_SYSTEM_PROMPT, PMH_SYSTEM_PROMPT, RUNLIST_SOAP_SYSTEM_PROMPT } from "./ai/prompts.js";
import { canonicalizeLab, canonicalizeVital, canonicalizeImagingType } from "./ai/canonical.js";
import { callNovaMicro, isNovaConfigured } from "./ai/nova.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security middleware first
  applySecurity(app);
  
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
        secure: (process.env.NODE_ENV as string) === 'production', // Secure cookies in production only
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        sameSite: (process.env.NODE_ENV as string) === 'production' ? 'strict' : 'lax' // Stricter in production
      }
    }));
  }

  // Ensure DB schema (helpful in dev and cold starts)
  try {
    await storage.ensureCoreSchema();
  } catch (err) {
    console.error('[Routes] Failed to ensure core schema:', err);
  }

  // Clerk sync endpoint (when Clerk is configured)
  app.post('/api/auth/sync', verifyClerkToken, syncClerkUser);

  // Auth routes with proper authentication and enhanced rate limiting
  app.use('/api/auth/', configureAuthRateLimit()); // Apply stricter rate limiting to auth endpoints
  
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

  // User preferences routes
  app.get('/api/user-preferences', requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs || { userId, data: {} });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ message: 'Failed to fetch preferences' });
    }
  });
  app.put('/api/user-preferences', requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const data = req.body?.data ?? {};
      const saved = await storage.upsertUserPreferences(userId, data);
      res.json(saved);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  // Soniox API key endpoint
  app.get("/api/soniox-key", requireAuth, (req, res) => {
    res.json({ apiKey: process.env.SONIOX_API_KEY });
  });

  // File-based transcription endpoint (Soniox batch)
  app.post('/api/transcribe', requireAuth, express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
    try {
      const apiKey = process.env.SONIOX_API_KEY;
      if (!apiKey) {
        return res.status(501).json({ message: 'SONIOX_API_KEY not configured' });
      }
      const buf: Buffer = Buffer.isBuffer(req.body) ? req.body as Buffer : Buffer.from(req.body as any);
      if (!buf || buf.length === 0) {
        return res.status(400).json({ message: 'Empty audio body' });
      }
      const mime = (req.query?.mime as string) || (req.headers['content-type'] as string) || 'application/octet-stream';

      // Map MIME to Soniox audio_format names
      const mapMimeToFormat = (m: string): string => {
        const mm = (m || '').toLowerCase();
        if (mm.includes('webm')) return 'WEBM_OPUS';
        if (mm.includes('ogg')) return 'OGG_OPUS';
        if (mm.includes('wav')) return 'WAV';
        if (mm.includes('x-wav')) return 'WAV';
        if (mm.includes('mpeg') || mm.includes('mp3')) return 'MP3';
        if (mm.includes('mp4')) return 'MP4';
        return 'AUTO';
      };
      const audio_format = mapMimeToFormat(mime);

      // Soniox batch transcription API
      const endpoint = process.env.SONIOX_API_URL || 'https://api.soniox.com/speech-recognition/v2/recognize';
      const audio_b64 = buf.toString('base64');
      const reqBody = {
        audio: audio_b64,
        audio_format,
        language: 'en',
        enable_punctuation: true,
        enable_inverse_text_normalization: true,
        diarize: false
      };

      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
      });

      if (!r.ok) {
        const t = await r.text().catch(() => '');
        console.error('[Soniox] Non-OK response:', r.status, t);
        return res.status(502).json({ message: 'Soniox error', status: r.status, details: t?.slice(0, 500) });
      }
      const json: any = await r.json().catch(() => ({}));

      // Attempt to extract transcript from common fields
      let text: string = '';
      if (typeof json?.text === 'string') text = json.text;
      else if (Array.isArray(json?.results) && json.results.length > 0 && typeof json.results[0]?.text === 'string') text = json.results[0].text;
      else if (typeof json?.result?.text === 'string') text = json.result.text;
      text = String(text || '').trim();

      return res.json({ text });
    } catch (error) {
      console.error('Error in /api/transcribe:', error);
      return res.status(500).json({ message: 'Failed to transcribe audio' });
    }
  });

  // AI: Parse medications from dictation via Amazon Nova Micro
  app.post("/api/ai/medications", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ dictation: z.string().min(1) });
      const { dictation } = schema.parse(req.body);

      if (!isNovaConfigured()) {
        return res.status(500).json({ message: "Amazon Nova Micro not configured. Please check AWS credentials and region." });
      }

      const systemPrompt = MEDICATIONS_SYSTEM_PROMPT;

      const response = await callNovaMicro({
        systemPrompt,
        userMessage: dictation,
        temperature: 0
      });

      // Sanitize to ensure strict format and compatibility with reordering
      const sanitize = (t: string) => (
        t
          .replace(/[\r]+/g, "\n")
          .split("\n")
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => l.replace(/^[\-*•\d+\.\)]\s*/, "")) // remove bullets/numbering
          .map(l => l.replace(/[\.\s]+$/, "")) // remove trailing periods/spaces
          .join("\n")
      );

      const text = sanitize(response.text);
      return res.json({ text });
    } catch (error: any) {
      console.error("Error in /api/ai/medications:", error);
      const message = error?.message || "Failed to process dictation";
      res.status(500).json({ message });
    }
  });

  // AI: Parse labs from dictation via Amazon Nova Micro
  app.post("/api/ai/labs", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ dictation: z.string().min(1) });
      const { dictation } = schema.parse(req.body);

      if (!isNovaConfigured()) {
        return res.status(500).json({ message: "Amazon Nova Micro not configured. Please check AWS credentials and region." });
      }

      const systemPrompt = LABS_SYSTEM_PROMPT;

      const response = await callNovaMicro({
        systemPrompt,
        userMessage: dictation,
        temperature: 0
      });

      // Minimal sanitize: normalize CR, trim lines, keep punctuation/arrows
      const sanitize = (t: string) => (
        t
          .replace(/[\r]+/g, "\n")
          .split("\n")
          .map(l => l.replace(/\s+$/g, ""))
          .join("\n")
      );

      const text = sanitize(response.text);
      return res.json({ text });
    } catch (error: any) {
      console.error("Error in /api/ai/labs:", error);
      const message = error?.message || "Failed to process dictation";
      res.status(500).json({ message });
    }
  });

  // AI: Parse Past Medical History (PMH) from dictation via Amazon Nova Micro
  app.post("/api/ai/pmh", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ dictation: z.string().min(1) });
      const { dictation } = schema.parse(req.body);

      if (!isNovaConfigured()) {
        return res.status(500).json({ message: "Amazon Nova Micro not configured. Please check AWS credentials and region." });
      }

      const systemPrompt = PMH_SYSTEM_PROMPT;

      const response = await callNovaMicro({
        systemPrompt,
        userMessage: dictation,
        temperature: 0
      });

      // Minimal sanitize: normalize CR, trim trailing spaces; keep exact formatting otherwise
      const sanitize = (t: string) => (
        t
          .replace(/[\r]+/g, "\n")
          .split("\n")
          .map(l => l.replace(/\s+$/g, ""))
          .join("\n")
      );

      const text = sanitize(response.text);
      return res.json({ text });
    } catch (error: any) {
      console.error("Error in /api/ai/pmh:", error);
      const message = error?.message || "Failed to process dictation";
      res.status(500).json({ message });
    }
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
          codes.push(code as string);
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
          codes.push(code as string);
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
          codes.push(code as string);
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
    // Ensure schema resiliency (cold starts / fresh envs)
    try { await storage.ensureCoreSchema(); } catch {}
    const userId = getCurrentUserId(req);
    // Ensure user exists to satisfy FK constraints
    try {
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
    } catch {}
    const { type } = req.params;
    const { codes } = req.body as { codes: string[] };
    if (!Array.isArray(codes) || codes.length === 0) return res.status(400).json({ error: 'codes required' });
    const results: any[] = [];
    for (const codeRaw of codes) {
      try {
        const code = String(codeRaw || '').toUpperCase().trim();
        if (!code) { results.push({ code: codeRaw, success: false, message: 'empty code' }); continue; }
        if (type === 'smart-phrases') {
          const r = await (storage as any).importSmartPhraseByShortCode(code, userId);
          results.push({ code, success: r.success, message: r.message });
        } else if (type === 'note-templates') {
          const r = await (storage as any).importNoteTemplateByShortCode(code, userId);
          results.push({ code, success: r.success, message: r.message });
        } else if (type === 'autocomplete-items') {
          const r = await (storage as any).importAutocompleteByShortCode(code, userId);
          results.push({ code, success: r.success, message: r.message });
        } else {
          results.push({ code, success: false, message: 'Unsupported type' });
        }
      } catch (err: any) {
        console.error('[Import] Error for code', codeRaw, err?.message || err);
        results.push({ code: codeRaw, success: false, message: err?.message || 'Import failed' });
      }
    }
    return res.json({ type, results });
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
  // Simple per-user rate limiter for joins
  const joinRate: Map<string, { count: number; resetAt: number }> = new Map();

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
      // Cleanup expired teams on access
      try { await storage.deleteExpiredTeams(); } catch {}
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
      try { await storage.deleteExpiredTeams(); } catch {}
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
      try { await storage.deleteExpiredTeams(); } catch {}
      const { groupCode } = req.body;

      if (!groupCode || !groupCode.trim()) {
        return res.status(400).json({ error: "Group code is required" });
      }

       // Basic rate limit: 20 join attempts/hour per user
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
      console.error("Error joining team:", error);
      res.status(500).json({ error: "Failed to join team" });
    }
  });

  app.post("/api/teams/:teamId/leave", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const { teamId } = req.params;

      await ensureTeamMember(userId, teamId);
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
      const userId = getCurrentUserId(req);
      await ensureTeamMember(userId, teamId);
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
      const userId = getCurrentUserId(req);
      await ensureTeamMember(userId, teamId);
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
      await ensureTeamMember(userId, teamId);
      const todoData = insertTeamTodoSchema.parse({ 
        ...req.body, 
        teamId, 
        createdById: userId 
      });
      const todo = await storage.createTeamTodo(todoData);
      // Optional: handle assigneeIds array
      if (Array.isArray((req.body as any).assigneeIds)) {
        const { teamTodoAssignees } = await import("../shared/schema.js");
        // Clear existing links
        await storage.db.delete(teamTodoAssignees).where(eq(teamTodoAssignees.todoId, todo.id));
        for (const uid of (req.body as any).assigneeIds) {
          await storage.db.insert(teamTodoAssignees).values({ todoId: todo.id, userId: uid } as any);
        }
      }
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
      // Enforce membership by fetching todo and checking its team
      const { teamTodos } = await import("../shared/schema.js");
      const [row]: any = await storage.db.select().from(teamTodos).where(eq(teamTodos.id, id));
      if (!row) return res.status(404).json({ message: 'Todo not found' });
      await ensureTeamMember(getCurrentUserId(req), row.teamId);
      const todo = await storage.updateTeamTodo(id, todoData);
      // Update assignees if provided
      if (Array.isArray((req.body as any).assigneeIds)) {
        const { teamTodoAssignees } = await import("../shared/schema.js");
        await storage.db.delete(teamTodoAssignees).where(eq(teamTodoAssignees.todoId, id));
        for (const uid of (req.body as any).assigneeIds) {
          await storage.db.insert(teamTodoAssignees).values({ todoId: id, userId: uid } as any);
        }
      }
      res.json(todo);
    } catch (error) {
      console.error("Error updating team todo:", error);
      res.status(500).json({ message: "Failed to update team todo" });
    }
  });

  app.delete("/api/todos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { teamTodos, teamMembers } = await import("../shared/schema.js");
      const [row]: any = await storage.db.select().from(teamTodos).where(eq(teamTodos.id, id));
      if (!row) return res.status(404).json({ message: 'Todo not found' });
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, row.teamId);
      // Prevent non-admin from deleting admin-created tasks
      const creatorMembership = members.find(m => m.userId === row.createdById);
      const me = members.find(m => m.userId === userId);
      if (creatorMembership?.role === 'admin' && me?.role !== 'admin') {
        return res.status(403).json({ message: 'Cannot delete admin-created task' });
      }
      await storage.deleteTeamTodo(id);
      res.json({ message: "Todo deleted successfully" });
    } catch (error) {
      console.error("Error deleting team todo:", error);
      res.status(500).json({ message: "Failed to delete team todo" });
    }
  });

  // Teams: transfer admin
  app.post("/api/teams/:teamId/transfer-admin", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const userId = getCurrentUserId(req);
      const { newAdminUserId } = req.body as { newAdminUserId?: string };
      if (!newAdminUserId) return res.status(400).json({ error: 'newAdminUserId is required' });
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can transfer admin role' });
      const target = members.find(m => m.userId === newAdminUserId);
      if (!target) return res.status(404).json({ error: 'Target user is not a member' });
      const { teamMembers } = await import("../shared/schema.js");
      // Promote target to admin
      await storage.db.update(teamMembers).set({ role: 'admin' } as any).where(eq(teamMembers.id, target.id));
      // Demote current admin to member
      await storage.db.update(teamMembers).set({ role: 'member' } as any).where(eq(teamMembers.id, me!.id));
      res.json({ message: 'Admin role transferred' });
    } catch (error) {
      console.error('Error transferring admin:', error);
      res.status(500).json({ error: 'Failed to transfer admin role' });
    }
  });

  // Team calendar routes
  app.get("/api/teams/:teamId/calendar", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      await ensureTeamMember(getCurrentUserId(req), teamId);
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
      await ensureTeamMember(userId, teamId);
      // Enforce event dates within team's active 7-day window
      const team = await storage.getTeam(teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });
      const expiresAt = new Date(team.expiresAt);
      const startWindow = new Date(expiresAt);
      startWindow.setDate(expiresAt.getDate() - 6);
      const eventData = insertTeamCalendarEventSchema.parse({ 
        ...req.body, 
        teamId, 
        createdById: userId 
      });
      const s = new Date(eventData.startDate as any);
      const e = new Date(eventData.endDate as any);
      if (s < startWindow || e > expiresAt) {
        return res.status(400).json({ message: 'Event must be within the team\'s active week' });
      }
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
      const { teamCalendarEvents } = await import("../shared/schema.js");
      const [row]: any = await storage.db.select().from(teamCalendarEvents).where(eq(teamCalendarEvents.id, id));
      if (!row) return res.status(404).json({ message: 'Event not found' });
      await ensureTeamMember(getCurrentUserId(req), row.teamId);
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
      const { teamCalendarEvents } = await import("../shared/schema.js");
      const [row]: any = await storage.db.select().from(teamCalendarEvents).where(eq(teamCalendarEvents.id, id));
      if (!row) return res.status(404).json({ message: 'Event not found' });
      await ensureTeamMember(getCurrentUserId(req), row.teamId);
      await storage.deleteTeamCalendarEvent(id);
      res.json({ message: "Calendar event deleted successfully" });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Teams: prolong expiry (admin only)
  app.post("/api/teams/:teamId/prolong", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can prolong team' });
      const team = await storage.getTeam(teamId);
      if (!team) return res.status(404).json({ error: 'Team not found' });
      const current = new Date(team.expiresAt);
      current.setDate(current.getDate() + 7);
      const [updated] = await storage.db
        .update((await import("../shared/schema.js")).teams)
        .set({ expiresAt: current, updatedAt: new Date() } as any)
        .where(eq((await import("../shared/schema.js")).teams.id, teamId))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error('Error prolonging team:', error);
      res.status(500).json({ error: 'Failed to prolong team' });
    }
  });

  // Teams: rename (admin only)
  app.post("/api/teams/:teamId/rename", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can rename team' });
      const { name, description } = req.body as { name?: string; description?: string | null };
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      const { teams } = await import("../shared/schema.js");
      const [updated] = await storage.db
        .update(teams)
        .set({ name: name.trim(), description: description ?? null, updatedAt: new Date() } as any)
        .where(eq(teams.id, teamId))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error('Error renaming team:', error);
      res.status(500).json({ error: 'Failed to rename team' });
    }
  });

  // Teams: disband (admin only)
  app.post("/api/teams/:teamId/disband", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can disband team' });
      const { teams } = await import("../shared/schema.js");
      await storage.db.delete(teams).where(eq(teams.id, teamId));
      res.json({ message: 'Team disbanded' });
    } catch (error) {
      console.error('Error disbanding team:', error);
      res.status(500).json({ error: 'Failed to disband team' });
    }
  });

  // Teams: remove member (admin only)
  app.post("/api/teams/:teamId/members/:memberId/remove", requireAuth, async (req, res) => {
    try {
      const { teamId, memberId } = req.params;
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      if (me?.role !== 'admin') return res.status(403).json({ error: 'Only admin can remove members' });
      const { teamMembers } = await import("../shared/schema.js");
      const target = members.find(m => m.userId === memberId);
      if (!target) return res.status(404).json({ error: 'Member not found' });
      if (target.role === 'admin') return res.status(403).json({ error: 'Cannot remove another admin. Transfer their role first.' });
      const { and } = await import("drizzle-orm");
      await storage.db.delete(teamMembers).where(and(eq(teamMembers.userId, memberId), eq(teamMembers.teamId, teamId)));
      res.json({ message: 'Member removed' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  });

  // Bulletin routes
  app.get("/api/teams/:teamId/bulletin", requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
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
      const { teamId } = req.params;
      const userId = getCurrentUserId(req);
      const members = await ensureTeamMember(userId, teamId);
      const me = members.find(m => m.userId === userId);
      const { insertTeamBulletinPostSchema } = await import("../shared/schema.js");
      const postData = insertTeamBulletinPostSchema.parse({ ...req.body, teamId, createdById: userId });
      const post = await storage.createTeamBulletinPost(postData, me?.role || 'member');
      res.json(post);
    } catch (error) {
      console.error('Error creating bulletin post:', error);
      res.status(500).json({ message: 'Failed to create bulletin post' });
    }
  });

  app.put("/api/bulletin/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { teamBulletinPosts } = await import("../shared/schema.js");
      const [row]: any = await storage.db.select().from(teamBulletinPosts).where(eq(teamBulletinPosts.id, id));
      if (!row) return res.status(404).json({ message: 'Post not found' });
      const members = await ensureTeamMember(getCurrentUserId(req), row.teamId);
      const me = members.find(m => m.userId === getCurrentUserId(req));
      if (row.isAdminPost && me?.role !== 'admin') return res.status(403).json({ message: 'Cannot edit admin post' });
      const { insertTeamBulletinPostSchema } = await import("../shared/schema.js");
      const updates = insertTeamBulletinPostSchema.partial().parse(req.body);
      const post = await storage.updateTeamBulletinPost(id, updates);
      res.json(post);
    } catch (error) {
      console.error('Error updating bulletin post:', error);
      res.status(500).json({ message: 'Failed to update bulletin post' });
    }
  });

  app.delete("/api/bulletin/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { teamBulletinPosts } = await import("../shared/schema.js");
      const [row]: any = await storage.db.select().from(teamBulletinPosts).where(eq(teamBulletinPosts.id, id));
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

  // Community routes (authenticated)
  app.get('/api/community', requireAuth, async (req: any, res) => {
    try {
      const tab = String(req.query.tab || 'all'); // 'all' | 'popular'
      const type = String(req.query.type || 'all'); // 'all' | 'templates' | 'smart-phrases' | 'autocomplete'
      const category = req.query.category ? String(req.query.category) : undefined;
      const q = req.query.q ? String(req.query.q) : undefined;
      const sort = String(req.query.sort || (tab === 'popular' ? 'downloads' : 'newest')); // 'downloads' | 'newest'
      const page = Math.max(1, parseInt(String(req.query.page || '1')));
      const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || '20'))));
      const popularThreshold = 5;

      // Helper to build LIKE value
      const likeExpr = (val: string) => `%${val}%`;

      // Fetchers per type (join with users for publisher identity)
      const fetchTemplates = async () => {
        // note_templates are public-only
        let rows = await storage.db
          .select({
            id: noteTemplates.id,
            title: noteTemplates.name,
            description: noteTemplates.description,
            shortCode: noteTemplates.shortCode,
            downloadCount: noteTemplates.downloadCount,
            createdAt: noteTemplates.createdAt,
            userId: noteTemplates.userId,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            userEmail: users.email,
          })
          .from(noteTemplates)
          .leftJoin(users, eq(noteTemplates.userId, users.id))
          .where(eq(noteTemplates.isPublic, true));
        if (q) {
          rows = rows.filter(r =>
            (r.title?.toLowerCase().includes(q.toLowerCase()) ||
             (r.description || '').toLowerCase().includes(q.toLowerCase()))
          );
        }
        if (tab === 'popular') rows = rows.filter(r => (r.downloadCount || 0) >= popularThreshold);
        return rows.map(r => ({ ...r, kind: 'template', category: null }));
      };

      const fetchSmartPhrases = async () => {
        let rows = await storage.db
          .select({
            id: smartPhrases.id,
            title: smartPhrases.trigger,
            description: smartPhrases.description,
            category: smartPhrases.category,
            shortCode: smartPhrases.shortCode,
            downloadCount: smartPhrases.downloadCount,
            createdAt: smartPhrases.createdAt,
            userId: smartPhrases.userId,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            userEmail: users.email,
          })
          .from(smartPhrases)
          .leftJoin(users, eq(smartPhrases.userId, users.id))
          .where(eq(smartPhrases.isPublic, true));
        if (category) rows = rows.filter(r => r.category === category);
        if (q) {
          const ql = q.toLowerCase();
          rows = rows.filter(r =>
            (r.title?.toLowerCase().includes(ql) ||
             (r.description || '').toLowerCase().includes(ql))
          );
        }
        if (tab === 'popular') rows = rows.filter(r => (r.downloadCount || 0) >= popularThreshold);
        return rows.map(r => ({ ...r, kind: 'smart-phrase' as const }));
      };

      const fetchAutocomplete = async () => {
        let rows = await storage.db
          .select({
            id: autocompleteItems.id,
            title: autocompleteItems.text,
            description: autocompleteItems.description,
            category: autocompleteItems.category,
            shortCode: autocompleteItems.shortCode,
            downloadCount: autocompleteItems.downloadCount,
            createdAt: autocompleteItems.createdAt,
            userId: autocompleteItems.userId,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            userEmail: users.email,
          })
          .from(autocompleteItems)
          .leftJoin(users, eq(autocompleteItems.userId, users.id))
          .where(eq(autocompleteItems.isPublic, true));
        if (category) rows = rows.filter(r => r.category === category);
        if (q) {
          const ql = q.toLowerCase();
          rows = rows.filter(r =>
            (r.title?.toLowerCase().includes(ql) ||
             (r.description || '').toLowerCase().includes(ql))
          );
        }
        if (tab === 'popular') rows = rows.filter(r => (r.downloadCount || 0) >= popularThreshold);
        return rows.map(r => ({ ...r, kind: 'autocomplete' as const }));
      };

      let items: any[] = [];
      if (type === 'templates') items = await fetchTemplates();
      else if (type === 'smart-phrases') items = await fetchSmartPhrases();
      else if (type === 'autocomplete') items = await fetchAutocomplete();
      else {
        const [t, s, a] = await Promise.all([fetchTemplates(), fetchSmartPhrases(), fetchAutocomplete()]);
        items = [...t, ...s, ...a];
      }

      // Sorting
      if (sort === 'downloads') {
        items.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
      } else {
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

      const total = items.length;
      const start = (page - 1) * pageSize;
      const paged = items.slice(start, start + pageSize);

      res.json({ items: paged, total, page, pageSize });
    } catch (err) {
      console.error('Error in /api/community:', err);
      res.status(500).json({ error: 'Failed to fetch community items' });
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

  // =============================
  // Run List Endpoints (Phase 2/4/6)
  // =============================

  // Helper: get start-of-day Date (server local) from query param or now
  function getStartOfDayFromQuery(req: any): Date {
    const q = (req.query?.day as string) || '';
    let d: Date;
    if (q) {
      // Accept YYYY-MM-DD or ISO date
      const parsed = new Date(q);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      } else {
        d = new Date();
      }
    } else {
      d = new Date();
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  // Shape of the run list response
  async function fetchRunListPayload(db: any, runListId: string) {
    // Patients with optional notes
    const rows = await db
      .select({
        patient: listPatients,
        note: runListNotes,
      })
      .from(listPatients)
      .leftJoin(runListNotes, eq(runListNotes.listPatientId, listPatients.id))
      .where(eq(listPatients.runListId, runListId))
      .orderBy(listPatients.position);

    return rows.map((r: any) => ({
      id: r.patient.id,
      position: r.patient.position,
      alias: r.patient.alias,
      active: r.patient.active,
      archivedAt: r.patient.archivedAt,
      carryForwardOverrides: (r.patient as any).carryForwardOverrides || null,
      note: r.note ? {
        id: r.note.id,
        listPatientId: r.note.listPatientId,
        rawText: r.note.rawText,
        structuredSections: r.note.structuredSections,
        status: r.note.status,
        updatedAt: r.note.updatedAt,
        expiresAt: r.note.expiresAt,
      } : null,
    }));
  }

  // GET /api/run-list/today?day=YYYY-MM-DD&carryForward=true|false
  app.get('/api/run-list/today', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const db = storage.db;
      const day = getStartOfDayFromQuery(req);
      const carryForward = String(req.query?.carryForward || 'false') === 'true';
      const autoclone = String(req.query?.autoclone || 'true') === 'true';

      // Try to get today's list
      const [existing] = await db.select().from(runLists)
        .where(and(eq(runLists.userId, userId), eq(runLists.day, day)));

      if (existing) {
        const patients = await fetchRunListPayload(db, existing.id);
        return res.json({ runList: existing, patients });
      }

      // Find most recent previous list
      const previous = await db
        .select()
        .from(runLists)
        .where(and(eq(runLists.userId, userId), lt(runLists.day, day)))
        .orderBy(desc(runLists.day))
        .limit(1);

      const prev = previous[0] || null;

      // Create new run list (clone mode/carry_forward_defaults from previous if present)
      const [created] = await db.insert(runLists).values({
        userId,
        day,
        mode: prev?.mode || 'prepost',
        carryForwardDefaults: prev?.carryForwardDefaults || {},
      }).returning();

      // Clone patients from previous (if any). If none, create empty list.
      if (autoclone && prev) {
        // Fetch prev patients + notes
        const prevRows = await db
          .select({
            patient: listPatients,
            note: runListNotes,
          })
          .from(listPatients)
          .leftJoin(runListNotes, eq(runListNotes.listPatientId, listPatients.id))
          .where(eq(listPatients.runListId, prev.id))
          .orderBy(listPatients.position);

        // Insert patients into new list and notes per patient
        for (const r of prevRows) {
          const [p] = await db.insert(listPatients).values({
            runListId: created.id,
            position: r.patient.position,
            alias: r.patient.alias,
            active: true,
          }).returning();

          const newNote = {
            listPatientId: p.id,
            rawText: carryForward && r.note ? (r.note.rawText || '') : '',
            structuredSections: carryForward && r.note ? (r.note.structuredSections || {}) : {},
            status: 'draft',
            expiresAt: new Date(Date.now() + FORTY_EIGHT_HOURS_MS),
          } as any;
          await db.insert(runListNotes).values(newNote);
        }
      }

      const patients = await fetchRunListPayload(db, created.id);
      return res.json({ runList: created, patients });
    } catch (error) {
      console.error('Error in GET /api/run-list/today:', error);
      return res.status(500).json({ message: 'Failed to get or create today\'s run list' });
    }
  });

  // POST /api/run-list/:id/patients { alias? }
  app.post('/api/run-list/:id/patients', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const db = storage.db;
      const runListId = req.params.id;

      // Ensure run list belongs to user
      const [rl] = await db.select().from(runLists).where(and(eq(runLists.id, runListId), eq(runLists.userId, userId)));
      if (!rl) return res.status(404).json({ message: 'Run list not found' });

      const aliasRaw = (req.body?.alias || '').toString();
      const alias = aliasRaw ? aliasRaw.substring(0, 32) : null;

      // Next position
      const rows = await db.select().from(listPatients).where(eq(listPatients.runListId, runListId)).orderBy(desc(listPatients.position)).limit(1);
      const nextPos = rows.length > 0 ? (rows[0].position + 1) : 0;

      const [patient] = await db.insert(listPatients).values({ runListId, position: nextPos, alias, active: true }).returning();

      const [note] = await db.insert(runListNotes).values({
        listPatientId: patient.id,
        rawText: '',
        structuredSections: {},
        status: 'draft',
        expiresAt: new Date(Date.now() + FORTY_EIGHT_HOURS_MS),
      } as any).returning();

      return res.json({ patient: { ...patient }, note });
    } catch (error) {
      console.error('Error in POST /api/run-list/:id/patients:', error);
      return res.status(500).json({ message: 'Failed to add patient' });
    }
  });

  // PUT /api/run-list/:id/patients/reorder { order: string[] }
  app.put('/api/run-list/:id/patients/reorder', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const db = storage.db;
      const runListId = req.params.id;
      const schema = z.object({ order: z.array(z.string().uuid()).min(1) });
      const { order } = schema.parse(req.body || {});

      const [rl] = await db.select().from(runLists).where(and(eq(runLists.id, runListId), eq(runLists.userId, userId)));
      if (!rl) return res.status(404).json({ message: 'Run list not found' });

      // Update positions in sequence
      for (let i = 0; i < order.length; i++) {
        const id = order[i];
        await db.update(listPatients).set({ position: i, updatedAt: new Date() }).where(and(eq(listPatients.id, id), eq(listPatients.runListId, runListId)));
      }

      const patients = await fetchRunListPayload(db, runListId);
      return res.json({ message: 'Reordered', patients });
    } catch (error) {
      console.error('Error in PUT /api/run-list/:id/patients/reorder:', error);
      return res.status(500).json({ message: 'Failed to reorder patients' });
    }
  });

  // PUT /api/run-list/patients/:id { alias?: string, active?: boolean }
  app.put('/api/run-list/patients/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const db = storage.db;
      const patientId = req.params.id;

      // Verify ownership via join
      const rows = await db
        .select({ rl: runLists, p: listPatients })
        .from(listPatients)
        .innerJoin(runLists, eq(runLists.id, listPatients.runListId))
        .where(eq(listPatients.id, patientId));
      const row = rows[0];
      if (!row || row.rl.userId !== userId) return res.status(404).json({ message: 'Patient not found' });

      const data: any = {};
      if (typeof req.body?.alias === 'string') data.alias = req.body.alias.substring(0, 32);
      if (typeof req.body?.active === 'boolean') data.active = req.body.active;
      if (req.body && typeof req.body.carryForwardOverrides === 'object' && req.body.carryForwardOverrides) {
        const allowed = ['assessment','active_orders','allergies','labs','medications','objective','subjective','imaging','plan','physical_exam'];
        const out: Record<string, boolean> = {};
        for (const k of allowed) if (k in req.body.carryForwardOverrides) out[k] = Boolean(req.body.carryForwardOverrides[k]);
        data.carryForwardOverrides = out;
      }
      if (Object.keys(data).length === 0) return res.status(400).json({ message: 'No fields to update' });

      const [updated] = await db.update(listPatients).set({ ...data, updatedAt: new Date() }).where(eq(listPatients.id, patientId)).returning();
      return res.json({ patient: updated });
    } catch (error) {
      console.error('Error in PUT /api/run-list/patients/:id:', error);
      return res.status(500).json({ message: 'Failed to update patient' });
    }
  });

  // DELETE /api/run-list/patients/:id (archive for the day)
  app.delete('/api/run-list/patients/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const db = storage.db;
      const patientId = req.params.id;

      const rows = await db
        .select({ rl: runLists, p: listPatients })
        .from(listPatients)
        .innerJoin(runLists, eq(runLists.id, listPatients.runListId))
        .where(eq(listPatients.id, patientId));
      const row = rows[0];
      if (!row || row.rl.userId !== userId) return res.status(404).json({ message: 'Patient not found' });

      const [updated] = await db.update(listPatients).set({ active: false, archivedAt: new Date(), updatedAt: new Date() }).where(eq(listPatients.id, patientId)).returning();
      return res.json({ patient: updated });
    } catch (error) {
      console.error('Error in DELETE /api/run-list/patients/:id:', error);
      return res.status(500).json({ message: 'Failed to archive patient' });
    }
  });

  // PUT /api/run-list/notes/:listPatientId { rawText?, structuredSections?, status? }
  app.put('/api/run-list/notes/:listPatientId', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const db = storage.db;
      const listPatientId = req.params.listPatientId;
      const expectedUpdatedAtRaw = req.body?.expectedUpdatedAt ? new Date(req.body.expectedUpdatedAt) : null;

      // Verify ownership via join
      const rows = await db
        .select({ rl: runLists, p: listPatients, n: runListNotes })
        .from(listPatients)
        .leftJoin(runListNotes, eq(runListNotes.listPatientId, listPatients.id))
        .innerJoin(runLists, eq(runLists.id, listPatients.runListId))
        .where(eq(listPatients.id, listPatientId));
      const row = rows[0];
      if (!row || row.rl.userId !== userId) return res.status(404).json({ message: 'List patient not found' });

      const allowedStatus = new Set(['draft', 'preround', 'postround', 'complete']);
      const payload: any = {};
      if (typeof req.body?.rawText === 'string') payload.rawText = req.body.rawText;
      if (typeof req.body?.structuredSections === 'object' && req.body.structuredSections) payload.structuredSections = req.body.structuredSections;
      if (typeof req.body?.status === 'string' && allowedStatus.has(req.body.status)) payload.status = req.body.status;
      payload.updatedAt = new Date();
      payload.expiresAt = new Date(Date.now() + FORTY_EIGHT_HOURS_MS);

      let noteRow;
      if (row.n) {
        // Optimistic locking: when provided, ensure no concurrent update
        if (expectedUpdatedAtRaw && new Date(row.n.updatedAt).getTime() !== expectedUpdatedAtRaw.getTime()) {
          return res.status(409).json({ message: 'Conflict: note was updated by another source' });
        }
        const [updated] = await db.update(runListNotes).set(payload).where(eq(runListNotes.id, row.n.id)).returning();
        noteRow = updated;
      } else {
        const [created] = await db.insert(runListNotes).values({ listPatientId, rawText: payload.rawText || '', structuredSections: payload.structuredSections || {}, status: payload.status || 'draft', updatedAt: new Date(), createdAt: new Date(), expiresAt: payload.expiresAt } as any).returning();
        noteRow = created;
      }

      // Record a version entry
      try {
        await db.insert(runListNoteVersions).values({
          noteId: noteRow.id,
          rawText: noteRow.rawText,
          structuredSections: noteRow.structuredSections,
          source: 'user_edit',
        } as any);
      } catch {}

      return res.json({ note: noteRow });
    } catch (error) {
      console.error('Error in PUT /api/run-list/notes/:listPatientId:', error);
      return res.status(500).json({ message: 'Failed to update note' });
    }
  });

  // GET /api/run-list/:id/carry-forward
  app.get('/api/run-list/:id/carry-forward', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const runListId = req.params.id;
      const [rl] = await storage.db.select().from(runLists).where(and(eq(runLists.id, runListId), eq(runLists.userId, userId)));
      if (!rl) return res.status(404).json({ message: 'Run list not found' });
      return res.json({ carryForwardDefaults: (rl as any).carryForwardDefaults || {} });
    } catch (error) {
      console.error('Error in GET /api/run-list/:id/carry-forward:', error);
      return res.status(500).json({ message: 'Failed to fetch carry-forward defaults' });
    }
  });

  // PUT /api/run-list/:id/carry-forward { carryForwardDefaults }
  app.put('/api/run-list/:id/carry-forward', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const runListId = req.params.id;
      const body = req.body || {};
      const inDefaults = (body.carryForwardDefaults || {}) as Record<string, any>;
      // Whitelist keys and coerce to booleans
      const allowed = ['assessment','active_orders','allergies','labs','medications','objective','subjective','imaging','plan','physical_exam'];
      const out: Record<string, boolean> = {};
      for (const k of allowed) out[k] = Boolean(inDefaults[k]);

      const [rl] = await storage.db.select().from(runLists).where(and(eq(runLists.id, runListId), eq(runLists.userId, userId)));
      if (!rl) return res.status(404).json({ message: 'Run list not found' });
      const [updated] = await storage.db.update(runLists).set({ carryForwardDefaults: out, updatedAt: new Date() }).where(eq(runLists.id, runListId)).returning();
      return res.json({ carryForwardDefaults: (updated as any).carryForwardDefaults || {} });
    } catch (error) {
  console.error('Error in PUT /api/run-list/:id/carry-forward:', error);
      return res.status(500).json({ message: 'Failed to update carry-forward defaults' });
    }
  });

  // PUT /api/run-list/:id/mode { mode: 'prepost' | 'full' }
  app.put('/api/run-list/:id/mode', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const runListId = req.params.id;
      const modeRaw = String((req.body || {}).mode || '').toLowerCase();
      const mode = modeRaw === 'full' ? 'full' : 'prepost';
      const [rl] = await storage.db.select().from(runLists).where(and(eq(runLists.id, runListId), eq(runLists.userId, userId)));
      if (!rl) return res.status(404).json({ message: 'Run list not found' });
      const [updated] = await storage.db.update(runLists).set({ mode, updatedAt: new Date() } as any).where(eq(runLists.id, runListId)).returning();
      return res.json({ mode: (updated as any).mode });
    } catch (error) {
      console.error('Error in PUT /api/run-list/:id/mode:', error);
      return res.status(500).json({ message: 'Failed to update run list mode' });
    }
  });

  // POST /api/run-list/:id/clone-from-previous?strategy=all|selected|none
  app.post('/api/run-list/:id/clone-from-previous', requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const runListId = req.params.id;
      const strategyRaw = (req.query?.strategy as string) || 'selected';
      const strategy = ['all','selected','none'].includes(strategyRaw) ? strategyRaw : 'selected';

      // Load today's run list and verify ownership
      const [todayRL] = await storage.db.select().from(runLists).where(and(eq(runLists.id, runListId), eq(runLists.userId, userId)));
      if (!todayRL) return res.status(404).json({ message: 'Run list not found' });
      const todayDay = new Date((todayRL as any).day);

      // Ensure list is empty (no patients) to avoid duplication
      const existingTodayPatients = await storage.db.select().from(listPatients).where(eq(listPatients.runListId, runListId)).limit(1);
      if (existingTodayPatients.length > 0) {
        return res.status(409).json({ message: 'Run list already has patients' });
      }

      // Find previous run list by same user and day < today
      const prevListRows = await storage.db
        .select()
        .from(runLists)
        .where(and(eq(runLists.userId, userId), lt(runLists.day, todayDay)))
        .orderBy(desc(runLists.day))
        .limit(1);
      const prevRL = prevListRows[0];
      if (!prevRL) return res.status(404).json({ message: 'No previous run list found' });

      // Determine carry-forward defaults: prefer body -> today's rl -> previous rl -> empty
      const allowedKeys = ['assessment','active_orders','allergies','labs','medications','objective','subjective','imaging','plan','physical_exam'];
      const coerceDefaults = (src: any): Record<string, boolean> => {
        const out: Record<string, boolean> = {};
        for (const k of allowedKeys) out[k] = Boolean(src?.[k]);
        return out;
      };
      const bodyDefaults = coerceDefaults((req.body || {}).carryForwardDefaults || {});
      const todayDefaults = coerceDefaults((todayRL as any).carryForwardDefaults || {});
      const prevDefaults = coerceDefaults((prevRL as any).carryForwardDefaults || {});
      const defaults = Object.values(bodyDefaults).some(Boolean) ? bodyDefaults : (Object.values(todayDefaults).some(Boolean) ? todayDefaults : prevDefaults);

      // Fetch previous patients + notes
      const prevRows = await storage.db
        .select({ patient: listPatients, note: runListNotes })
        .from(listPatients)
        .leftJoin(runListNotes, eq(runListNotes.listPatientId, listPatients.id))
        .where(eq(listPatients.runListId, (prevRL as any).id))
        .orderBy(listPatients.position);

      // Helpers to rebuild minimal raw text for selected strategy
      const buildLabsLine = (labs: any): string => {
        try {
          if (!labs || typeof labs !== 'object') return '';
          const parts: string[] = [];
          const entries = Object.entries(labs);
          for (let i = 0; i < Math.min(entries.length, 8); i++) {
            const [name, vals] = entries[i] as [string, any];
            const arr = Array.isArray((vals as any)?.values) ? (vals as any).values : Array.isArray(vals) ? vals : [];
            const latest = arr && arr.length > 0 ? String(arr[0]) : '';
            if (latest) parts.push(`${name}: ${latest}`);
          }
          return parts.length ? `Labs: ${parts.join(', ')}` : '';
        } catch { return ''; }
      };
      const buildVitalsLine = (vitals: any): string => {
        try {
          if (!vitals || typeof vitals !== 'object') return '';
          const parts: string[] = [];
          const entries = Object.entries(vitals);
          for (let i = 0; i < Math.min(entries.length, 8); i++) {
            const [name, v] = entries[i] as [string, any];
            const latest = typeof v === 'string' ? v : (Array.isArray(v?.values) ? String(v.values[0] || '') : (v?.value || v?.current));
            if (latest) parts.push(`${name}: ${latest}`);
          }
          return parts.length ? `Vitals: ${parts.join(', ')}` : '';
        } catch { return ''; }
      };
      const buildImagingLine = (imaging: any): string => {
        try {
          if (!imaging || typeof imaging !== 'object') return '';
          const parts: string[] = [];
          const entries = Object.entries(imaging);
          for (let i = 0; i < Math.min(entries.length, 4); i++) {
            const [type, arr] = entries[i] as [string, any];
            let latestText = '';
            if (Array.isArray(arr) && arr.length > 0) {
              const first = arr[0];
              latestText = first?.impression || first?.text || '';
            } else if (typeof arr === 'object' && arr) {
              latestText = arr?.impression || arr?.text || '';
            }
            if (latestText) parts.push(`${type}: ${latestText}`);
          }
          return parts.length ? `Imaging: ${parts.join(' | ')}` : '';
        } catch { return ''; }
      };

      // Perform cloning
      const createdPatients: any[] = [];
      for (const r of prevRows as any[]) {
        const [p] = await storage.db.insert(listPatients).values({
          runListId,
          position: r.patient.position,
          alias: r.patient.alias,
          active: true,
          carryForwardOverrides: (r.patient as any).carryForwardOverrides || null,
        } as any).returning();
        createdPatients.push(p);

        const prevNote = r.note;
        let rawText = '';
        let sections: any = {};
        let structured: any = {};

        if (strategy === 'all') {
          rawText = prevNote?.rawText || '';
          const ss = (prevNote as any)?.structuredSections;
          if (ss && typeof ss === 'object') {
            sections = ss.sections || {};
            structured = ss.structured || {};
          }
        } else if (strategy === 'none') {
          rawText = '';
          sections = {};
          structured = {};
        } else {
          // selected
          const ss = (prevNote as any)?.structuredSections || {};
          const prevSections = (ss.sections || {}) as Record<string, string>;
          const prevStructured = (ss.structured || {}) as Record<string, any>;

          // Apply per-patient overrides from previous day when present
          const prevOverrides = ((r.patient as any).carryForwardOverrides || {}) as Record<string, boolean>;
          const eff = { ...defaults } as Record<string, boolean>;
          for (const k of Object.keys(prevOverrides)) {
            if (typeof prevOverrides[k] === 'boolean') eff[k] = prevOverrides[k];
          }

          // Filter structured by effective defaults
          structured = {};
          if (eff.labs && prevStructured.labs) (structured as any).labs = prevStructured.labs;
          if (defaults.imaging && prevStructured.imaging) (structured as any).imaging = prevStructured.imaging;
          if (defaults.objective && prevStructured.vitals) (structured as any).vitals = prevStructured.vitals;
          if (defaults.medications && prevStructured.medications) (structured as any).medications = prevStructured.medications;
          if (defaults.allergies && prevStructured.allergies) (structured as any).allergies = prevStructured.allergies;

          // Filter sections by defaults (SOAP + optional physical exam)
          const pushIf = (key: string, cond: boolean) => { if (cond && prevSections[key]) sections[key] = prevSections[key]; };
          pushIf('Subjective', defaults.subjective);
          pushIf('Objective', defaults.objective);
          pushIf('Assessment', defaults.assessment);
          pushIf('Plan', defaults.plan);
          pushIf('Physical Exam', defaults.physical_exam);

          // Build minimal raw text with headings
          const parts: string[] = [];
          if (sections['Subjective']) parts.push(`Subjective:\n${sections['Subjective'].trim()}`);

          const objLines: string[] = [];
          if (sections['Objective']) objLines.push(sections['Objective'].trim());
          if (eff.objective && structured.vitals) {
            const line = buildVitalsLine(structured.vitals);
            if (line) objLines.push(line);
          }
          if (eff.labs && structured.labs) {
            const line = buildLabsLine(structured.labs);
            if (line) objLines.push(line);
          }
          if (eff.imaging && structured.imaging) {
            const line = buildImagingLine(structured.imaging);
            if (line) objLines.push(line);
          }
          if (objLines.length) parts.push(`Objective:\n${objLines.join('\n')}`);

          if (eff.physical_exam && sections['Physical Exam']) parts.push(`Physical Exam:\n${sections['Physical Exam'].trim()}`);
          if (eff.assessment && sections['Assessment']) parts.push(`Assessment:\n${sections['Assessment'].trim()}`);
          if (eff.plan && sections['Plan']) parts.push(`Plan:\n${sections['Plan'].trim()}`);

          rawText = parts.join('\n\n');
        }

        // Create note for patient
        await storage.db.insert(runListNotes).values({
          listPatientId: p.id,
          rawText,
          structuredSections: { sections, structured },
          status: 'draft',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        } as any);
      }

      // Return today payload
      const patients = await fetchRunListPayload(storage.db, runListId);
      return res.json({ runList: todayRL, patients, strategy, defaults });
    } catch (error) {
      console.error('Error in POST /api/run-list/:id/clone-from-previous:', error);
      return res.status(500).json({ message: 'Failed to clone from previous' });
    }
  });

  // POST /api/run-list/ai/generate { listPatientId, transcript, mode?: 'prepost'|'full' }
  app.post('/api/run-list/ai/generate', requireAuth, async (req: any, res) => {
    try {
      const schema = z.object({
        listPatientId: z.string().uuid(),
        transcript: z.string().min(1),
        mode: z.enum(['prepost','full']).optional()
      });
      const { listPatientId, transcript, mode } = schema.parse(req.body || {});

      if (!isNovaConfigured()) {
        return res.status(500).json({ message: "Amazon Nova Micro not configured. Please check AWS credentials and region." });
      }

      // Verify ownership and fetch current note
      const rows = await storage.db
        .select({ rl: runLists, p: listPatients, n: runListNotes })
        .from(listPatients)
        .leftJoin(runListNotes, eq(runListNotes.listPatientId, listPatients.id))
        .innerJoin(runLists, eq(runLists.id, listPatients.runListId))
        .where(eq(listPatients.id, listPatientId));
      const row = rows[0];
      if (!row) return res.status(404).json({ message: 'List patient not found' });
      const userId = getCurrentUserId(req);
      if (row.rl.userId !== userId) return res.status(403).json({ message: 'Forbidden' });

      const previousText = row.n?.rawText || '';
      const workflow = (mode || row.rl.mode || 'prepost');

      // Include previous structured facts to aid trending (best-effort)
      let prevStructured: any = {};
      try {
        const ss = (row.n as any)?.structuredSections;
        if (ss && typeof ss === 'object') prevStructured = ss.structured || {};
      } catch {}

      // Compose user message for the LLM
      const userMessage = [
        `Workflow mode: ${workflow}`,
        `\nPrevious note (may be empty):\n---\n${previousText}\n---`,
        `\nPrevious structured facts (JSON, may be empty):\n---\n${JSON.stringify(prevStructured).slice(0, 4000)}\n---`,
        `\nNew dictation to merge:\n---\n${transcript}\n---`,
        `\nReturn strict JSON with {"merged_note": string, "sections": {"Subjective"?: string, "Objective"?: string, "Assessment"?: string, "Plan"?: string}, "structured"?: {"vitals"?: any, "labs"?: any, "imaging"?: any}}`
      ].join('\n');

      const { text } = await callNovaMicro({
        systemPrompt: RUNLIST_SOAP_SYSTEM_PROMPT,
        userMessage,
        temperature: 0
      });

      let merged_note = '';
      let sections: any = {};
      let structured: any = {};
      try {
        const parsed = JSON.parse(text);
        merged_note = String(parsed?.merged_note || '').trim();
        sections = parsed?.sections && typeof parsed.sections === 'object' ? parsed.sections : {};
        structured = parsed?.structured && typeof parsed.structured === 'object' ? parsed.structured : {};
      } catch (e) {
        // Fallback: treat entire output as note text
        merged_note = text.trim();
        sections = {};
        structured = {};
      }
      if (!merged_note) merged_note = previousText; // last resort

      // Merge structured facts for trending (labs)
      const normalizeLabs = (labs: any): Record<string, string[]> => {
        const out: Record<string, string[]> = {};
        if (!labs) return out;
        const addVals = (name: string, vals: any) => {
          const key = canonicalizeLab(String(name || '').trim());
          if (!key) return;
          const arr: string[] = [];
          if (Array.isArray(vals)) {
            for (const v of vals) {
              if (v == null) continue;
              if (typeof v === 'string' || typeof v === 'number') arr.push(String(v));
              else if (typeof v === 'object') {
                if (v.value != null) arr.push(String(v.value));
                else if (v.current != null) arr.push(String(v.current));
              }
            }
          } else if (typeof vals === 'object') {
            if (Array.isArray(vals.values)) addVals(name, vals.values);
            if (vals.current != null) arr.unshift(String(vals.current));
            if (Array.isArray(vals.trends)) addVals(name, vals.trends);
          } else if (typeof vals === 'string' || typeof vals === 'number') {
            arr.push(String(vals));
          }
          if (!out[key]) out[key] = [];
          out[key].push(...arr);
        };
        if (Array.isArray(labs)) {
          for (const item of labs) {
            if (item && typeof item === 'object') addVals(item.name || item.test || item.id || 'Unknown', item.values ?? item);
          }
        } else if (typeof labs === 'object') {
          for (const [k, v] of Object.entries(labs)) addVals(k, v);
        }
        // Dedup while preserving order
        for (const k of Object.keys(out)) {
          const seen = new Set<string>();
          out[k] = out[k].filter((x) => { const s = String(x).trim(); if (!s || seen.has(s)) return false; seen.add(s); return true; });
        }
        return out;
      };

      const prevLabs = normalizeLabs(prevStructured?.labs);
      const newLabs = normalizeLabs(structured?.labs);
      const mergedLabs: Record<string, string[]> = {};
      const labsKeys = Array.from(new Set([...Object.keys(newLabs), ...Object.keys(prevLabs)]));
      for (const name of labsKeys) {
        const combined = [...(newLabs[name] || []), ...(prevLabs[name] || [])];
        // Limit history to last 6 for brevity
        mergedLabs[name] = combined.slice(0, 6);
      }

      // Vitals merge (similar shape as labs: name -> { values: [] })
      const normalizeVitals = (vitals: any): Record<string, string[]> => {
        const out: Record<string, string[]> = {};
        if (!vitals) return out;
        const addVals = (name: string, vals: any) => {
          const key = canonicalizeVital(String(name || '').trim());
          if (!key) return;
          const arr: string[] = [];
          if (Array.isArray(vals)) {
            for (const v of vals) {
              if (v == null) continue;
              if (typeof v === 'string' || typeof v === 'number') arr.push(String(v));
              else if (typeof v === 'object') {
                if (v.value != null) arr.push(String(v.value));
                else if (v.current != null) arr.push(String(v.current));
              }
            }
          } else if (typeof vals === 'object') {
            if (Array.isArray(vals.values)) addVals(name, vals.values);
            if (vals.current != null) arr.unshift(String(vals.current));
            if (Array.isArray(vals.trends)) addVals(name, vals.trends);
            if (vals.value != null) arr.unshift(String(vals.value));
          } else if (typeof vals === 'string' || typeof vals === 'number') {
            arr.push(String(vals));
          }
          if (!out[key]) out[key] = [];
          out[key].push(...arr);
        };
        if (Array.isArray(vitals)) {
          for (const item of vitals) {
            if (item && typeof item === 'object') addVals(item.name || item.id || 'Unknown', item.values ?? item);
          }
        } else if (typeof vitals === 'object') {
          for (const [k, v] of Object.entries(vitals)) addVals(k, v);
        }
        // Dedup while preserving order
        for (const k of Object.keys(out)) {
          const seen = new Set<string>();
          out[k] = out[k].filter((x) => { const s = String(x).trim(); if (!s || seen.has(s)) return false; seen.add(s); return true; });
        }
        return out;
      };
      const prevVitals = normalizeVitals(prevStructured?.vitals);
      const newVitals = normalizeVitals(structured?.vitals);
      const mergedVitals: Record<string, string[]> = {};
      const vitalsKeys = Array.from(new Set([...Object.keys(newVitals), ...Object.keys(prevVitals)]));
      for (const name of vitalsKeys) {
        const combined = [...(newVitals[name] || []), ...(prevVitals[name] || [])];
        mergedVitals[name] = combined.slice(0, 6);
      }

      // Imaging merge: map type -> array of { impression, when? }, latest first, dedup by impression+when
      const normalizeImaging = (im: any): Record<string, { impression: string; when?: string }[]> => {
        const out: Record<string, { impression: string; when?: string }[]> = {};
        if (!im) return out;
        const add = (type: string, entry: any) => {
          const t = canonicalizeImagingType(String(type || '').trim() || 'Imaging');
          const imp = String(entry?.impression || entry?.text || '').trim();
          const when = entry?.when ? String(entry.when) : (entry?.date ? String(entry.date) : undefined);
          if (!imp) return;
          if (!out[t]) out[t] = [];
          out[t].push({ impression: imp, when });
        };
        if (Array.isArray(im)) {
          for (const item of im) {
            if (item && typeof item === 'object') add(item.type || item.modality || 'Imaging', item);
          }
        } else if (typeof im === 'object') {
          for (const [k, v] of Object.entries(im)) {
            if (Array.isArray(v)) { for (const e of v) add(k, e); }
            else if (typeof v === 'object') add(k, v);
            else if (typeof v === 'string') add(k, { impression: v });
          }
        }
        // Dedup per type
        for (const k of Object.keys(out)) {
          const seen = new Set<string>();
          out[k] = out[k].filter((e) => {
            const key = e.impression + '|' + (e.when || '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        return out;
      };
      const prevImaging = normalizeImaging(prevStructured?.imaging);
      const newImaging = normalizeImaging(structured?.imaging);
      const mergedImaging: Record<string, { impression: string; when?: string }[]> = {};
      const imagingKeys = Array.from(new Set([...Object.keys(newImaging), ...Object.keys(prevImaging)]));
      for (const type of imagingKeys) {
        const combined = [...(newImaging[type] || []), ...(prevImaging[type] || [])];
        mergedImaging[type] = combined.slice(0, 6);
      }

      // Rebuild structured with merges
      const mergedStructured = {
        ...prevStructured,
        ...structured,
        labs: Object.fromEntries(Object.entries(mergedLabs).map(([k, v]) => [k, { values: v }])),
        vitals: Object.fromEntries(Object.entries(mergedVitals).map(([k, v]) => [k, { values: v }])),
        imaging: mergedImaging,
      };

      // Update note and version
      const payload: any = {
        rawText: merged_note,
        structuredSections: { sections, structured: mergedStructured },
        status: workflow === 'prepost' ? (row.n?.status === 'preround' ? 'postround' : 'preround') : 'complete',
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      };

      let noteRow;
      if (row.n) {
        const [updated] = await storage.db.update(runListNotes).set(payload).where(eq(runListNotes.id, row.n.id)).returning();
        noteRow = updated;
      } else {
        const [created] = await storage.db.insert(runListNotes).values({ listPatientId, ...payload } as any).returning();
        noteRow = created;
      }
      try {
        await storage.db.insert(runListNoteVersions).values({
          noteId: noteRow.id,
          rawText: noteRow.rawText,
          structuredSections: noteRow.structuredSections,
          source: 'ai_merge',
        } as any);
      } catch {}

      return res.json({ note: noteRow });
    } catch (error) {
      console.error('Error in POST /api/run-list/ai/generate:', error);
      return res.status(500).json({ message: 'Failed to generate AI note' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
