import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage.ts";
import { setupVite, serveStatic, log } from "./vite.ts";
import { applySecurity, applyDevelopmentSecurity } from "./security.js";
import { 
  insertNoteSchema, 
  insertNoteTemplateSchema, 
  insertSmartPhraseSchema,
  insertTeamTodoSchema,
  insertTeamCalendarEventSchema,
  insertUserSchema,
  insertUserLabSettingSchema
} from "../shared/schema.ts";
import { z } from "zod";
import { MEDICATIONS_SYSTEM_PROMPT, LABS_SYSTEM_PROMPT, PMH_SYSTEM_PROMPT } from "./ai/prompts.ts";
import { callNovaMicro, isNovaConfigured } from "./ai/nova.ts";
import path from "path";

// Development configuration
const DEV_CONFIG = {
  sessionId: `dev-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId: `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  user: {
    email: process.env.DEV_USER_EMAIL || "dev-doctor@gigatime-test.local",
    firstName: process.env.DEV_USER_FIRST_NAME || "Dr. Test",
    lastName: process.env.DEV_USER_LAST_NAME || "Developer",
    specialty: process.env.DEV_USER_SPECIALTY || "Internal Medicine"
  },
  port: parseInt(process.env.PORT || '5002', 10)
};

// Complete user object for database
const DEV_USER_DB = {
  id: DEV_CONFIG.userId,
  email: DEV_CONFIG.user.email,
  firstName: DEV_CONFIG.user.firstName,
  lastName: DEV_CONFIG.user.lastName,
  specialty: DEV_CONFIG.user.specialty
};

const app = express();

// Basic Express middleware first (before security)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session middleware for consistency with main app
app.use(session({
  secret: process.env.SESSION_SECRET || `dev-secret-${DEV_CONFIG.sessionId}`,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // HTTP for development
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Apply development security middleware - very lenient for Vite compatibility
applyDevelopmentSecurity(app);

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") && !path.includes('/auth/user')) { // Reduce noise from frequent auth checks
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      if (duration > 1000) {
        logLine += ` ⚠️ SLOW`;
      }
      
      if (capturedJsonResponse && res.statusCode >= 400) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Development authentication middleware - always authenticates
const devAuthMiddleware = (req: any, res: any, next: any) => {
  // Set development user in request
  req.user = {
    claims: {
      sub: DEV_CONFIG.userId,
      email: DEV_CONFIG.user.email,
      first_name: DEV_CONFIG.user.firstName,
      last_name: DEV_CONFIG.user.lastName
    }
  };
  
  // Set session data for consistency
  if (req.session) {
    req.session.devUserId = DEV_CONFIG.userId;
    req.session.authenticated = true;
    req.session.user = DEV_CONFIG.user;
  }
  
  next();
};

// Apply authentication to all routes
app.use(devAuthMiddleware);

// Helper function to get development user ID
const getDevUserId = () => DEV_CONFIG.userId;

// Helper function to ensure user exists in database
const ensureUserExists = async () => {
  try {
    let user = await storage.getUser(DEV_CONFIG.userId);
    if (!user) {
      user = await storage.createUser(DEV_USER_DB);
      log(`✅ Created development user: ${DEV_CONFIG.user.firstName} ${DEV_CONFIG.user.lastName}`);
    }
    return user;
  } catch (error) {
    log(`⚠️ Warning: Could not ensure user exists: ${error}`);
    return null;
  }
};

// === AUTHENTICATION ROUTES ===
// These routes completely bypass any Auth0 checks

app.get('/api/auth/user', async (req: any, res) => {
  try {
    const user = await ensureUserExists();
    if (!user) {
      // Fallback user object
      return res.json(DEV_USER_DB);
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching development user:", error);
    // Return fallback user even on error
    res.json(DEV_USER_DB);
  }
});

app.post('/api/auth/login', (req: any, res) => {
  res.json({ 
    message: 'Development login successful',
    user: DEV_USER_DB,
    authenticated: true
  });
});

app.post('/api/auth/logout', (req: any, res) => {
  if (req.session) {
    req.session.authenticated = false;
  }
  res.json({ 
    message: 'Development logout successful',
    authenticated: false
  });
});

app.get('/api/auth/callback', (req: any, res) => {
  // Always redirect to home for development
  res.redirect('/');
});

// Initialize user endpoint
app.post("/api/init-user", async (req, res) => {
  try {
    const user = await ensureUserExists();
    res.json({ 
      message: "Development user initialized", 
      user: user || DEV_USER_DB 
    });
  } catch (error) {
    console.error("Error initializing development user:", error);
    res.status(500).json({ message: "Failed to initialize development user" });
  }
});

// === API ROUTES ===
// All the standard API routes with development user

// Note template routes
app.get("/api/note-templates", async (req, res) => {
  try {
    const userId = getDevUserId();
    await ensureUserExists(); // Ensure user exists
    
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
      log(`✅ Initialized ${defaultTemplateData.length} default note templates`);
    }
    
    const templates = await storage.getNoteTemplates(userId);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching note templates:", error);
    res.status(500).json({ message: "Failed to fetch note templates" });
  }
});

app.post("/api/note-templates", async (req, res) => {
  try {
    const userId = getDevUserId();
    await ensureUserExists();
    const templateData = insertNoteTemplateSchema.parse({ ...req.body, userId });
    const template = await storage.createNoteTemplate(templateData);
    res.json(template);
  } catch (error) {
    console.error("Error creating note template:", error);
    res.status(500).json({ message: "Failed to create note template" });
  }
});

app.put("/api/note-templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = insertNoteTemplateSchema.partial().parse(req.body);
    const template = await storage.updateNoteTemplate(id, templateData);
    res.json(template);
  } catch (error) {
    console.error("Error updating note template:", error);
    res.status(500).json({ message: "Failed to update note template" });
  }
});

app.delete("/api/note-templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteNoteTemplate(id);
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting note template:", error);
    res.status(500).json({ message: "Failed to delete note template" });
  }
});

// Note routes
app.get("/api/notes", async (req, res) => {
  try {
    const userId = getDevUserId();
    await ensureUserExists();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const notes = await storage.getNotes(userId, limit);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

app.get("/api/notes/:id", async (req, res) => {
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

app.post("/api/notes", async (req, res) => {
  try {
    const userId = getDevUserId();
    await ensureUserExists();
    const noteData = insertNoteSchema.parse({ ...req.body, userId });
    const note = await storage.createNote(noteData);
    res.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Failed to create note" });
  }
});

app.put("/api/notes/:id", async (req, res) => {
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

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteNote(id);
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Failed to delete note" });
  }
});

// Soniox API key endpoint
app.get("/api/soniox-key", (req, res) => {
  const apiKey = process.env.SONIOX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Soniox API key not configured" });
  }
  res.json({ apiKey });
});

// AI endpoints (Amazon Nova Micro)
app.post("/api/ai/medications", async (req, res) => {
  try {
    const dictation = (req.body?.dictation ?? '').toString();
    if (!dictation.trim()) {
      return res.status(400).json({ message: "Missing dictation" });
    }

    if (!isNovaConfigured()) {
      return res.status(500).json({ message: "Amazon Nova Micro not configured. Please check AWS credentials and region." });
    }

    const response = await callNovaMicro({
      systemPrompt: MEDICATIONS_SYSTEM_PROMPT,
      userMessage: dictation,
      temperature: 0
    });

    const sanitize = (t: string) => (
      t
        .replace(/[\r]+/g, "\n")
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(l => l.replace(/^[\-*•\d+\.\)]\s*/, ""))
        .map(l => l.replace(/[\.\s]+$/, ""))
        .join("\n")
    );

    const text = sanitize(response.text);
    res.json({ text });
  } catch (error: any) {
    console.error("Error in AI medications endpoint:", error);
    res.status(500).json({ message: error?.message || "Failed to process dictation" });
  }
});

// Smart phrases routes (simplified for development)
app.get("/api/smart-phrases", async (req, res) => {
  try {
    const userId = getDevUserId();
    await ensureUserExists();
    
    const query = req.query.q as string;
    let phrases;
    
    if (query) {
      phrases = await storage.searchSmartPhrases(userId, query);
    } else {
      phrases = await storage.getSmartPhrases(userId);
    }

    // Map elements to client format
    const enriched = (phrases || []).map((phrase: any) => {
      const elements = Array.isArray(phrase?.elements) ? phrase.elements : [];
      if (elements.length === 0) {
        return { ...phrase, type: 'text', options: null };
      }
      if (elements.length === 1) {
        const el: any = elements[0];
        if (el.type === 'date') {
          return { ...phrase, type: 'date', options: null };
        }
        if (el.type === 'multipicker' || el.type === 'nested_multipicker') {
          return { ...phrase, type: el.type, options: { choices: Array.isArray(el.options) ? el.options : [] } };
        }
      }
      return { ...phrase, type: 'text', options: null };
    });

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching smart phrases:", error);
    res.status(500).json({ message: "Failed to fetch smart phrases" });
  }
});

// Development info endpoint
app.get("/api/dev/info", (req, res) => {
  res.json({
    message: "Development server running",
    user: DEV_USER_DB,
    config: {
      port: DEV_CONFIG.port,
      sessionId: DEV_CONFIG.sessionId,
      environment: process.env.NODE_ENV || 'development'
    },
    features: {
      auth: "bypassed",
      database: "enabled",
      ai: {
        nova: isNovaConfigured(),
        soniox: !!process.env.SONIOX_API_KEY
      }
    }
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    user: DEV_CONFIG.user.firstName + " " + DEV_CONFIG.user.lastName
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error(`Error ${status}:`, message);
  console.error(err.stack);

  res.status(status).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Setup Vite and start server
const server = createServer(app);

(async () => {
  try {
    // Initialize database connection
    await storage.ensureCoreSchema();
    log(`✅ Database connection established`);

    // Setup Vite development server with error handling
    try {
      await setupVite(app, server);
      log(`✅ Vite development server configured`);
    } catch (error) {
      log(`⚠️ Warning: Vite setup failed: ${error}`);
      log(`   - This may affect frontend hot-reloading`);
      log(`   - API endpoints will still work normally`);
      
      // Fallback: serve static files if they exist
      try {
        serveStatic(app);
        log(`✅ Fallback: serving static files`);
      } catch (staticError) {
        log(`ℹ️ No static files to serve - run 'npm run build' to create them`);
      }
    }

    // Find available port
    const findAvailablePort = async (startPort: number): Promise<number> => {
      const net = await import('net');
      return new Promise((resolve, reject) => {
        const testServer = net.createServer();
        testServer.listen(startPort, () => {
          const port = (testServer.address() as any).port;
          testServer.close(() => resolve(port));
        });
        testServer.on('error', () => {
          findAvailablePort(startPort + 1).then(resolve).catch(reject);
        });
      });
    };

    const port = await findAvailablePort(DEV_CONFIG.port);
    const host = '0.0.0.0';
    
    server.listen(port, host, async () => {
      console.log('\n' + '='.repeat(60));
      log(`🚀 RELIABLE DEV SERVER running on http://${host}:${port}`);
      log(`📝 Authentication completely bypassed - no Auth0 required!`);
      log(`👤 User: ${DEV_CONFIG.user.firstName} ${DEV_CONFIG.user.lastName}`);
      log(`📧 Email: ${DEV_CONFIG.user.email}`);
      log(`🔐 User ID: ${DEV_CONFIG.userId}`);
      log(`🏥 Specialty: ${DEV_CONFIG.user.specialty}`);
      console.log('='.repeat(60));
      log(`🌐 Frontend: http://localhost:${port}`);
      log(`🔍 API Health: http://localhost:${port}/api/health`);
      log(`ℹ️  Dev Info: http://localhost:${port}/api/dev/info`);
      log(`📊 User API: http://localhost:${port}/api/auth/user`);
      console.log('='.repeat(60));
      log(`💡 Features:`);
      log(`   - No login required - direct access to app`);
      log(`   - All API endpoints functional`);
      log(`   - Database operations enabled`);
      log(`   - AI features: ${process.env.OPENAI_API_KEY ? '✅' : '❌'} OpenAI, ${process.env.DEEPGRAM_API_KEY ? '✅' : '❌'} Deepgram`);
      log(`   - Session-based development user`);
      log(`   - Security middleware active`);
      console.log('='.repeat(60));
      log(`🚀 Ready for testing! Use CTRL+C to stop`);
      console.log('');

      // Initialize user in database
      try {
        await ensureUserExists();
      } catch (error) {
        log(`⚠️ Warning: Could not initialize user: ${error}`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start development server:', error);
    process.exit(1);
  }
})();
