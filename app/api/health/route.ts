import { NextResponse } from 'next/server'
import { cache } from '@/lib/cache'
import type { APIResponse } from '@/lib/types'

export async function GET() {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
    cacheSize: cache.size(),
    timestamp: new Date().toISOString(),
  }

  const response: APIResponse<typeof health> = {
    success: true,
    data: health,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
