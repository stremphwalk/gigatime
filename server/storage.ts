import {
  users,
  teams,
  teamMembers,
  noteTemplates,
  notes,
  smartPhrases,
  teamTodos,
  teamCalendarEvents,
  teamBulletinPosts,
  teamTodoAssignees,
  pertinentNegativePresets,
  userLabSettings,
  autocompleteItems,
  type User,
  type InsertUser,
  type UpsertUser,
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
  type TeamBulletinPost,
  type InsertTeamBulletinPost,
  type PertinentNegativePreset,
  type InsertPertinentNegativePreset,
  type UserLabSetting,
  type InsertUserLabSetting,
  type AutocompleteItem,
  type InsertAutocompleteItem,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc, like, or, sql, gt, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByGroupCode(groupCode: string): Promise<Team | undefined>;
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]>;
  getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]>;
  getUserActiveTeam(userId: string): Promise<(TeamMember & { team: Team }) | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  joinTeamByGroupCode(groupCode: string, userId: string): Promise<{ success: boolean; message: string; team?: Team }>;
  leaveTeam(teamId: string, userId: string): Promise<{ success: boolean; message: string }>;
  addTeamMember(teamId: string, userId: string, role?: string): Promise<void>;
  generateUniqueGroupCode(): Promise<string>;
  deleteExpiredTeams(): Promise<number>;

  // Note template operations
  getNoteTemplates(userId?: string): Promise<NoteTemplate[]>;
  getNoteTemplate(id: string): Promise<NoteTemplate | undefined>;
  createNoteTemplate(template: InsertNoteTemplate): Promise<NoteTemplate>;
  updateNoteTemplate(id: string, template: Partial<InsertNoteTemplate>): Promise<NoteTemplate>;
  deleteNoteTemplate(id: string): Promise<void>;
  importNoteTemplate(shareableId: string, userId: string): Promise<{ success: boolean; message: string; template?: NoteTemplate }>;

  // Note operations
  getNotes(userId: string, limit?: number): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  purgeExpiredNotes(): Promise<number>;

  // Smart phrase operations
  getSmartPhrases(userId: string): Promise<SmartPhrase[]>;
  searchSmartPhrases(userId: string, query: string): Promise<SmartPhrase[]>;
  createSmartPhrase(phrase: InsertSmartPhrase): Promise<SmartPhrase>;
  updateSmartPhrase(id: string, phrase: Partial<InsertSmartPhrase>): Promise<SmartPhrase>;
  deleteSmartPhrase(id: string): Promise<void>;
  importSmartPhrase(shareableId: string, userId: string): Promise<{ success: boolean; message: string; phrase?: SmartPhrase }>;

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

  // Bulletin operations
  getTeamBulletinPosts(teamId: string): Promise<(TeamBulletinPost & { createdBy: User })[]>;
  createTeamBulletinPost(post: InsertTeamBulletinPost, creatorRole: string): Promise<TeamBulletinPost>;
  updateTeamBulletinPost(id: string, post: Partial<InsertTeamBulletinPost>): Promise<TeamBulletinPost>;
  deleteTeamBulletinPost(id: string): Promise<void>;

  // Pertinent negative preset operations
  getPertinentNegativePresets(userId: string): Promise<PertinentNegativePreset[]>;
  createPertinentNegativePreset(preset: Omit<InsertPertinentNegativePreset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<PertinentNegativePreset>;
  deletePertinentNegativePreset(id: string): Promise<void>;

  // User lab settings operations
  getUserLabSettings(userId: string): Promise<UserLabSetting[]>;
  upsertUserLabSetting(setting: InsertUserLabSetting): Promise<UserLabSetting>;
  deleteUserLabSetting(userId: string, panelId: string, labId: string): Promise<void>;

  // Autocomplete item operations
  getAutocompleteItems(userId: string): Promise<AutocompleteItem[]>;
  getAutocompleteItemsByCategory(userId: string, category: string): Promise<AutocompleteItem[]>;
  createAutocompleteItem(item: InsertAutocompleteItem): Promise<AutocompleteItem>;
  updateAutocompleteItem(id: string, item: Partial<InsertAutocompleteItem>): Promise<AutocompleteItem>;
  deleteAutocompleteItem(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  public db = db;
  /**
   * Ensure core tables and columns exist in production. This provides
   * resilience on fresh deployments where migrations may not have run.
   */
  public async ensureCoreSchema(): Promise<void> {
    // Create extension for gen_random_uuid if missing
    try {
      await this.db.execute(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    } catch {}

    // note_templates table and columns
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS note_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shareable_id VARCHAR(12) UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
        short_code VARCHAR(4) UNIQUE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        sections JSONB NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT FALSE,
        download_count INTEGER DEFAULT 0,
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE note_templates
        ADD COLUMN IF NOT EXISTS shareable_id VARCHAR(12) UNIQUE,
        ADD COLUMN IF NOT EXISTS short_code VARCHAR(4),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS sections JSONB,
        ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'note_templates_short_code_key'
        ) THEN
          CREATE UNIQUE INDEX note_templates_short_code_key ON note_templates(short_code);
        END IF;
      END $$;
    `);

    // smart_phrases table and columns
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS smart_phrases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shareable_id VARCHAR(12) UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
        short_code VARCHAR(4) UNIQUE,
        trigger VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        description VARCHAR(200),
        category VARCHAR(50),
        elements JSONB,
        is_public BOOLEAN DEFAULT FALSE,
        download_count INTEGER DEFAULT 0,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE smart_phrases
        ADD COLUMN IF NOT EXISTS shareable_id VARCHAR(12) UNIQUE,
        ADD COLUMN IF NOT EXISTS short_code VARCHAR(4),
        ADD COLUMN IF NOT EXISTS description VARCHAR(200),
        ADD COLUMN IF NOT EXISTS category VARCHAR(50),
        ADD COLUMN IF NOT EXISTS elements JSONB,
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS user_id VARCHAR,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'smart_phrases_short_code_key'
        ) THEN
          CREATE UNIQUE INDEX smart_phrases_short_code_key ON smart_phrases(short_code);
        END IF;
      END $$;
    `);

    // Seed a system user for public samples (if not present) and a few sample smart phrases with fixed short codes
    try {
      await this.db.execute(`
        INSERT INTO users(id, email, first_name, last_name, specialty)
        VALUES ('seed-public', 'seed@gigatime.app', 'Seed', 'User', 'General')
        ON CONFLICT (id) DO NOTHING;

        -- Text example
        INSERT INTO smart_phrases (short_code, shareable_id, trigger, content, description, category, elements, is_public, user_id)
        VALUES ('SP01', upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)), 'testtext', 'This is a sample text smart phrase for testing.', 'Sample text smart phrase', 'general', '[]', true, 'seed-public')
        ON CONFLICT (short_code) DO NOTHING;

        -- Date example
        INSERT INTO smart_phrases (short_code, shareable_id, trigger, content, description, category, elements, is_public, user_id)
        VALUES ('SP02', upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)), 'testdate', 'Date: {date}', 'Sample date smart phrase', 'general', '[{"id":"date","type":"date","label":"Date","placeholder":"{date}"}]', true, 'seed-public')
        ON CONFLICT (short_code) DO NOTHING;

        -- Multipicker example
        INSERT INTO smart_phrases (short_code, shareable_id, trigger, content, description, category, elements, is_public, user_id)
        VALUES ('SP03', upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)), 'testmulti', 'Choose: {option}', 'Sample multipicker smart phrase', 'general', '[{"id":"option","type":"multipicker","label":"Options","placeholder":"{option}","options":["Option A","Option B","Option C"]}]', true, 'seed-public')
        ON CONFLICT (short_code) DO NOTHING;

        -- Nested multipicker example
        INSERT INTO smart_phrases (short_code, shareable_id, trigger, content, description, category, elements, is_public, user_id)
        VALUES ('SP04', upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)), 'testnested', 'Path: {option}', 'Sample nested multipicker smart phrase', 'general', '[{"id":"option","type":"nested_multipicker","label":"Path","placeholder":"{option}","options":[{"label":"A","options":["A1","A2"]},{"label":"B","options":["B1","B2"]}]}]', true, 'seed-public')
        ON CONFLICT (short_code) DO NOTHING;
      `);
    } catch (e) {
      // non-fatal
    }

    // autocomplete_items table and columns
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS autocomplete_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shareable_id VARCHAR(12) UNIQUE,
        short_code VARCHAR(4) UNIQUE,
        text VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL,
        is_priority BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT FALSE,
        download_count INTEGER DEFAULT 0,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        dosage_options JSONB,
        frequency_options JSONB,
        description TEXT,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE autocomplete_items
        ADD COLUMN IF NOT EXISTS shareable_id VARCHAR(12) UNIQUE,
        ADD COLUMN IF NOT EXISTS short_code VARCHAR(4),
        ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS dosage_options JSONB,
        ADD COLUMN IF NOT EXISTS frequency_options JSONB,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ux_autocomplete_items_user_category_text'
        ) THEN
          CREATE UNIQUE INDEX ux_autocomplete_items_user_category_text
            ON public.autocomplete_items(user_id, category, text);
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS idx_autocomplete_items_user_id ON public.autocomplete_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_autocomplete_items_category ON public.autocomplete_items(category);
      CREATE INDEX IF NOT EXISTS idx_autocomplete_items_priority ON public.autocomplete_items(is_priority);
    `);

    // user_preferences table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ux_user_preferences_user'
        ) THEN
          CREATE UNIQUE INDEX ux_user_preferences_user ON user_preferences(user_id);
        END IF;
      END $$;
    `);

    // Ensure notes has expires_at for auto-delete policy
    await this.db.execute(`
      ALTER TABLE IF EXISTS notes
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
      CREATE INDEX IF NOT EXISTS idx_notes_expires_at ON public.notes(expires_at);
    `);
  }
  private async generateUniqueShortCodeFor(table: 'smartPhrases' | 'noteTemplates' | 'autocompleteItems'): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;
    while (attempts < 200) {
      let code = '';
      for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      let exists = false;
      if (table === 'smartPhrases') {
        const [row] = await db.select().from(smartPhrases).where(eq(smartPhrases.shortCode, code));
        exists = !!row;
      } else if (table === 'noteTemplates') {
        const [row] = await db.select().from(noteTemplates).where(eq(noteTemplates.shortCode, code));
        exists = !!row;
      } else {
        const [row] = await db.select().from(autocompleteItems).where(eq(autocompleteItems.shortCode, code));
        exists = !!row;
      }
      if (!exists) return code;
      attempts++;
    }
    throw new Error('Failed to generate unique short code');
  }
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Since we removed username from schema, return undefined for now
    return undefined;
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
    // Check if user is already in a team (one team per user limit)
    if (teamData.createdById) {
      const currentTeam = await this.getUserActiveTeam(teamData.createdById);
      if (currentTeam) {
        throw new Error('You are already in a team. Leave your current team to create a new one.');
      }
    }

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
      for (let i = 0; i < 6; i++) {
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

  async getUserActiveTeam(userId: string): Promise<(TeamMember & { team: Team }) | undefined> {
    const userTeams = await this.getUserTeams(userId);
    const now = new Date();
    const active = userTeams.find((ut) => ut.team.expiresAt && new Date(ut.team.expiresAt) > now);
    return active;
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

    // Check if user is already in any team (one team per user limit)
    const currentTeam = await this.getUserActiveTeam(userId);
    if (currentTeam) {
      return { success: false, message: 'You are already in a team. Leave your current team to join a different one.' };
    }

    // Check if team is full
    const existingMembers = await this.getTeamMembers(team.id);
    if (existingMembers.length >= (team.maxMembers ?? 6)) {
      return { success: false, message: 'This team is full' };
    }

    // Add user to team
    await this.addTeamMember(team.id, userId);
    
    return { success: true, message: 'Successfully joined team', team };
  }

  async leaveTeam(teamId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove user from team
      await db.delete(teamMembers).where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))
      );
      
      // Check if team is now empty and delete if so
      const remainingMembers = await this.getTeamMembers(teamId);
      if (remainingMembers.length === 0) {
        await db.delete(teams).where(eq(teams.id, teamId));
        return { success: true, message: 'Left team successfully. Team was disbanded as it had no remaining members.' };
      }
      
      return { success: true, message: 'Left team successfully' };
    } catch (error) {
      console.error('Error leaving team:', error);
      return { success: false, message: 'Failed to leave team' };
    }
  }

  async addTeamMember(teamId: string, userId: string, role: string = "member"): Promise<void> {
    await db.insert(teamMembers).values({ teamId, userId, role });
  }

  async deleteExpiredTeams(): Promise<number> {
    const now = new Date();
    const res: any = await db.execute(sql`DELETE FROM ${teams} WHERE ${teams.expiresAt} < ${now}`);
    // drizzle returns command tag; return rows affected when available
    return (res as any)?.rowCount ?? 0;
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
    console.log('[Storage.createNoteTemplate] Starting insert with data:', {
      ...templateData,
      sections: Array.isArray(templateData.sections) ? `[${templateData.sections.length} sections]` : templateData.sections
    });
    
    try {
      const [template] = await db.insert(noteTemplates).values(templateData).returning();
      // Try to backfill shortCode (ignore if column doesn't exist yet)
      try {
        if (!(template as any).shortCode) {
          const code = await this.generateUniqueShortCodeFor('noteTemplates');
          await db.update(noteTemplates).set({ shortCode: code as any }).where(eq(noteTemplates.id, template.id));
          (template as any).shortCode = code;
        }
      } catch {}
      console.log('[Storage.createNoteTemplate] Insert successful:', { id: template.id, name: template.name });
      return template;
    } catch (error) {
      console.error('[Storage.createNoteTemplate] Database error:', error);
      throw error;
    }
  }

  async updateNoteTemplate(id: string, templateData: Partial<InsertNoteTemplate>): Promise<NoteTemplate> {
    console.log('[Storage.updateNoteTemplate] Starting update:', {
      id,
      ...templateData,
      sections: Array.isArray(templateData.sections) ? `[${templateData.sections.length} sections]` : templateData.sections
    });
    
    try {
      const [template] = await db
        .update(noteTemplates)
        .set({ ...templateData, updatedAt: new Date() })
        .where(eq(noteTemplates.id, id))
        .returning();
      console.log('[Storage.updateNoteTemplate] Update successful:', { id: template.id, name: template.name });
      return template;
    } catch (error) {
      console.error('[Storage.updateNoteTemplate] Database error:', error);
      throw error;
    }
  }

  async deleteNoteTemplate(id: string): Promise<void> {
    await db.delete(noteTemplates).where(eq(noteTemplates.id, id));
  }

  async importNoteTemplate(shareableId: string, userId: string): Promise<{ success: boolean; message: string; template?: NoteTemplate }> {
    // Find the template by shareable ID
    const [sourceTemplate] = await db
      .select()
      .from(noteTemplates)
      .where(and(
        eq(noteTemplates.shareableId, shareableId),
        eq(noteTemplates.isPublic, true)
      ));

    if (!sourceTemplate) {
      return { success: false, message: 'Template not found or not public' };
    }

    // Check if user already has this template (avoid duplicates)
    const existingTemplate = await db
      .select()
      .from(noteTemplates)
      .where(and(
        eq(noteTemplates.userId, userId),
        eq(noteTemplates.name, sourceTemplate.name),
        eq(noteTemplates.type, sourceTemplate.type)
      ));

    if (existingTemplate.length > 0) {
      return { success: false, message: 'You already have a template with this name and type' };
    }

    // Create a copy for the user
    const templateCopy = {
      name: sourceTemplate.name,
      type: sourceTemplate.type,
      description: sourceTemplate.description,
      sections: sourceTemplate.sections,
      isDefault: false,
      isPublic: false,
      userId: userId,
    };

    const [newTemplate] = await db.insert(noteTemplates).values(templateCopy as any).returning();
    // Increment source download counter
    try {
      await db.update(noteTemplates)
        .set({ downloadCount: sql`${noteTemplates.downloadCount} + 1` as any })
        .where(eq(noteTemplates.id, sourceTemplate.id));
    } catch {}
    try {
      const code = await this.generateUniqueShortCodeFor('noteTemplates');
      await db.update(noteTemplates).set({ shortCode: code as any }).where(eq(noteTemplates.id, newTemplate.id));
      (newTemplate as any).shortCode = code;
    } catch {}
    return { success: true, message: 'Template imported successfully', template: newTemplate };
  }

  async importNoteTemplateByShortCode(shortCode: string, userId: string): Promise<{ success: boolean; message: string; template?: NoteTemplate }> {
    const [sourceTemplate] = await db
      .select()
      .from(noteTemplates)
      .where(eq(noteTemplates.shortCode, shortCode.toUpperCase()));
    if (!sourceTemplate) return { success: false, message: 'Template not found for code' };
    const [newTemplate] = await db.insert(noteTemplates).values({
      name: sourceTemplate.name,
      type: sourceTemplate.type,
      description: sourceTemplate.description,
      sections: sourceTemplate.sections,
      isDefault: false,
      isPublic: false,
      userId,
    } as any).returning();
    try {
      const code = await this.generateUniqueShortCodeFor('noteTemplates');
      await db.update(noteTemplates).set({ shortCode: code as any }).where(eq(noteTemplates.id, newTemplate.id));
      (newTemplate as any).shortCode = code;
    } catch {}
    // Increment source download counter
    try {
      await db.update(noteTemplates)
        .set({ downloadCount: sql`${noteTemplates.downloadCount} + 1` as any })
        .where(eq(noteTemplates.id, sourceTemplate.id));
    } catch {}
    return { success: true, message: 'Template imported', template: newTemplate };
  }

  // Note operations
  async getNotes(userId: string, limit: number = 50): Promise<Note[]> {
    const now = new Date();
    return await db
      .select()
      .from(notes)
      .where(and(
        eq(notes.userId, userId),
        or(isNull(notes.expiresAt), gt(notes.expiresAt, now))
      ))
      .orderBy(desc(notes.updatedAt))
      .limit(limit);
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(noteData: InsertNote): Promise<Note> {
    const expires = noteData.expiresAt ?? new Date(Date.now() + 48 * 60 * 60 * 1000);
    const [note] = await db.insert(notes).values({ ...noteData, expiresAt: expires }).returning();
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

  async purgeExpiredNotes(): Promise<number> {
    const now = new Date();
    const result = await db.execute(sql`DELETE FROM notes WHERE expires_at IS NOT NULL AND expires_at <= ${now}`);
    // drizzle execute returns object; try to parse rowCount if available; fallback 0
    const rc: any = result as any;
    const deleted = typeof rc.rowCount === 'number' ? rc.rowCount : 0;
    return deleted;
  }

  // Smart phrase operations
  async getSmartPhrases(userId: string): Promise<SmartPhrase[]> {
    return await db
      .select()
      .from(smartPhrases)
      .where(eq(smartPhrases.userId, userId))
      .orderBy(desc(smartPhrases.createdAt));
  }

  async searchSmartPhrases(userId: string, query: string): Promise<SmartPhrase[]> {
    return await db
      .select()
      .from(smartPhrases)
      .where(
        and(
          eq(smartPhrases.userId, userId),
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
    try {
      if (!(phrase as any).shortCode) {
        const code = await this.generateUniqueShortCodeFor('smartPhrases');
        await db.update(smartPhrases).set({ shortCode: code as any }).where(eq(smartPhrases.id, phrase.id));
        (phrase as any).shortCode = code;
      }
    } catch {}
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

  async importSmartPhrase(shareableId: string, userId: string): Promise<{ success: boolean; message: string; phrase?: SmartPhrase }> {
    // Find the smart phrase by shareable ID
    const [sourcePhrase] = await db
      .select()
      .from(smartPhrases)
      .where(and(
        eq(smartPhrases.shareableId, shareableId),
        eq(smartPhrases.isPublic, true)
      ));

    if (!sourcePhrase) {
      return { success: false, message: 'Smart phrase not found or not public' };
    }

    // Check if user already has this trigger (avoid conflicts)
    const existingPhrase = await db
      .select()
      .from(smartPhrases)
      .where(and(
        eq(smartPhrases.userId, userId),
        eq(smartPhrases.trigger, sourcePhrase.trigger)
      ));

    if (existingPhrase.length > 0) {
      return { success: false, message: 'You already have a smart phrase with this trigger' };
    }

    // Create a copy for the user
    const phraseCopy = {
      trigger: sourcePhrase.trigger,
      content: sourcePhrase.content,
      description: sourcePhrase.description,
      category: sourcePhrase.category,
      elements: sourcePhrase.elements,
      isPublic: false,
      userId: userId,
    };

    let newPhrase: SmartPhrase;
    try {
      [newPhrase] = await db.insert(smartPhrases).values(phraseCopy as any).returning();
      // then try to set code
      try {
        const code = await this.generateUniqueShortCodeFor('smartPhrases');
        await db.update(smartPhrases).set({ shortCode: code as any }).where(eq(smartPhrases.id, (newPhrase as any).id));
        (newPhrase as any).shortCode = code;
      } catch {}
    } catch (e) {
      throw e;
    }
    // Increment source download counter
    try {
      await db.update(smartPhrases)
        .set({ downloadCount: sql`${smartPhrases.downloadCount} + 1` as any })
        .where(eq(smartPhrases.id, sourcePhrase.id));
    } catch {}
    return { success: true, message: 'Smart phrase imported successfully', phrase: newPhrase };
  }

  async importSmartPhraseByShortCode(shortCode: string, userId: string): Promise<{ success: boolean; message: string; phrase?: SmartPhrase }> {
    const [sourcePhrase] = await db
      .select()
      .from(smartPhrases)
      .where(eq(smartPhrases.shortCode, shortCode.toUpperCase()));
    if (!sourcePhrase) return { success: false, message: 'Smart phrase not found for code' };
    const [newPhrase] = await db.insert(smartPhrases).values({
      trigger: sourcePhrase.trigger,
      content: sourcePhrase.content,
      description: sourcePhrase.description,
      category: sourcePhrase.category,
      elements: sourcePhrase.elements,
      isPublic: false,
      userId,
      shortCode: await this.generateUniqueShortCodeFor('smartPhrases'),
    }).returning();
    // Increment source download counter
    try {
      await db.update(smartPhrases)
        .set({ downloadCount: sql`${smartPhrases.downloadCount} + 1` as any })
        .where(eq(smartPhrases.id, sourcePhrase.id));
    } catch {}
    return { success: true, message: 'Smart phrase imported', phrase: newPhrase };
  }

  // Team todo operations
  async getTeamTodos(teamId: string): Promise<(TeamTodo & { assignedTo?: User; assignees?: User[]; createdBy: User })[]> {
    const todos = await db
      .select({
        id: teamTodos.id,
        title: teamTodos.title,
        description: teamTodos.description,
        completed: teamTodos.completed,
        priority: teamTodos.priority,
        dueDate: teamTodos.dueDate,
        assignedToId: teamTodos.assignedToId,
        status: (teamTodos as any).status,
        completedAt: (teamTodos as any).completedAt,
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
    const { teamTodoAssignees } = await import("../shared/schema.js");
    const todosWithAssignedUsers = await Promise.all(
      todos.map(async (todo) => {
        let assignedTo: User | undefined;
        let assignees: User[] | undefined;
        if (todo.assignedToId) {
          assignedTo = await this.getUser(todo.assignedToId);
        }
        try {
          const links = await db.select().from(teamTodoAssignees).where(eq(teamTodoAssignees.todoId, todo.id));
          if (links.length > 0) {
            const usersList: User[] = [] as any;
            for (const l of links) {
              const u = await this.getUser(l.userId);
              if (u) usersList.push(u as any);
            }
            assignees = usersList;
          }
        } catch {}
        return { ...todo, assignedTo, assignees };
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
        type: teamCalendarEvents.type,
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

  // Bulletin operations
  async getTeamBulletinPosts(teamId: string): Promise<(TeamBulletinPost & { createdBy: User })[]> {
    const rows = await db
      .select({
        id: teamBulletinPosts.id,
        teamId: teamBulletinPosts.teamId,
        createdById: teamBulletinPosts.createdById,
        title: teamBulletinPosts.title,
        content: teamBulletinPosts.content,
        pinned: teamBulletinPosts.pinned,
        isAdminPost: teamBulletinPosts.isAdminPost,
        createdAt: teamBulletinPosts.createdAt,
        updatedAt: teamBulletinPosts.updatedAt,
        createdBy: users,
      })
      .from(teamBulletinPosts)
      .innerJoin(users, eq(teamBulletinPosts.createdById, users.id))
      .where(eq(teamBulletinPosts.teamId, teamId))
      .orderBy(desc(teamBulletinPosts.pinned as any), desc(teamBulletinPosts.createdAt));
    return rows as any;
  }

  async createTeamBulletinPost(post: InsertTeamBulletinPost, creatorRole: string): Promise<TeamBulletinPost> {
    const isAdminPost = creatorRole === 'admin';
    const [row] = await db.insert(teamBulletinPosts).values({ ...post, isAdminPost } as any).returning();
    return row;
  }

  async updateTeamBulletinPost(id: string, post: Partial<InsertTeamBulletinPost>): Promise<TeamBulletinPost> {
    const [row] = await db
      .update(teamBulletinPosts)
      .set({ ...post, updatedAt: new Date() } as any)
      .where(eq(teamBulletinPosts.id, id))
      .returning();
    return row;
  }

  async deleteTeamBulletinPost(id: string): Promise<void> {
    await db.delete(teamBulletinPosts).where(eq(teamBulletinPosts.id, id));
  }

  // Pertinent negative preset operations
  async getPertinentNegativePresets(userId: string): Promise<PertinentNegativePreset[]> {
    return db
      .select()
      .from(pertinentNegativePresets)
      .where(eq(pertinentNegativePresets.userId, 'default-user')) // Use default-user for now
      .orderBy(desc(pertinentNegativePresets.createdAt));
  }

  async createPertinentNegativePreset(preset: Omit<InsertPertinentNegativePreset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<PertinentNegativePreset> {
    const [created] = await db
      .insert(pertinentNegativePresets)
      .values({
        name: preset.name,
        selectedSymptoms: preset.selectedSymptoms as Record<string, string[]>,
        userId: 'default-user',
      })
      .returning();
    return created;
  }

  async updatePertinentNegativePreset(id: string, updates: Partial<Pick<InsertPertinentNegativePreset, 'name' | 'selectedSymptoms'>>): Promise<PertinentNegativePreset> {
    const setValues: any = { updatedAt: new Date() };
    if (updates.name !== undefined) setValues.name = updates.name;
    if (updates.selectedSymptoms !== undefined) setValues.selectedSymptoms = updates.selectedSymptoms;
    
    const [updated] = await db
      .update(pertinentNegativePresets)
      .set(setValues)
      .where(eq(pertinentNegativePresets.id, id))
      .returning();
    return updated;
  }

  async deletePertinentNegativePreset(id: string): Promise<void> {
    await db.delete(pertinentNegativePresets).where(eq(pertinentNegativePresets.id, id));
  }

  // User lab settings operations
  async getUserLabSettings(userId: string): Promise<UserLabSetting[]> {
    return db
      .select()
      .from(userLabSettings)
      .where(eq(userLabSettings.userId, userId))
      .orderBy(userLabSettings.panelId, userLabSettings.labId);
  }

  async upsertUserLabSetting(setting: InsertUserLabSetting): Promise<UserLabSetting> {
    const [result] = await db
      .insert(userLabSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: [userLabSettings.userId, userLabSettings.panelId, userLabSettings.labId],
        set: {
          trendingCount: setting.trendingCount,
          isVisible: setting.isVisible,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async deleteUserLabSetting(userId: string, panelId: string, labId: string): Promise<void> {
    await db
      .delete(userLabSettings)
      .where(
        and(
          eq(userLabSettings.userId, userId),
          eq(userLabSettings.panelId, panelId),
          eq(userLabSettings.labId, labId)
        )
      );
  }

  // Autocomplete item operations
  async getAutocompleteItems(userId: string): Promise<AutocompleteItem[]> {
    return db
      .select()
      .from(autocompleteItems)
      .where(eq(autocompleteItems.userId, userId))
      .orderBy(desc(autocompleteItems.isPriority), autocompleteItems.category, autocompleteItems.text);
  }

  async getAutocompleteItemsByCategory(userId: string, category: string): Promise<AutocompleteItem[]> {
    return db
      .select()
      .from(autocompleteItems)
      .where(and(eq(autocompleteItems.userId, userId), eq(autocompleteItems.category, category)))
      .orderBy(desc(autocompleteItems.isPriority), autocompleteItems.text);
  }

  async createAutocompleteItem(item: InsertAutocompleteItem): Promise<AutocompleteItem> {
    const [newItem] = await db.insert(autocompleteItems).values(item as any).returning();
    try {
      if (!(newItem as any).shortCode) {
        const code = await this.generateUniqueShortCodeFor('autocompleteItems');
        await db.update(autocompleteItems).set({ shortCode: code as any }).where(eq(autocompleteItems.id, newItem.id));
        (newItem as any).shortCode = code;
      }
    } catch {}
    return newItem;
  }

  async updateAutocompleteItem(id: string, item: Partial<InsertAutocompleteItem>): Promise<AutocompleteItem> {
    const [updated] = await db
      .update(autocompleteItems)
      .set(item as any)
      .where(eq(autocompleteItems.id, id))
      .returning();
    return updated;
  }

  async deleteAutocompleteItem(id: string): Promise<void> {
    await db.delete(autocompleteItems).where(eq(autocompleteItems.id, id));
  }

  async getUserPreferences(userId: string) {
    const { userPreferences } = await import("../shared/schema.js");
    const [row] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return row as any;
  }
  async upsertUserPreferences(userId: string, data: any) {
    const { userPreferences } = await import("../shared/schema.js");
    const [row] = await db
      .insert(userPreferences)
      .values({ userId, data })
      .onConflictDoUpdate({ target: userPreferences.userId, set: { data, updatedAt: new Date() } })
      .returning();
    return row as any;
  }
  async importAutocompleteByShortCode(shortCode: string, userId: string): Promise<{ success: boolean; message: string; item?: AutocompleteItem }> {
    const [src] = await db.select().from(autocompleteItems).where(eq(autocompleteItems.shortCode, shortCode.toUpperCase()));
    if (!src) return { success: false, message: 'Autocomplete not found for code' };
    const [row] = await db.insert(autocompleteItems).values({
      userId,
      text: src.text,
      category: src.category,
      isPriority: false,
      dosage: src.dosage,
      frequency: src.frequency,
      dosageOptions: src.dosageOptions,
      frequencyOptions: src.frequencyOptions,
      description: src.description,
    } as any).returning();
    try {
      const code = await this.generateUniqueShortCodeFor('autocompleteItems');
      await db.update(autocompleteItems).set({ shortCode: code as any }).where(eq(autocompleteItems.id, row.id));
      (row as any).shortCode = code;
    } catch {}
    // Increment source download counter
    try {
      await db.update(autocompleteItems)
        .set({ downloadCount: sql`${autocompleteItems.downloadCount} + 1` as any })
        .where(eq(autocompleteItems.id, src.id));
    } catch {}
    return { success: true, message: 'Autocomplete imported', item: row };
  }

  // Lab presets operations
  async getLabPresets(userId: string) {
    const { labPresets } = await import("../shared/schema.js");
    const rows = await db.select().from(labPresets).where(eq(labPresets.userId, userId)).orderBy(desc(labPresets.createdAt));
    return rows;
  }
  async createLabPreset(preset: { userId: string; name: string; settings: any }) {
    const { labPresets } = await import("../shared/schema.js");
    const [row] = await db.insert(labPresets).values({ userId: preset.userId, name: preset.name, settings: preset.settings }).returning();
    return row;
  }
  async updateLabPreset(id: string, updates: Partial<{ name: string; settings: any }>) {
    const { labPresets } = await import("../shared/schema.js");
    const [row] = await db.update(labPresets).set({ ...updates, updatedAt: new Date() }).where(eq(labPresets.id, id)).returning();
    return row;
  }
  async deleteLabPreset(id: string): Promise<void> {
    const { labPresets } = await import("../shared/schema.js");
    await db.delete(labPresets).where(eq(labPresets.id, id));
  }
}

export const storage = new DatabaseStorage();
