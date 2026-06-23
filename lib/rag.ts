import { supabase } from './supabase'
import { generateEmbedding } from './gemini'
import { cosineSimilarity, extractKeywords } from './utils'
import { cache } from './cache'
import type { Dish, SearchResult, SearchQuery } from './types'

export async function searchDishes(query: SearchQuery): Promise<SearchResult> {
  const startTime = Date.now()
  const cacheKey = `search:${query.query.toLowerCase().trim()}:${query.limit || 10}:${query.threshold || 0.6}`

  const cached = cache.get<SearchResult>(cacheKey)
  if (cached) {
    cached.query_time_ms = Date.now() - startTime
    return cached
  }

  const queryEmbedding = await generateEmbedding(query.query)

  const { data: dishes, error } = await supabase
    .from('dishes')
    .select('*')
    .limit((query.limit || 10) * 3)

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  if (!dishes || dishes.length === 0) {
    const result: SearchResult = { items: [], total: 0, query_time_ms: Date.now() - startTime }
    return result
  }

  const threshold = query.threshold || 0.6
  const scored = (dishes as Dish[])
    .filter((d) => d.embedding && Array.isArray(d.embedding))
    .map((dish) => ({
      dish,
      score: cosineSimilarity(queryEmbedding, dish.embedding!),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, query.limit || 10)

  if (scored.length === 0) {
    const keywords = extractKeywords(query.query)
    const keywordResults = (dishes as Dish[])
      .filter((dish) => {
        const searchText = `${dish.name_cn} ${dish.name_en} ${dish.ingredients?.join(' ') || ''} ${dish.category || ''}`.toLowerCase()
        return keywords.some((kw) => searchText.includes(kw))
      })
      .slice(0, query.limit || 10)

    const result: SearchResult = {
      items: keywordResults,
      total: keywordResults.length,
      query_time_ms: Date.now() - startTime,
    }
    cache.set(cacheKey, result)
    return result
  }

  const result: SearchResult = {
    items: scored.map(({ dish, score }) => ({ ...dish, _match_score: score })),
    total: scored.length,
    query_time_ms: Date.now() - startTime,
  }

  cache.set(cacheKey, result)
  return result
}

export async function searchByKeywords(query: string, limit = 10): Promise<Dish[]> {
  const keywords = extractKeywords(query)

  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .limit(limit * 2)

  if (error || !data) return []

  const matches = (data as Dish[]).filter((dish) => {
    const searchText = `${dish.name_cn} ${dish.name_en} ${dish.ingredients?.join(' ') || ''} ${dish.category || ''}`.toLowerCase()
    return keywords.some((kw) => searchText.includes(kw))
  })

  return matches.slice(0, limit)
}

export async function getSimilarDishes(
  dishId: string,
  limit = 5
): Promise<Dish[]> {
  const { data: source, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('id', dishId)
    .single()

  if (error || !source || !(source as Dish).embedding) return []

  const sourceDish = source as Dish

  const { data: all } = await supabase
    .from('dishes')
    .select('*')
    .neq('id', dishId)
    .limit(50)

  if (!all) return []

  return (all as Dish[])
    .filter((d) => d.embedding && Array.isArray(d.embedding))
    .map((dish) => ({
      ...dish,
      _score: cosineSimilarity(sourceDish.embedding!, dish.embedding!),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
}
