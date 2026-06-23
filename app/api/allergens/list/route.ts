import { NextResponse } from 'next/server'
import { getAllFDAAllergens } from '@/lib/allergens'
import type { APIResponse } from '@/lib/types'

export async function GET() {
  try {
    const allergens = getAllFDAAllergens()

    const response: APIResponse<typeof allergens> = {
      success: true,
      data: allergens,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch {
    const errorResponse: APIResponse<null> = {
      success: false,
      error: 'Failed to fetch allergens.',
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
