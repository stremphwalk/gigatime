import { defineConfig } from "drizzle-kit";
import 'dotenv/config';

const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("POSTGRES_URL or DATABASE_URL must be set; ensure the database is provisioned");
}

// Check if we're using Supabase
const isSupabase = DATABASE_URL.includes('supabase.co');

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
  // Supabase requires ssl in production
  ...(isSupabase && {
    dbCredentials: {
      url: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
  }),
});
