import { neon } from "@neondatabase/serverless";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log('Initializing database...');
    
    for (const statement of statements) {
      if (statement) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        // Use sql as a tagged template literal
        await sql([statement + ';'] as any);
      }
    }
    
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDb();