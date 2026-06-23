import { NextResponse } from 'next/server'
import { standardsDB } from '@/lib/standards-db'
import { embeddingsManager } from '@/lib/embeddings-manager'

export async function GET() {
  try {
    const dbStats = standardsDB.getStats()
    const embStats = embeddingsManager.getStats()

    const allDishes = standardsDB.getAll()
    const popularDishes = allDishes
      .sort((a, b) => (b.query_count || 0) - (a.query_count || 0))
      .slice(0, 10)
      .map(d => ({
        name_cn: d.name_cn,
        name_en: d.name_en_standard,
        query_count: d.query_count || 0
      }))

    return NextResponse.json({
      success: true,
      stats: {
        database: {
          total: dbStats.total,
          verified: dbStats.verified,
          categories: dbStats.by_category,
          cuisines: dbStats.by_cuisine,
          avg_confidence: dbStats.avg_confidence
        },
        embeddings: {
          total: embStats.total,
          dimension: embStats.vector_dimension,
          model: embStats.model
        },
        popular_dishes: popularDishes,
        system_health: {
          database_loaded: dbStats.total > 0,
          embeddings_loaded: embStats.total > 0,
          embeddings_complete: embStats.total === dbStats.total,
          status: embStats.total === dbStats.total ? 'healthy' : 'incomplete'
        }
      }
    })

  } catch (error: unknown) {
    console.error('Stats API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
