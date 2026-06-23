import fs from 'fs'
import path from 'path'
import { generateEmbedding } from './gemini'
import type { DishEmbedding, StandardDish } from './types'

const EMBEDDINGS_PATH = path.join(process.cwd(), 'data/standards/dish-embeddings.json')

export class EmbeddingsManager {
  private embeddings: DishEmbedding[]
  private embeddingsMap: Map<string, DishEmbedding>

  constructor() {
    this.embeddings = this.loadEmbeddings()
    this.embeddingsMap = new Map(this.embeddings.map(e => [e.dish_id, e]))
  }

  private loadEmbeddings(): DishEmbedding[] {
    try {
      if (!fs.existsSync(EMBEDDINGS_PATH)) {
        console.warn('⚠️ Embeddings file not found')
        return []
      }

      const data = fs.readFileSync(EMBEDDINGS_PATH, 'utf-8')
      const parsed = JSON.parse(data)
      return parsed.embeddings || []
    } catch (error) {
      console.error('Failed to load embeddings:', error)
      return []
    }
  }

  save(): void {
    try {
      const dir = path.dirname(EMBEDDINGS_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const data = JSON.stringify({ embeddings: this.embeddings }, null, 2)
      fs.writeFileSync(EMBEDDINGS_PATH, data, 'utf-8')
      console.log('✅ Embeddings saved successfully')
    } catch (error) {
      console.error('❌ Failed to save embeddings:', error)
      throw error
    }
  }

  async generateForDish(dish: StandardDish): Promise<DishEmbedding> {
    const text = [
      dish.name_cn,
      dish.name_en_standard,
      ...dish.name_en_alternatives,
      dish.pinyin,
      ...dish.ingredients_standard.slice(0, 5)
    ].filter(Boolean).join(' ')

    console.log(`📊 Generating embedding for: ${dish.name_cn}`)

    const vector = await generateEmbedding(text)

    const embedding: DishEmbedding = {
      dish_id: dish.id,
      text,
      vector,
      model: 'text-embedding-004',
      created_at: new Date().toISOString()
    }

    return embedding
  }

  async generateBatch(dishes: StandardDish[]): Promise<void> {
    console.log(`🚀 Generating embeddings for ${dishes.length} dishes...`)

    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i]

      try {
        const embedding = await this.generateForDish(dish)

        const existingIndex = this.embeddings.findIndex(e => e.dish_id === dish.id)
        if (existingIndex >= 0) {
          this.embeddings[existingIndex] = embedding
        } else {
          this.embeddings.push(embedding)
        }
        this.embeddingsMap.set(embedding.dish_id, embedding)

        console.log(`✅ [${i + 1}/${dishes.length}] ${dish.name_cn}`)

        if (i < dishes.length - 1) {
          await this.sleep(200)
        }
      } catch (error) {
        console.error(`❌ Failed for ${dish.name_cn}:`, error)
      }
    }

    this.save()
    console.log('🎉 Batch generation complete!')
  }

  getEmbedding(dishId: string): DishEmbedding | null {
    return this.embeddingsMap.get(dishId) || null
  }

  async search(query: string, topK = 5, threshold = 0.7): Promise<Array<{
    dish_id: string
    similarity: number
  }>> {
    const queryVector = await generateEmbedding(query)

    const scores = this.embeddings.map(embedding => ({
      dish_id: embedding.dish_id,
      similarity: this.cosineSimilarity(queryVector, embedding.vector)
    }))

    return scores
      .filter(s => s.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length')
    }

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      magnitudeA += vecA[i] * vecA[i]
      magnitudeB += vecB[i] * vecB[i]
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0
    }

    return dotProduct / (magnitudeA * magnitudeB)
  }

  getStats() {
    return {
      total: this.embeddings.length,
      vector_dimension: this.embeddings[0]?.vector.length || 0,
      model: this.embeddings[0]?.model || 'unknown'
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const embeddingsManager = new EmbeddingsManager()
