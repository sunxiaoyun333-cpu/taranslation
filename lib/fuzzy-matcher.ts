import { standardsDB } from './standards-db'
import type { StandardDish } from './types'

export interface FuzzyMatchResult {
  dish: StandardDish
  similarity: number
  matched_field: 'name_cn' | 'name_en' | 'pinyin' | 'alternative'
}

export class FuzzyMatcher {
  findSimilar(query: string, threshold = 0.6, limit = 5): FuzzyMatchResult[] {
    const allDishes = standardsDB.getAllVerified()
    const results: FuzzyMatchResult[] = []

    for (const dish of allDishes) {
      const scores: Record<string, number> = {
        name_cn: this.similarity(query, dish.name_cn),
        name_en: this.similarity(query, dish.name_en_standard),
        pinyin: dish.pinyin ? this.similarity(query, dish.pinyin) : 0,
      }
      const altMax = Math.max(
        ...dish.name_en_alternatives.map(alt =>
          this.similarity(query, alt)
        ),
        0
      )
      scores.alternative = altMax

      const maxScore = Math.max(...Object.values(scores))

      if (maxScore >= threshold) {
        const matchedField = (Object.entries(scores)
          .find(([, score]) => score === maxScore)?.[0] || 'name_cn') as FuzzyMatchResult['matched_field']

        results.push({
          dish,
          similarity: maxScore,
          matched_field: matchedField
        })
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  similarity(s1: string, s2: string): number {
    const normalized1 = this.normalize(s1)
    const normalized2 = this.normalize(s2)

    if (normalized1 === normalized2) return 1.0
    if (normalized1.length === 0 || normalized2.length === 0) return 0

    const longer = normalized1.length > normalized2.length ? normalized1 : normalized2
    const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1

    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length
    const len2 = s2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    return matrix[len1][len2]
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^\w\u4e00-\u9fa5]/g, '')
  }
}

export const fuzzyMatcher = new FuzzyMatcher()
