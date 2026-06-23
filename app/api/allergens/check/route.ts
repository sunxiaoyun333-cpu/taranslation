import { NextRequest, NextResponse } from 'next/server'
import { detectAllergens, generateAllergenStatement } from '@/lib/allergens'
import type { APIResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json()

    if (!Array.isArray(ingredients)) {
      const errorResponse: APIResponse<null> = {
        success: false,
        error: 'Ingredients must be an array',
        timestamp: new Date().toISOString(),
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const result = detectAllergens(ingredients)
    const statement = generateAllergenStatement(result)

    const response: APIResponse<typeof result & { statement: string }> = {
      success: true,
      data: { ...result, statement },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch {
    const errorResponse: APIResponse<null> = {
      success: false,
      error: 'Failed to check allergens',
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
