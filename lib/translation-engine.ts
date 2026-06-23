import { ragRetrieval } from './rag-retrieval'
import { translateDish as geminiTranslate } from './gemini'
import { standardsDB } from './standards-db'
import type { EngineTranslationResult, StandardDish, LLMTranslationOutput } from './types'
import { v4 as uuidv4 } from 'uuid'

export class TranslationEngine {
  async translate(query: string): Promise<EngineTranslationResult> {
    const startTime = Date.now()

    console.log(`🔍 Translation request: "${query}"`)

    const ragResult = await ragRetrieval.retrieve(query)

    if (ragResult.type === 'exact_match' ||
        (ragResult.type === 'fuzzy_match' && ragResult.confidence > 0.9)) {

      console.log(`✅ Using RAG result: ${ragResult.dish!.name_en_standard}`)

      return {
        type: ragResult.type,
        dish: ragResult.dish!,
        confidence: ragResult.confidence,
        needs_review: false,
        query_time_ms: Date.now() - startTime,
        source: 'standards_db',
        timestamp: new Date().toISOString()
      }
    }

    if (ragResult.type === 'vector_match' && ragResult.confidence > 0.75) {
      console.log(`⚠️ Using vector match: ${ragResult.dish!.name_en_standard}`)

      return {
        type: 'fuzzy_match',
        dish: ragResult.dish!,
        confidence: ragResult.confidence,
        similar_dishes: ragResult.similar_dishes,
        needs_review: ragResult.confidence < 0.85,
        query_time_ms: Date.now() - startTime,
        source: 'rag_vector',
        timestamp: new Date().toISOString()
      }
    }

    if (ragResult.similar_dishes && ragResult.similar_dishes.length > 0) {
      const reference = ragResult.similar_dishes[0].dish

      console.log(`🤖 Generating with Gemini (reference: ${reference.name_en_standard})`)

      const generated = await geminiTranslate({
        query,
        category: reference.category,
        existingDishes: [reference.name_en_standard]
      })

      const dish = this.geminiToStandardDish(generated, query)

      return {
        type: 'generated',
        dish,
        similar_dishes: ragResult.similar_dishes.slice(0, 3),
        confidence: 0.6,
        needs_review: true,
        query_time_ms: Date.now() - startTime,
        source: 'hybrid',
        timestamp: new Date().toISOString()
      }
    }

    console.log(`🤖 Generating with Gemini (no reference)`)

    const generated = await geminiTranslate({ query })
    const dish = this.geminiToStandardDish(generated, query)

    return {
      type: 'generated',
      dish,
      confidence: 0.4,
      needs_review: true,
      query_time_ms: Date.now() - startTime,
      source: 'gemini',
      timestamp: new Date().toISOString()
    }
  }

  private geminiToStandardDish(geminiOutput: LLMTranslationOutput, originalQuery: string): StandardDish {
    const nameCn = geminiOutput.name_cn || originalQuery
    const nameEn = geminiOutput.name_en || ''

    return {
      id: uuidv4(),
      name_cn: nameCn,
      name_en_standard: nameEn,
      name_en_alternatives: geminiOutput.translation_alternatives || [],
      pinyin: '',
      category: geminiOutput.category as StandardDish['category'] || 'Main Course',
      cuisine: 'Other',
      ingredients_standard: geminiOutput.ingredients || [],
      allergens_standard: geminiOutput.fda_warnings || [],
      spice_level: (geminiOutput.spice_level as StandardDish['spice_level']) || 0,
      description_short: geminiOutput.description_short || '',
      description_marketing: geminiOutput.description_marketing || '',
      nutritional_info: {
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false
      },
      source: ['Gemini AI'],
      confidence: 0.4,
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

export const translationEngine = new TranslationEngine()
