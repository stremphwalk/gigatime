import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.ts";
import { setupVite, serveStatic, log } from "./vite.ts";
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

// Mock authentication middleware that always passes
const mockAuth = (req: any, res: any, next: any) => {
  // Always set a mock user
  req.user = {
    claims: {
      sub: "123e4567-e89b-12d3-a456-426614174000",
      email: "doctor@hospital.com",
      first_name: "Dr. Sarah",
      last_name: "Mitchell"
    }
  };
  next();
};

// Mock user ID getter
const getMockUserId = () => "123e4567-e89b-12d3-a456-426614174000";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Apply mock authentication to all routes
app.use(mockAuth);

// Auth routes (mock responses)
app.get('/api/auth/user', async (req: any, res) => {
  try {
    const userId = getMockUserId();
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
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

app.post('/api/auth/logout', (req: any, res) => {
  res.json({ message: 'Logged out successfully (mock)' });
});

app.post('/api/auth/login', (req: any, res) => {
  res.json({ message: 'Logged in successfully (mock)' });
});

// Initialize user endpoint
app.post("/api/init-user", async (req, res) => {
  try {
    const userId = getMockUserId();
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
app.get("/api/note-templates", async (req, res) => {
  try {
    const userId = getMockUserId();
    
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

app.post("/api/note-templates", async (req, res) => {
  try {
    const userId = getMockUserId();
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

app.post("/api/note-templates/import", async (req, res) => {
  try {
    const userId = getMockUserId();
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
app.get("/api/notes", async (req, res) => {
  try {
    const userId = getMockUserId();
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
    const userId = getMockUserId();
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

// Deepgram API key endpoint
app.get("/api/deepgram-key", (req, res) => {
  res.json({ apiKey: process.env.DEEPGRAM_API_KEY });
});

// Smart phrase routes
app.get("/api/smart-phrases", async (req, res) => {
  try {
    const userId = getMockUserId();
    
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

app.post("/api/smart-phrases", async (req, res) => {
  try {
    const userId = getMockUserId();
    
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

app.put("/api/smart-phrases/:id", async (req, res) => {
  try {
    const userId = getMockUserId();
    
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

app.delete("/api/smart-phrases/:id", async (req, res) => {
  try {
    const userId = getMockUserId();
    
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

app.post("/api/smart-phrases/import/:shareableId", async (req: any, res) => {
  try {
    const userId = getMockUserId();
    
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
app.get("/api/teams", async (req, res) => {
  try {
    const userId = getMockUserId();
    const userTeams = await storage.getUserTeams(userId);
    res.json(userTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

app.post("/api/teams/create", async (req, res) => {
  try {
    const userId = getMockUserId();
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

app.post("/api/teams/join", async (req, res) => {
  try {
    const userId = getMockUserId();
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

app.post("/api/teams/:teamId/leave", async (req, res) => {
  try {
    const userId = getMockUserId();
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

app.get("/api/teams/:teamId/members", async (req, res) => {
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
app.get("/api/teams/:teamId/todos", async (req, res) => {
  try {
    const { teamId } = req.params;
    const todos = await storage.getTeamTodos(teamId);
    res.json(todos);
  } catch (error) {
    console.error("Error fetching team todos:", error);
    res.status(500).json({ message: "Failed to fetch team todos" });
  }
});

app.post("/api/teams/:teamId/todos", async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = getMockUserId();
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

app.put("/api/todos/:id", async (req, res) => {
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

app.delete("/api/todos/:id", async (req, res) => {
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
app.get("/api/teams/:teamId/calendar", async (req, res) => {
  try {
    const { teamId } = req.params;
    const events = await storage.getTeamCalendarEvents(teamId);
    res.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ message: "Failed to fetch calendar events" });
  }
});

app.post("/api/teams/:teamId/calendar", async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = getMockUserId();
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

app.put("/api/calendar/:id", async (req, res) => {
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

app.delete("/api/calendar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteTeamCalendarEvent(id);
    res.json({ message: "Calendar event deleted successfully" });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({ message: "Failed to delete calendar event" });
  }
});

// Initialize default templates
app.post("/api/init", async (req, res) => {
  try {
    const userId = getMockUserId();
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
app.get("/api/pertinent-negative-presets", async (req, res) => {
  try {
    const userId = getMockUserId();
    const presets = await storage.getPertinentNegativePresets(userId);
    res.json(presets);
  } catch (error) {
    console.error("Error fetching pertinent negative presets:", error);
    res.status(500).json({ message: "Failed to fetch presets" });
  }
});

app.post("/api/pertinent-negative-presets", async (req, res) => {
  try {
    const preset = req.body;
    const created = await storage.createPertinentNegativePreset(preset);
    res.json(created);
  } catch (error) {
    console.error("Error creating pertinent negative preset:", error);
    res.status(500).json({ message: "Failed to create preset" });
  }
});

app.put("/api/pertinent-negative-presets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await storage.updatePertinentNegativePreset(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating pertinent negative preset:", error);
    res.status(500).json({ message: "Failed to update preset" });
  }
});

app.delete("/api/pertinent-negative-presets/:id", async (req, res) => {
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
app.get("/api/user-lab-settings", async (req, res) => {
  try {
    const userId = getMockUserId();
    const settings = await storage.getUserLabSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error("Error fetching user lab settings:", error);
    res.status(500).json({ message: "Failed to fetch lab settings" });
  }
});

// Lab presets routes (no auth dev)
app.get("/api/lab-presets", async (req, res) => {
  try {
    const userId = 'default-user';
    const presets = await storage.getLabPresets(userId);
    res.json(presets);
  } catch (error) {
    console.error("Error fetching lab presets:", error);
    res.status(500).json({ message: "Failed to fetch lab presets" });
  }
});

app.post("/api/lab-presets", async (req, res) => {
  try {
    const userId = 'default-user';
    const { name, settings } = req.body || {};
    if (!name || !settings) return res.status(400).json({ message: 'name and settings required' });
    const created = await storage.createLabPreset({ userId, name, settings });
    res.json(created);
  } catch (error) {
    console.error("Error creating lab preset:", error);
    res.status(500).json({ message: "Failed to create lab preset" });
  }
});

app.put("/api/lab-presets/:id", async (req, res) => {
  try {
    const { id } = req.params as any;
    const updated = await storage.updateLabPreset(id, req.body || {});
    res.json(updated);
  } catch (error) {
    console.error("Error updating lab preset:", error);
    res.status(500).json({ message: "Failed to update lab preset" });
  }
});

app.delete("/api/lab-presets/:id", async (req, res) => {
  try {
    const { id } = req.params as any;
    await storage.deleteLabPreset(id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error("Error deleting lab preset:", error);
    res.status(500).json({ message: "Failed to delete lab preset" });
  }
});

app.post("/api/user-lab-settings", async (req, res) => {
  try {
    const userId = getMockUserId();
    const setting = { ...req.body, userId };
    const created = await storage.upsertUserLabSetting(setting);
    res.json(created);
  } catch (error) {
    console.error("Error saving user lab setting:", error);
    res.status(500).json({ message: "Failed to save lab setting" });
  }
});

app.delete("/api/user-lab-settings", async (req, res) => {
  try {
    const userId = getMockUserId();
    const { panelId, labId } = req.query;
    await storage.deleteUserLabSetting(userId, panelId as string, labId as string);
    res.json({ message: "Lab setting deleted successfully" });
  } catch (error) {
    console.error("Error deleting user lab setting:", error);
    res.status(500).json({ message: "Failed to delete lab setting" });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// Setup Vite for development
const server = createServer(app);

(async () => {
  await setupVite(app, server);

  // Try to find an available port starting from 5002
  const findAvailablePort = async (startPort: number): Promise<number> => {
    const net = await import('net');
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = (server.address() as any).port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        // Port is in use, try next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      });
    });
  };

  // Use environment PORT or find available port starting from 5002
  const defaultPort = parseInt(process.env.PORT || '5002', 10);
  const port = await findAvailablePort(defaultPort);
  const host = '0.0.0.0';
  
  server.listen(port, host, () => {
    log(`🚀 DEV SERVER (NO AUTH) running on http://${host}:${port}`);
    log(`📝 Authentication is completely bypassed for testing`);
    log(`👤 Mock user: Dr. Sarah Mitchell (doctor@hospital.com)`);
  });
})();
