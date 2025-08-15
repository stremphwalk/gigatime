import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { requireAuth, optionalAuth, getCurrentUserId } from "./auth";
import session from "express-session";
import { 
  insertNoteSchema, 
  insertNoteTemplateSchema, 
  insertSmartPhraseSchema,
  insertTeamTodoSchema,
  insertTeamCalendarEventSchema,
  insertUserSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session for development mode
  if (process.env.NODE_ENV === 'development') {
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
  
  // Set up proper authentication
  await setupAuth(app);


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
      const templates = await storage.getNoteTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching note templates:", error);
      res.status(500).json({ message: "Failed to fetch note templates" });
    }
  });

  app.post("/api/note-templates", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const templateData = insertNoteTemplateSchema.parse({ ...req.body, userId });
      const template = await storage.createNoteTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating note template:", error);
      res.status(500).json({ message: "Failed to create note template" });
    }
  });

  app.put("/api/note-templates/:id", requireAuth, async (req, res) => {
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
  app.get("/api/smart-phrases", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const query = req.query.q as string;
      
      let phrases;
      if (query) {
        phrases = await storage.searchSmartPhrases(userId, query);
      } else {
        phrases = await storage.getSmartPhrases(userId);
      }
      
      res.json(phrases);
    } catch (error) {
      console.error("Error fetching smart phrases:", error);
      res.status(500).json({ message: "Failed to fetch smart phrases" });
    }
  });

  app.post("/api/smart-phrases", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      const phraseData = insertSmartPhraseSchema.parse({ ...req.body, userId });
      const phrase = await storage.createSmartPhrase(phraseData);
      res.json(phrase);
    } catch (error) {
      console.error("Error creating smart phrase:", error);
      res.status(500).json({ message: "Failed to create smart phrase" });
    }
  });

  app.put("/api/smart-phrases/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const phraseData = insertSmartPhraseSchema.partial().parse(req.body);
      const phrase = await storage.updateSmartPhrase(id, phraseData);
      res.json(phrase);
    } catch (error) {
      console.error("Error updating smart phrase:", error);
      res.status(500).json({ message: "Failed to update smart phrase" });
    }
  });

  app.delete("/api/smart-phrases/:id", requireAuth, async (req, res) => {
    try {
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

  // Initialize default templates
  app.post("/api/init", requireAuth, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Check if templates already exist
      const existingTemplates = await storage.getNoteTemplates();
      if (existingTemplates.length > 0) {
        return res.json({ message: "Templates already initialized" });
      }

      // Create default templates
      const defaultTemplates = [
        {
          name: "Admission Note",
          type: "admission",
          isDefault: true,
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


  const httpServer = createServer(app);
  return httpServer;
}
