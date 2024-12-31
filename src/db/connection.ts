import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from `.env`
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // PostgreSQL connection string from `.env`
});

export const db = drizzle(pool);
