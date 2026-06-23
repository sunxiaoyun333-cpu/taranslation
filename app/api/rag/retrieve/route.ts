import { NextRequest, NextResponse } from 'next/server'
import { ragRetrieval } from '@/lib/rag-retrieval'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string'
        },
        { status: 400 }
      )
    }

    const result = await ragRetrieval.retrieve(query)

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error: unknown) {
    console.error('RAG retrieval error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'popular'
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'))

    let dishes

    if (type === 'popular') {
      dishes = ragRetrieval.getPopular(limit)
    } else if (type === 'recent') {
      dishes = ragRetrieval.getRecent(limit)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Use "popular" or "recent"'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      type,
      dishes,
      count: dishes.length
    })

  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
