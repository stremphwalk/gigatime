import express from "express";
import { createServer } from "http";
import { storage } from "./storage.js";
import session from "express-session";
import { 
  insertNoteSchema, 
  insertNoteTemplateSchema, 
  insertSmartPhraseSchema,
  insertTeamTodoSchema,
  insertTeamCalendarEventSchema,
  insertUserSchema,
  insertUserLabSettingSchema
} from "../shared/schema.js";
import { z } from "zod";
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

// Development session for auth bypass
app.use(session({
  secret: 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// Mock user for development
const DEV_USER = {
  id: "dev-user-123",
  email: "dev@test.com",
  firstName: "Dev",
  lastName: "User",
  role: "doctor"
};

// Middleware to inject dev user
app.use((req: any, res, next) => {
  req.user = {
    claims: {
      sub: DEV_USER.id,
      email: DEV_USER.email,
      first_name: DEV_USER.firstName,
      last_name: DEV_USER.lastName
    }
  };
  next();
});

// Auth routes
app.get('/api/auth/user', async (req: any, res) => {
  try {
    let user = await storage.getUser(DEV_USER.id);
    
    if (!user) {
      user = await storage.createUser({
        id: DEV_USER.id,
        email: DEV_USER.email,
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
        role: DEV_USER.role,
        specialization: "General Practice",
        profileImageUrl: null,
        organizationId: null,
        createdAt: new Date()
      });
    }
    
    res.json({ user, isAuthenticated: true });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Notes API
app.get('/api/notes', async (req: any, res) => {
  try {
    const notes = await storage.getNotesByUserId(DEV_USER.id);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

app.post('/api/notes', async (req: any, res) => {
  try {
    const noteData = insertNoteSchema.parse(req.body);
    const note = await storage.createNote({
      ...noteData,
      userId: DEV_USER.id
    });
    res.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create note" });
  }
});

app.put('/api/notes/:id', async (req: any, res) => {
  try {
    const { id, ...noteData } = insertNoteSchema.parse({ id: req.params.id, ...req.body });
    const note = await storage.updateNote(id, noteData);
    res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update note" });
  }
});

app.delete('/api/notes/:id', async (req: any, res) => {
  try {
    await storage.deleteNote(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Note Templates API
app.get('/api/note-templates', async (req: any, res) => {
  try {
    const templates = await storage.getNoteTemplatesByUserId(DEV_USER.id);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

app.post('/api/note-templates', async (req: any, res) => {
  try {
    const templateData = insertNoteTemplateSchema.parse(req.body);
    const template = await storage.createNoteTemplate({
      ...templateData,
      userId: DEV_USER.id
    });
    res.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create template" });
  }
});

app.put('/api/note-templates/:id', async (req: any, res) => {
  try {
    const { id, ...templateData } = insertNoteTemplateSchema.parse({ id: req.params.id, ...req.body });
    const template = await storage.updateNoteTemplate(id, templateData);
    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update template" });
  }
});

app.delete('/api/note-templates/:id', async (req: any, res) => {
  try {
    await storage.deleteNoteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// Smart Phrases API
app.get('/api/smart-phrases', async (req: any, res) => {
  try {
    const phrases = await storage.getSmartPhrasesByUserId(DEV_USER.id);
    res.json(phrases);
  } catch (error) {
    console.error("Error fetching smart phrases:", error);
    res.status(500).json({ error: "Failed to fetch smart phrases" });
  }
});

app.post('/api/smart-phrases', async (req: any, res) => {
  try {
    const phraseData = insertSmartPhraseSchema.parse(req.body);
    const phrase = await storage.createSmartPhrase({
      ...phraseData,
      userId: DEV_USER.id
    });
    res.json(phrase);
  } catch (error) {
    console.error("Error creating smart phrase:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create smart phrase" });
  }
});

app.put('/api/smart-phrases/:id', async (req: any, res) => {
  try {
    const { id, ...phraseData } = insertSmartPhraseSchema.parse({ id: req.params.id, ...req.body });
    const phrase = await storage.updateSmartPhrase(id, phraseData);
    res.json(phrase);
  } catch (error) {
    console.error("Error updating smart phrase:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update smart phrase" });
  }
});

app.delete('/api/smart-phrases/:id', async (req: any, res) => {
  try {
    await storage.deleteSmartPhrase(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting smart phrase:", error);
    res.status(500).json({ error: "Failed to delete smart phrase" });
  }
});

// Autocomplete APIs
app.get('/api/autocomplete/:category', async (req: any, res) => {
  try {
    const { category } = req.params;
    const items = await storage.getAutocompleteItems(category, DEV_USER.id);
    res.json(items);
  } catch (error) {
    console.error("Error fetching autocomplete items:", error);
    res.status(500).json({ error: "Failed to fetch autocomplete items" });
  }
});

app.post('/api/autocomplete/:category', async (req: any, res) => {
  try {
    const { category } = req.params;
    const { value, metadata } = req.body;
    const item = await storage.createAutocompleteItem({
      text: value,
      category,
      description: metadata?.description,
      dosage: metadata?.dosage,
      frequency: metadata?.frequency,
      isPriority: metadata?.isPriority || false,
      userId: DEV_USER.id
    });
    res.json(item);
  } catch (error) {
    console.error("Error creating autocomplete item:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create autocomplete item" });
  }
});

// Initialize tables endpoint
app.post('/api/autocomplete/init-tables', async (req: any, res) => {
  try {
    await storage.initializeAutocompleteTables();
    res.json({ success: true, message: "Autocomplete tables initialized successfully" });
  } catch (error) {
    console.error("Error initializing tables:", error);
    res.status(500).json({ error: "Failed to initialize tables" });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Dev server is running', user: DEV_USER });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', mode: 'development' });
});

async function createDevServer() {
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  const PORT = process.env.DEV_PORT || 5002;
  const server = createServer(app);

  server.listen(PORT, () => {
    console.log(`🚀 Dev server running on http://localhost:${PORT}`);
    console.log(`📝 Using mock user: ${DEV_USER.email}`);
    console.log(`🔓 Authentication bypassed for development`);
    console.log(`⚡ Vite HMR enabled`);
  });

  return server;
}

createDevServer().catch(console.error);