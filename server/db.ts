// Reference: javascript_database integration
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from "@shared/schema";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...');

// Use standard PostgreSQL connection for better Render compatibility
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle({ client: pool, schema });

// Wipe database by dropping all tables
export async function wipeDatabase() {
  try {
    console.log('Wiping database...');
    // Get all table names in public schema
    const result = await pool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename != 'schema_migrations'
    `);

    // Drop all tables with CASCADE to handle dependencies
    for (const row of result.rows) {
      const tableName = row.tablename;
      await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      console.log(`Dropped table: ${tableName}`);
    }

    console.log('Database wiped successfully');
  } catch (error) {
    console.error('Error wiping database:', error);
    throw error;
  }
}

// Run migrations on startup
export async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Wipe database first to start from scratch
    await wipeDatabase();

    const migrationsFolder = path.join(__dirname, '../migrations');
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}