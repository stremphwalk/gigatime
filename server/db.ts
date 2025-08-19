import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import postgres from 'postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using Supabase (contains supabase.co) or Neon
const isSupabase = process.env.DATABASE_URL.includes('supabase.co');
const isProduction = process.env.NODE_ENV === 'production';

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleNeon>;

if (isSupabase) {
  // Supabase connection using postgres-js
  const sql = postgres(process.env.DATABASE_URL, {
    max: isProduction ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 60,
  });
  db = drizzle(sql, { schema });
} else {
  // Neon connection (existing setup for development)
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { db };
export const isDatabaseSupabase = isSupabase;