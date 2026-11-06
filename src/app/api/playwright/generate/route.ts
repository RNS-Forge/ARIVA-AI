import { NextRequest, NextResponse } from 'next/server'
import { PlaywrightService } from '@/lib/playwright-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, socialLinks, personalityData, userName } = body

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const result = await PlaywrightService.processQueryForProfileTour(
      query,
      socialLinks || [],
      personalityData || [],
      userName || 'The Creator'
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Playwright processing failed' },
      { status: 500 }
    )
  }
}

