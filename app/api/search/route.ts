import { NextRequest, NextResponse } from 'next/server'
import { searchDishes, searchByKeywords } from '@/lib/rag'
import type { SearchQuery, SearchResult, APIResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchQuery

    if (!body.query || body.query.trim().length === 0) {
      const errorResponse: APIResponse<null> = {
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString(),
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const result: SearchResult = await searchDishes({
      query: body.query.trim(),
      limit: body.limit || 10,
      threshold: body.threshold || 0.6,
    })

    if (result.items.length === 0) {
      const fallback = await searchByKeywords(body.query.trim(), body.limit || 10)
      result.items = fallback as typeof result.items
      result.total = fallback.length
    }

    const response: APIResponse<SearchResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch {
    const errorResponse: APIResponse<null> = {
      success: false,
      error: 'Search failed. Please try again.',
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
