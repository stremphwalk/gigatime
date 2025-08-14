import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (modified for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Replit user ID from claims.sub
  email: varchar("email", { length: 100 }),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  specialty: varchar("specialty", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  groupCode: varchar("group_code", { length: 4 }).notNull().unique(), // 4-character unique identifier
  maxMembers: integer("max_members").default(6),
  createdById: uuid("created_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Team expires after 7 days
});

// Team members junction table
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 50 }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Note templates table
export const noteTemplates = pgTable("note_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // admission, progress, consult
  description: text("description"),
  sections: jsonb("sections").notNull(), // array of section objects
  isDefault: boolean("is_default").default(false),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes table
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  patientName: varchar("patient_name", { length: 100 }),
  patientMrn: varchar("patient_mrn", { length: 50 }),
  patientDob: varchar("patient_dob", { length: 20 }),
  templateId: uuid("template_id").references(() => noteTemplates.id),
  templateType: varchar("template_type", { length: 50 }),
  content: jsonb("content").notNull(), // sections with their content
  status: varchar("status", { length: 20 }).default("draft"), // draft, finalized
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart phrases table - flexible system with mixed interactive elements
export const smartPhrases = pgTable("smart_phrases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  trigger: varchar("trigger", { length: 50 }).notNull(), // the phrase after /
  content: text("content").notNull(), // template with placeholders like {{picker1}}, {{date1}}, etc.
  description: varchar("description", { length: 200 }),
  category: varchar("category", { length: 50 }),
  elements: jsonb("elements"), // array of interactive elements: [{id: "picker1", type: "multipicker", options: [...]}]
  isPublic: boolean("is_public").default(false),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team todos table
export const teamTodos = pgTable("team_todos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  dueDate: timestamp("due_date"),
  assignedToId: uuid("assigned_to_id").references(() => users.id, { onDelete: 'set null' }),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  createdById: uuid("created_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team calendar events table
export const teamCalendarEvents = pgTable("team_calendar_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  allDay: boolean("all_day").default(false),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  createdById: uuid("created_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  smartPhrases: many(smartPhrases),
  teamMemberships: many(teamMembers),
  noteTemplates: many(noteTemplates),
  createdTodos: many(teamTodos, { relationName: "createdTodos" }),
  assignedTodos: many(teamTodos, { relationName: "assignedTodos" }),
  createdEvents: many(teamCalendarEvents),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  members: many(teamMembers),
  notes: many(notes),
  todos: many(teamTodos),
  calendarEvents: many(teamCalendarEvents),
  createdBy: one(users, { fields: [teams.createdById], references: [users.id] }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const noteTemplatesRelations = relations(noteTemplates, ({ one, many }) => ({
  user: one(users, { fields: [noteTemplates.userId], references: [users.id] }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  team: one(teams, { fields: [notes.teamId], references: [teams.id] }),
  template: one(noteTemplates, { fields: [notes.templateId], references: [noteTemplates.id] }),
}));

export const smartPhrasesRelations = relations(smartPhrases, ({ one }) => ({
  user: one(users, { fields: [smartPhrases.userId], references: [users.id] }),
}));

export const teamTodosRelations = relations(teamTodos, ({ one }) => ({
  team: one(teams, { fields: [teamTodos.teamId], references: [teams.id] }),
  assignedTo: one(users, { fields: [teamTodos.assignedToId], references: [users.id], relationName: "assignedTodos" }),
  createdBy: one(users, { fields: [teamTodos.createdById], references: [users.id], relationName: "createdTodos" }),
}));

export const teamCalendarEventsRelations = relations(teamCalendarEvents, ({ one }) => ({
  team: one(teams, { fields: [teamCalendarEvents.teamId], references: [teams.id] }),
  createdBy: one(users, { fields: [teamCalendarEvents.createdById], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteTemplateSchema = createInsertSchema(noteTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmartPhraseSchema = createInsertSchema(smartPhrases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamTodoSchema = createInsertSchema(teamTodos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamCalendarEventSchema = createInsertSchema(teamCalendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Pertinent Negatives Presets table
export const pertinentNegativePresets = pgTable("pertinent_negative_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  selectedSymptoms: jsonb("selected_symptoms").$type<Record<string, string[]>>().notNull(),
  userId: varchar("user_id").default("default-user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPertinentNegativePresetSchema = createInsertSchema(pertinentNegativePresets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type PertinentNegativePreset = typeof pertinentNegativePresets.$inferSelect;
export type InsertPertinentNegativePreset = z.infer<typeof insertPertinentNegativePresetSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;

export type NoteTemplate = typeof noteTemplates.$inferSelect;
export type InsertNoteTemplate = z.infer<typeof insertNoteTemplateSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type SmartPhrase = typeof smartPhrases.$inferSelect;
export type InsertSmartPhrase = z.infer<typeof insertSmartPhraseSchema>;

export type TeamTodo = typeof teamTodos.$inferSelect;
export type InsertTeamTodo = z.infer<typeof insertTeamTodoSchema>;

export type TeamCalendarEvent = typeof teamCalendarEvents.$inferSelect;
export type InsertTeamCalendarEvent = z.infer<typeof insertTeamCalendarEventSchema>;
