import { standardsDB } from './standards-db'
import { embeddingsManager } from './embeddings-manager'
import { fuzzyMatcher } from './fuzzy-matcher'
import type { RetrievalResult, StandardDish } from './types'

export class RAGRetrieval {
  async retrieve(query: string): Promise<RetrievalResult> {
    console.log(`🔍 RAG Retrieval: "${query}"`)

    const exactMatch = standardsDB.findExact(query)
    if (exactMatch) {
      console.log(`✅ Exact match: ${exactMatch.name_en_standard}`)
      standardsDB.incrementQueryCount(exactMatch.id)

      return {
        type: 'exact_match',
        dish: exactMatch,
        confidence: 1.0,
        matched_field: this.detectMatchedField(query, exactMatch)
      }
    }

    const fuzzyMatches = fuzzyMatcher.findSimilar(query, 0.7, 5)
    if (fuzzyMatches.length > 0 && fuzzyMatches[0].similarity > 0.85) {
      const bestMatch = fuzzyMatches[0]
      console.log(`✅ Fuzzy match: ${bestMatch.dish.name_en_standard} (${(bestMatch.similarity * 100).toFixed(1)}%)`)

      standardsDB.incrementQueryCount(bestMatch.dish.id)

      return {
        type: 'fuzzy_match',
        dish: bestMatch.dish,
        confidence: bestMatch.similarity,
        match_score: bestMatch.similarity,
        matched_field: bestMatch.matched_field,
        similar_dishes: fuzzyMatches.slice(1).map(m => ({
          dish: m.dish,
          similarity: m.similarity
        }))
      }
    }

    try {
      const vectorMatches = await embeddingsManager.search(query, 5, 0.7)

      if (vectorMatches.length > 0) {
        const bestMatch = vectorMatches[0]
        const dish = standardsDB.findById(bestMatch.dish_id)

        if (dish) {
          console.log(`✅ Vector match: ${dish.name_en_standard} (${(bestMatch.similarity * 100).toFixed(1)}%)`)
          standardsDB.incrementQueryCount(dish.id)

          const similarDishes = vectorMatches.slice(1)
            .map(m => ({
              dish: standardsDB.findById(m.dish_id),
              similarity: m.similarity
            }))
            .filter((item): item is { dish: StandardDish; similarity: number } =>
              item.dish !== null
            )

          return {
            type: 'vector_match',
            dish,
            confidence: bestMatch.similarity,
            match_score: bestMatch.similarity,
            similar_dishes: similarDishes
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Vector search failed:', error)
    }

    console.log(`❌ Not found: "${query}"`)

    if (fuzzyMatches.length > 0) {
      return {
        type: 'not_found',
        dish: null,
        confidence: 0,
        similar_dishes: fuzzyMatches.slice(0, 3).map(m => ({
          dish: m.dish,
          similarity: m.similarity
        }))
      }
    }

    return {
      type: 'not_found',
      dish: null,
      confidence: 0
    }
  }

  private detectMatchedField(
    query: string,
    dish: StandardDish
  ): 'name_cn' | 'name_en' | 'pinyin' | 'alternative' {
    const normalized = query.toLowerCase().trim()

    if (dish.name_cn.toLowerCase() === normalized) return 'name_cn'
    if (dish.name_en_standard.toLowerCase() === normalized) return 'name_en'
    if (dish.pinyin?.toLowerCase() === normalized) return 'pinyin'
    if (dish.name_en_alternatives.some(alt => alt.toLowerCase() === normalized)) {
      return 'alternative'
    }

    return 'name_cn'
  }

  getPopular(limit = 10): StandardDish[] {
    return standardsDB.getAll()
      .filter(d => d.verified)
      .sort((a, b) => (b.query_count || 0) - (a.query_count || 0))
      .slice(0, limit)
  }

  getRecent(limit = 10): StandardDish[] {
    return standardsDB.getAll()
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit)
  }
}

export const ragRetrieval = new RAGRetrieval()
