import {
  users,
  teams,
  teamMembers,
  noteTemplates,
  notes,
  smartPhrases,
  teamTodos,
  teamCalendarEvents,
  pertinentNegativePresets,
  type User,
  type InsertUser,
  type Team,
  type InsertTeam,
  type NoteTemplate,
  type InsertNoteTemplate,
  type Note,
  type InsertNote,
  type SmartPhrase,
  type InsertSmartPhrase,
  type TeamTodo,
  type InsertTeamTodo,
  type TeamCalendarEvent,
  type InsertTeamCalendarEvent,
  type TeamMember,
  type PertinentNegativePreset,
  type InsertPertinentNegativePreset,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByGroupCode(groupCode: string): Promise<Team | undefined>;
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]>;
  getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  joinTeamByGroupCode(groupCode: string, userId: string): Promise<{ success: boolean; message: string; team?: Team }>;
  addTeamMember(teamId: string, userId: string, role?: string): Promise<void>;
  generateUniqueGroupCode(): Promise<string>;

  // Note template operations
  getNoteTemplates(userId?: string): Promise<NoteTemplate[]>;
  getNoteTemplate(id: string): Promise<NoteTemplate | undefined>;
  createNoteTemplate(template: InsertNoteTemplate): Promise<NoteTemplate>;
  updateNoteTemplate(id: string, template: Partial<InsertNoteTemplate>): Promise<NoteTemplate>;
  deleteNoteTemplate(id: string): Promise<void>;

  // Note operations
  getNotes(userId: string, limit?: number): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  // Smart phrase operations
  getSmartPhrases(userId: string): Promise<SmartPhrase[]>;
  searchSmartPhrases(userId: string, query: string): Promise<SmartPhrase[]>;
  createSmartPhrase(phrase: InsertSmartPhrase): Promise<SmartPhrase>;
  updateSmartPhrase(id: string, phrase: Partial<InsertSmartPhrase>): Promise<SmartPhrase>;
  deleteSmartPhrase(id: string): Promise<void>;

  // Team todo operations
  getTeamTodos(teamId: string): Promise<(TeamTodo & { assignedTo?: User; createdBy: User })[]>;
  createTeamTodo(todo: InsertTeamTodo): Promise<TeamTodo>;
  updateTeamTodo(id: string, todo: Partial<InsertTeamTodo>): Promise<TeamTodo>;
  deleteTeamTodo(id: string): Promise<void>;

  // Team calendar operations
  getTeamCalendarEvents(teamId: string): Promise<(TeamCalendarEvent & { createdBy: User })[]>;
  createTeamCalendarEvent(event: InsertTeamCalendarEvent): Promise<TeamCalendarEvent>;
  updateTeamCalendarEvent(id: string, event: Partial<InsertTeamCalendarEvent>): Promise<TeamCalendarEvent>;
  deleteTeamCalendarEvent(id: string): Promise<void>;

  // Pertinent negative preset operations
  getPertinentNegativePresets(userId: string): Promise<PertinentNegativePreset[]>;
  createPertinentNegativePreset(preset: Omit<InsertPertinentNegativePreset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<PertinentNegativePreset>;
  deletePertinentNegativePreset(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Team operations
  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]> {
    const members = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        user: users,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    
    return members;
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const groupCode = await this.generateUniqueGroupCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const fullTeamData = {
      ...teamData,
      groupCode,
      expiresAt,
    };

    const [team] = await db.insert(teams).values(fullTeamData).returning();
    
    // Add creator as admin member
    if (teamData.createdById) {
      await this.addTeamMember(team.id, teamData.createdById, 'admin');
    }
    
    return team;
  }

  async getTeamByGroupCode(groupCode: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.groupCode, groupCode.toUpperCase()));
    return team;
  }

  async getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]> {
    const userTeams = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        team: teams,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));

    return userTeams;
  }

  async generateUniqueGroupCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const existing = await this.getTeamByGroupCode(code);
      if (!existing) {
        return code;
      }
      attempts++;
    }
    
    throw new Error('Unable to generate unique group code');
  }

  async joinTeamByGroupCode(groupCode: string, userId: string): Promise<{ success: boolean; message: string; team?: Team }> {
    const team = await this.getTeamByGroupCode(groupCode);
    
    if (!team) {
      return { success: false, message: 'Team not found with that group code' };
    }

    // Check if team has expired
    if (new Date() > team.expiresAt) {
      return { success: false, message: 'This team has expired' };
    }

    // Check if user is already a member
    const existingMembers = await this.getTeamMembers(team.id);
    const isAlreadyMember = existingMembers.some(member => member.userId === userId);
    
    if (isAlreadyMember) {
      return { success: false, message: 'You are already a member of this team' };
    }

    // Check if team is full
    if (existingMembers.length >= team.maxMembers) {
      return { success: false, message: 'This team is full' };
    }

    // Add user to team
    await this.addTeamMember(team.id, userId);
    
    return { success: true, message: 'Successfully joined team', team };
  }

  async addTeamMember(teamId: string, userId: string, role: string = "member"): Promise<void> {
    await db.insert(teamMembers).values({ teamId, userId, role });
  }

  // Note template operations
  async getNoteTemplates(userId?: string): Promise<NoteTemplate[]> {
    if (userId) {
      return await db
        .select()
        .from(noteTemplates)
        .where(or(eq(noteTemplates.userId, userId), eq(noteTemplates.isDefault, true)))
        .orderBy(desc(noteTemplates.isDefault), desc(noteTemplates.createdAt));
    }
    return await db
      .select()
      .from(noteTemplates)
      .where(eq(noteTemplates.isDefault, true))
      .orderBy(desc(noteTemplates.createdAt));
  }

  async getNoteTemplate(id: string): Promise<NoteTemplate | undefined> {
    const [template] = await db.select().from(noteTemplates).where(eq(noteTemplates.id, id));
    return template;
  }

  async createNoteTemplate(templateData: InsertNoteTemplate): Promise<NoteTemplate> {
    const [template] = await db.insert(noteTemplates).values(templateData).returning();
    return template;
  }

  async updateNoteTemplate(id: string, templateData: Partial<InsertNoteTemplate>): Promise<NoteTemplate> {
    const [template] = await db
      .update(noteTemplates)
      .set({ ...templateData, updatedAt: new Date() })
      .where(eq(noteTemplates.id, id))
      .returning();
    return template;
  }

  async deleteNoteTemplate(id: string): Promise<void> {
    await db.delete(noteTemplates).where(eq(noteTemplates.id, id));
  }

  // Note operations
  async getNotes(userId: string, limit: number = 50): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt))
      .limit(limit);
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(noteData: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }

  async updateNote(id: string, noteData: Partial<InsertNote>): Promise<Note> {
    const [note] = await db
      .update(notes)
      .set({ ...noteData, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Smart phrase operations
  async getSmartPhrases(userId: string): Promise<SmartPhrase[]> {
    return await db
      .select()
      .from(smartPhrases)
      .where(or(eq(smartPhrases.userId, userId), eq(smartPhrases.isPublic, true)))
      .orderBy(desc(smartPhrases.createdAt));
  }

  async searchSmartPhrases(userId: string, query: string): Promise<SmartPhrase[]> {
    return await db
      .select()
      .from(smartPhrases)
      .where(
        and(
          or(eq(smartPhrases.userId, userId), eq(smartPhrases.isPublic, true)),
          or(
            like(smartPhrases.trigger, `%${query}%`),
            like(smartPhrases.description, `%${query}%`)
          )
        )
      )
      .orderBy(desc(smartPhrases.createdAt))
      .limit(10);
  }

  async createSmartPhrase(phraseData: InsertSmartPhrase): Promise<SmartPhrase> {
    const [phrase] = await db.insert(smartPhrases).values(phraseData).returning();
    return phrase;
  }

  async updateSmartPhrase(id: string, phraseData: Partial<InsertSmartPhrase>): Promise<SmartPhrase> {
    const [phrase] = await db
      .update(smartPhrases)
      .set({ ...phraseData, updatedAt: new Date() })
      .where(eq(smartPhrases.id, id))
      .returning();
    return phrase;
  }

  async deleteSmartPhrase(id: string): Promise<void> {
    await db.delete(smartPhrases).where(eq(smartPhrases.id, id));
  }

  // Team todo operations
  async getTeamTodos(teamId: string): Promise<(TeamTodo & { assignedTo?: User; createdBy: User })[]> {
    const todos = await db
      .select({
        id: teamTodos.id,
        title: teamTodos.title,
        description: teamTodos.description,
        completed: teamTodos.completed,
        priority: teamTodos.priority,
        dueDate: teamTodos.dueDate,
        assignedToId: teamTodos.assignedToId,
        teamId: teamTodos.teamId,
        createdById: teamTodos.createdById,
        createdAt: teamTodos.createdAt,
        updatedAt: teamTodos.updatedAt,
        createdBy: users,
      })
      .from(teamTodos)
      .innerJoin(users, eq(teamTodos.createdById, users.id))
      .where(eq(teamTodos.teamId, teamId))
      .orderBy(desc(teamTodos.createdAt));

    // Get assigned users separately to avoid complex joins
    const todosWithAssignedUsers = await Promise.all(
      todos.map(async (todo) => {
        let assignedTo: User | undefined;
        if (todo.assignedToId) {
          assignedTo = await this.getUser(todo.assignedToId);
        }
        return { ...todo, assignedTo };
      })
    );

    return todosWithAssignedUsers;
  }

  async createTeamTodo(todoData: InsertTeamTodo): Promise<TeamTodo> {
    const [todo] = await db.insert(teamTodos).values(todoData).returning();
    return todo;
  }

  async updateTeamTodo(id: string, todoData: Partial<InsertTeamTodo>): Promise<TeamTodo> {
    const [todo] = await db
      .update(teamTodos)
      .set({ ...todoData, updatedAt: new Date() })
      .where(eq(teamTodos.id, id))
      .returning();
    return todo;
  }

  async deleteTeamTodo(id: string): Promise<void> {
    await db.delete(teamTodos).where(eq(teamTodos.id, id));
  }

  // Team calendar operations
  async getTeamCalendarEvents(teamId: string): Promise<(TeamCalendarEvent & { createdBy: User })[]> {
    const events = await db
      .select({
        id: teamCalendarEvents.id,
        title: teamCalendarEvents.title,
        description: teamCalendarEvents.description,
        startDate: teamCalendarEvents.startDate,
        endDate: teamCalendarEvents.endDate,
        allDay: teamCalendarEvents.allDay,
        teamId: teamCalendarEvents.teamId,
        createdById: teamCalendarEvents.createdById,
        createdAt: teamCalendarEvents.createdAt,
        updatedAt: teamCalendarEvents.updatedAt,
        createdBy: users,
      })
      .from(teamCalendarEvents)
      .innerJoin(users, eq(teamCalendarEvents.createdById, users.id))
      .where(eq(teamCalendarEvents.teamId, teamId))
      .orderBy(teamCalendarEvents.startDate);

    return events;
  }

  async createTeamCalendarEvent(eventData: InsertTeamCalendarEvent): Promise<TeamCalendarEvent> {
    const [event] = await db.insert(teamCalendarEvents).values(eventData).returning();
    return event;
  }

  async updateTeamCalendarEvent(id: string, eventData: Partial<InsertTeamCalendarEvent>): Promise<TeamCalendarEvent> {
    const [event] = await db
      .update(teamCalendarEvents)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(teamCalendarEvents.id, id))
      .returning();
    return event;
  }

  async deleteTeamCalendarEvent(id: string): Promise<void> {
    await db.delete(teamCalendarEvents).where(eq(teamCalendarEvents.id, id));
  }

  // Pertinent negative preset operations
  async getPertinentNegativePresets(userId: string): Promise<PertinentNegativePreset[]> {
    return db
      .select()
      .from(pertinentNegativePresets)
      .where(eq(pertinentNegativePresets.userId, 'default-user')) // Use default-user for now
      .orderBy(desc(pertinentNegativePresets.createdAt));
  }

  async createPertinentNegativePreset(preset: Omit<InsertPertinentNegativePreset, 'id' | 'createdAt' | 'updatedAt'>): Promise<PertinentNegativePreset> {
    const [created] = await db
      .insert(pertinentNegativePresets)
      .values({
        ...preset,
        userId: 'default-user', // Use default user for now
      })
      .returning();
    return created;
  }

  async updatePertinentNegativePreset(id: string, updates: Partial<Pick<InsertPertinentNegativePreset, 'name' | 'selectedSymptoms'>>): Promise<PertinentNegativePreset> {
    const [updated] = await db
      .update(pertinentNegativePresets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pertinentNegativePresets.id, id))
      .returning();
    return updated;
  }

  async deletePertinentNegativePreset(id: string): Promise<void> {
    await db.delete(pertinentNegativePresets).where(eq(pertinentNegativePresets.id, id));
  }
}

export const storage = new DatabaseStorage();
