import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function initDB() {
  console.log('Initializing database...')

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Enable pgvector extension
      CREATE EXTENSION IF NOT EXISTS vector;

      -- Dishes table
      CREATE TABLE IF NOT EXISTS dishes (
        id TEXT PRIMARY KEY,
        name_cn TEXT NOT NULL,
        name_en TEXT NOT NULL,
        category TEXT NOT NULL,
        ingredients TEXT[] NOT NULL DEFAULT '{}',
        allergens JSONB DEFAULT '[]',
        detected_allergens JSONB,
        spice_level INTEGER DEFAULT 0,
        description_short TEXT,
        description_marketing TEXT,
        translation_alternatives TEXT[] DEFAULT '{}',
        embedding vector(768),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Embedding cache table
      CREATE TABLE IF NOT EXISTS embeddings_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dish_id TEXT REFERENCES dishes(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(768) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Translation cache table
      CREATE TABLE IF NOT EXISTS translation_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query_text TEXT NOT NULL,
        result JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
      );

      CREATE INDEX IF NOT EXISTS translation_cache_query_idx
        ON translation_cache(query_text);

      CREATE INDEX IF NOT EXISTS dishes_category_idx
        ON dishes(category);

      CREATE INDEX IF NOT EXISTS dishes_embedding_idx
        ON dishes USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    `
  })

  if (error) {
    console.error('Database initialization failed:', error.message)
  } else {
    console.log('Database initialized successfully.')
  }
}

initDB()
