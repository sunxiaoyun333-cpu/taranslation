export interface Allergen {
  name: string
  type: 'dairy' | 'eggs' | 'fish' | 'shellfish' | 'tree_nuts' | 'peanuts' | 'wheat' | 'soy' | 'sesame'
  severity?: 'high' | 'medium' | 'low'
  source?: string
  confidence?: 'high' | 'medium' | 'low'
}

export interface AllergenCheckResult {
  allergens: AllergenInfo[]
  missing_checks: string[]
  fda_disclaimer: string
  fda_disclaimer_cn: string
  safe_for: string[]
  safe_for_cn: string[]
}

export interface AllergenInfo {
  id: string
  name: string
  name_cn: string
  category: string
  fda_code: string
  warning_text: string
  severity: 'high' | 'medium' | 'low'
  sources_found: string[]
  sources_found_cn: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface Dish {
  id: string
  name_cn: string
  name_en: string
  name_en_standard?: string
  category: string
  category_cn: string
  cuisine?: string
  ingredients: string[]
  ingredients_cn: string[]
  ingredients_standard?: string[]
  allergens: Allergen[]
  allergens_standard?: string[]
  detected_allergens?: AllergenCheckResult
  spice_level: number
  description_short: string
  description_short_cn: string
  description_marketing: string
  description_marketing_cn: string
  translation_alternatives: string[]
  source?: string[]
  embedding?: number[]
  created_at?: string
  updated_at?: string
}

export interface TranslationRequest {
  query: string
  category?: string
  lang?: 'zh' | 'en'
}

export interface TranslationResult {
  dish: Dish
  compliance: ComplianceInfo
  marketing: MarketingInfo
  allergen_check: AllergenCheckResult
  search_info: SearchInfo
  confidence?: number
  source?: string
}

export interface ComplianceInfo {
  fda_allergen_statement: string
  requires_warning: boolean
  warnings: string[]
  warnings_cn: string[]
  notes: string[]
  notes_cn: string[]
}

export interface MarketingInfo {
  headline_en: string
  headline_cn: string
  description_en: string
  description_cn: string
  pairing_suggestions: string[]
  pairing_suggestions_cn: string[]
  tags: string[]
  tags_cn: string[]
  marketing_hooks?: {
    cn: string[]
    en: string[]
  }
  social_media_captions?: {
    instagram_cn: string
    instagram_en: string
    doordash_cn: string
    doordash_en: string
  }
  unique_selling_points?: string[]
}

export interface SearchInfo {
  query_used: string
  match_type: 'exact' | 'semantic' | 'partial' | 'none'
  match_score: number
  similar_dishes: string[]
}

export interface SearchQuery {
  query: string
  limit?: number
  threshold?: number
}

export interface SearchResult {
  items: Dish[]
  total: number
  query_time_ms: number
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  timestamp: string
}

export interface CacheEntry {
  key: string
  value: unknown
  ttl: number
  created_at: number
}

export interface EmbeddingRecord {
  id: string
  dish_id: string
  content: string
  embedding: number[]
  metadata: Record<string, string>
}

// ========== RAG System Types ==========

export interface StandardDish {
  id: string
  name_cn: string
  name_en_standard: string
  name_en_alternatives: string[]
  pinyin: string

  category: 'Appetizer' | 'Soup' | 'Main Course' | 'Noodles/Rice' | 'Dessert' | 'Beverage'
  cuisine: 'Sichuan' | 'Cantonese' | 'Shanghai' | 'Beijing' | 'Hunan' | 'Fujian' | 'Fusion' | 'Other'
  region?: string

  ingredients_standard: string[]
  allergens_standard: string[]
  spice_level: 0 | 1 | 2 | 3 | 4 | 5

  description_short: string
  description_marketing: string
  cooking_method?: string

  nutritional_info?: {
    calories?: string
    protein?: 'high' | 'medium' | 'low'
    is_vegetarian?: boolean
    is_vegan?: boolean
    is_gluten_free?: boolean
  }

  source: string[]
  confidence: number
  verified: boolean
  verified_by?: string
  verified_date?: string

  created_at: string
  updated_at: string
  query_count?: number
  last_queried?: string
}

export interface DishEmbedding {
  dish_id: string
  text: string
  vector: number[]
  model: string
  created_at: string
}

export interface RetrievalResult {
  type: 'exact_match' | 'fuzzy_match' | 'vector_match' | 'not_found'
  dish: StandardDish | null
  confidence: number
  match_score?: number
  matched_field?: 'name_cn' | 'name_en' | 'pinyin' | 'alternative'
  similar_dishes?: Array<{
    dish: StandardDish
    similarity: number
  }>
}

export interface EngineTranslationResult {
  type: 'exact_match' | 'fuzzy_match' | 'generated' | 'not_found'
  dish: StandardDish | null

  confidence: number
  needs_review: boolean

  similar_dishes?: Array<{
    dish: StandardDish
    similarity: number
  }>

  generated_content?: {
    marketing_copy?: string
    pairing_suggestions?: string[]
    faq?: Array<{ question: string; answer: string }>
  }

  query_time_ms: number
  source: 'standards_db' | 'rag_vector' | 'hybrid' | 'gemini'
  timestamp: string
}

export interface LLMTranslationInput {
  query: string
  category?: string
  allergens?: string[]
  existingDishes?: string[]
}

export interface LLMTranslationOutput {
  name_en: string
  name_cn: string
  category: string
  category_cn: string
  ingredients: string[]
  ingredients_cn: string[]
  spice_level: number
  description_short: string
  description_short_cn: string
  description_marketing: string
  description_marketing_cn: string
  translation_alternatives: string[]
  marketing_headline_en: string
  marketing_headline_cn: string
  marketing_description_en: string
  marketing_description_cn: string
  marketing_hooks?: {
    cn: string[]
    en: string[]
  }
  social_media_captions?: {
    instagram_cn: string
    instagram_en: string
    doordash_cn: string
    doordash_en: string
  }
  unique_selling_points?: string[]
  pairing_suggestions: string[]
  pairing_suggestions_cn: string[]
  tags: string[]
  tags_cn: string[]
  fda_warnings: string[]
  fda_warnings_cn: string[]
  fda_notes: string[]
  fda_notes_cn: string[]
}
