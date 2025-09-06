import { pgTable, unique, uuid, varchar, text, jsonb, boolean, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const noteTemplates = pgTable("note_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shareableId: varchar("shareable_id", { length: 12 }).default(upper("substring"(replace((gen_random_uuid())::text, \'-\'::text, \'::text), 1, 12))).notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	sections: jsonb().notNull(),
	isDefault: boolean("is_default").default(false),
	isPublic: boolean("is_public").default(false),
	userId: uuid("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("note_templates_shareable_id_unique").on(table.shareableId),
]);

export const notes = pgTable("notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	patientName: varchar("patient_name", { length: 100 }),
	patientMrn: varchar("patient_mrn", { length: 50 }),
	patientDob: varchar("patient_dob", { length: 20 }),
	templateId: uuid("template_id"),
	templateType: varchar("template_type", { length: 50 }),
	content: jsonb().notNull(),
	status: varchar({ length: 20 }).default('draft'),
	userId: uuid("user_id").notNull(),
	teamId: uuid("team_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const pertinentNegativePresets = pgTable("pertinent_negative_presets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar().notNull(),
	selectedSymptoms: jsonb("selected_symptoms").notNull(),
	userId: varchar("user_id").default('default-user'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
});

export const smartPhrases = pgTable("smart_phrases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shareableId: varchar("shareable_id", { length: 12 }).default(upper("substring"(replace((gen_random_uuid())::text, \'-\'::text, \'::text), 1, 12))).notNull(),
	trigger: varchar({ length: 50 }).notNull(),
	content: text().notNull(),
	description: varchar({ length: 200 }),
	category: varchar({ length: 50 }),
	elements: jsonb(),
	isPublic: boolean("is_public").default(false),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("smart_phrases_shareable_id_unique").on(table.shareableId),
]);

export const teamCalendarEvents = pgTable("team_calendar_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	allDay: boolean("all_day").default(false),
	type: varchar({ length: 30 }).default('other'),
	teamId: uuid("team_id").notNull(),
	createdById: uuid("created_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: varchar({ length: 50 }).default('member'),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
});

export const teamTodos = pgTable("team_todos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	completed: boolean().default(false),
	priority: varchar({ length: 20 }).default('medium'),
	dueDate: timestamp("due_date", { mode: 'string' }),
	status: varchar({ length: 30 }).default('backlog'),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	assignedToId: uuid("assigned_to_id"),
	teamId: uuid("team_id").notNull(),
	createdById: uuid("created_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const teamTodoAssignees = pgTable("team_todo_assignees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	todoId: uuid("todo_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const teams = pgTable("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	groupCode: varchar("group_code", { length: 6 }).notNull(),
	maxMembers: integer("max_members").default(8),
	createdById: uuid("created_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("teams_group_code_unique").on(table.groupCode),
]);

export const teamBulletinPosts = pgTable("team_bulletin_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	createdById: uuid("created_by_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	pinned: boolean().default(false),
	isAdminPost: boolean("is_admin_post").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: varchar().primaryKey().notNull(),
	email: varchar({ length: 100 }),
	firstName: varchar("first_name", { length: 50 }),
	lastName: varchar("last_name", { length: 50 }),
	profileImageUrl: varchar("profile_image_url", { length: 500 }),
	specialty: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});
