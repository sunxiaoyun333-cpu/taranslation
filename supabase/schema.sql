-- supabase/schema.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Dishes table (main menu data)
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  name_cn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Main Course',
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

-- Allergen mappings table
CREATE TABLE IF NOT EXISTS allergen_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_en TEXT NOT NULL,
  ingredient_cn TEXT,
  allergen_ids TEXT[] NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ingredient_en)
);

-- Indexes
CREATE INDEX IF NOT EXISTS dishes_category_idx ON dishes(category);
CREATE INDEX IF NOT EXISTS dishes_embedding_idx
  ON dishes USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX IF NOT EXISTS translation_cache_query_idx ON translation_cache(query_text);
CREATE INDEX IF NOT EXISTS allergen_mappings_ingredient_idx ON allergen_mappings(ingredient_en);
