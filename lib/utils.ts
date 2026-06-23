export function generateId(): string {
  return `dish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0)
}

export function formatAllergenWarning(allergens: string[]): string {
  if (allergens.length === 0) return ''
  if (allergens.length === 1) return `Contains ${allergens[0]}`
  const last = allergens[allergens.length - 1]
  const rest = allergens.slice(0, -1).join(', ')
  return `Contains ${rest} and ${last}`
}

export function calculateSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim()
  const bLower = b.toLowerCase().trim()
  if (aLower === bLower) return 1

  const aWords = aLower.split(/\s+/)
  const bWords = bLower.split(/\s+/)
  const intersection = aWords.filter((w) => bWords.includes(w)).length
  const union = new Set([...aWords, ...bWords]).size

  return union === 0 ? 0 : intersection / union
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export function getSpiceLabel(level: number): string {
  const labels = ['Mild', 'Mild', 'Medium', 'Spicy', 'Very Spicy', 'Extra Hot']
  return labels[Math.min(level, 5)] || 'Mild'
}

export function getSpiceEmoji(level: number): string {
  return '🌶️'.repeat(Math.min(level, 5))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`
}

export function formatQueryTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'green'
  if (confidence >= 0.7) return 'yellow'
  return 'red'
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'High'
  if (confidence >= 0.7) return 'Medium'
  return 'Low'
}
