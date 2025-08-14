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
  const getMockUserId = () => "mock-user-id";

  // User routes
  app.get("/api/users/me", async (req, res) => {
    try {
      // For now, create/return a mock user
      let user = await storage.getUserByUsername("mock-user");
      if (!user) {
        user = await storage.createUser({
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

      // Create default smart phrases
      const defaultPhrases = [
        {
          trigger: "chest-pain",
          content: "Patient presents with chest pain described as [characterize pain]. Pain is [location] and [duration]. Associated symptoms include [symptoms]. No radiation to arms or jaw. No shortness of breath.",
          description: "Standard chest pain assessment",
          category: "cardiology",
          isPublic: true,
          userId
        },
        {
          trigger: "shortness-breath",
          content: "Patient reports shortness of breath with [onset]. Difficulty breathing is [severity] and [triggers]. No chest pain. No cough or sputum production.",
          description: "Shortness of breath template",
          category: "respiratory",
          isPublic: true,
          userId
        },
        {
          trigger: "abdominal-pain",
          content: "Patient presents with abdominal pain located in the [location]. Pain is described as [quality] and rated [scale]/10. [Associated symptoms]. No nausea or vomiting.",
          description: "Abdominal pain assessment",
          category: "gastroenterology",
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

  const httpServer = createServer(app);
  return httpServer;
}
