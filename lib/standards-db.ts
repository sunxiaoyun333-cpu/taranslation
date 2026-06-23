import fs from 'fs'
import path from 'path'
import type { StandardDish } from './types'

const DISHES_PATH = path.join(process.cwd(), 'data/standards/verified-dishes.json')

export class StandardsDatabase {
  private dishes: StandardDish[]
  private dishesMap: Map<string, StandardDish>

  constructor() {
    this.dishes = this.loadDishes()
    this.dishesMap = new Map(this.dishes.map(d => [d.id, d]))
  }

  private loadDishes(): StandardDish[] {
    try {
      const data = fs.readFileSync(DISHES_PATH, 'utf-8')
      const parsed = JSON.parse(data)
      return parsed.dishes || []
    } catch (error) {
      console.error('Failed to load dishes:', error)
      return []
    }
  }

  save(): void {
    try {
      const dir = path.dirname(DISHES_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const data = JSON.stringify({ dishes: this.dishes }, null, 2)
      fs.writeFileSync(DISHES_PATH, data, 'utf-8')
      console.log('✅ Dishes saved successfully')
    } catch (error) {
      console.error('❌ Failed to save dishes:', error)
      throw error
    }
  }

  reload(): void {
    this.dishes = this.loadDishes()
    this.dishesMap = new Map(this.dishes.map(d => [d.id, d]))
    console.log(`🔄 Reloaded ${this.dishes.length} dishes`)
  }

  findExact(query: string): StandardDish | null {
    const normalized = this.normalize(query)

    return this.dishes.find(dish => {
      return (
        this.normalize(dish.name_cn) === normalized ||
        this.normalize(dish.name_en_standard) === normalized ||
        dish.name_en_alternatives.some(alt =>
          this.normalize(alt) === normalized
        ) ||
        (dish.pinyin && this.normalize(dish.pinyin) === normalized)
      )
    }) || null
  }

  findById(id: string): StandardDish | null {
    return this.dishesMap.get(id) || null
  }

  findByCategory(category: string): StandardDish[] {
    return this.dishes.filter(d => d.category === category)
  }

  findByCuisine(cuisine: string): StandardDish[] {
    return this.dishes.filter(d => d.cuisine === cuisine)
  }

  getAllVerified(): StandardDish[] {
    return this.dishes.filter(d => d.verified)
  }

  getAll(): StandardDish[] {
    return [...this.dishes]
  }

  search(query: string, limit = 10): StandardDish[] {
    const normalized = this.normalize(query)

    return this.dishes
      .filter(dish => {
        return (
          this.normalize(dish.name_cn).includes(normalized) ||
          this.normalize(dish.name_en_standard).includes(normalized) ||
          dish.name_en_alternatives.some(alt =>
            this.normalize(alt).includes(normalized)
          )
        )
      })
      .slice(0, limit)
  }

  add(dish: StandardDish): void {
    this.dishes.push(dish)
    this.dishesMap.set(dish.id, dish)
  }

  update(id: string, updates: Partial<StandardDish>): boolean {
    const dish = this.dishesMap.get(id)
    if (!dish) return false

    Object.assign(dish, updates, {
      updated_at: new Date().toISOString()
    })

    return true
  }

  delete(id: string): boolean {
    const index = this.dishes.findIndex(d => d.id === id)
    if (index === -1) return false

    this.dishes.splice(index, 1)
    this.dishesMap.delete(id)

    return true
  }

  getStats() {
    return {
      total: this.dishes.length,
      verified: this.dishes.filter(d => d.verified).length,
      by_category: this.groupBy('category'),
      by_cuisine: this.groupBy('cuisine'),
      avg_confidence: this.dishes.reduce((sum, d) => sum + d.confidence, 0) / this.dishes.length || 0
    }
  }

  incrementQueryCount(id: string): void {
    const dish = this.dishesMap.get(id)
    if (dish) {
      dish.query_count = (dish.query_count || 0) + 1
      dish.last_queried = new Date().toISOString()
    }
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
  }

  private groupBy(field: keyof StandardDish): Record<string, number> {
    return this.dishes.reduce((acc, dish) => {
      const key = String(dish[field])
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  export(): { dishes: StandardDish[] } {
    return { dishes: this.dishes }
  }
}

export const standardsDB = new StandardsDatabase()
