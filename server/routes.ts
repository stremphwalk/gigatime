import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  // Helper function to get mock user ID (replace with real auth later)
  const getMockUserId = () => "123e4567-e89b-12d3-a456-426614174000"; // Valid UUID

  // User routes
  app.get("/api/users/me", async (req, res) => {
    try {
      const userId = getMockUserId();
      // For now, create/return a mock user with proper UUID
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({
          id: userId,
          username: "mock-user",
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

  // Initialize user endpoint
  app.post("/api/init-user", async (req, res) => {
    try {
      const userId = getMockUserId();
      // Ensure user exists
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({
          id: userId,
          username: "mock-user",
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

  // Smart phrase routes
  app.get("/api/smart-phrases", async (req, res) => {
    try {
      const userId = getMockUserId();
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

  app.post("/api/smart-phrases", async (req, res) => {
    try {
      const userId = getMockUserId();
      const phraseData = insertSmartPhraseSchema.parse({ ...req.body, userId });
      const phrase = await storage.createSmartPhrase(phraseData);
      res.json(phrase);
    } catch (error) {
      console.error("Error creating smart phrase:", error);
      res.status(500).json({ message: "Failed to create smart phrase" });
    }
  });

  app.put("/api/smart-phrases/:id", async (req, res) => {
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

  app.delete("/api/smart-phrases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSmartPhrase(id);
      res.json({ message: "Smart phrase deleted successfully" });
    } catch (error) {
      console.error("Error deleting smart phrase:", error);
      res.status(500).json({ message: "Failed to delete smart phrase" });
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

  const httpServer = createServer(app);
  return httpServer;
}
