import { NextRequest, NextResponse } from 'next/server'
import { CloneStore } from '@/lib/clone-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Architecture query is required.' }, { status: 400 })
    }

    const matchedDiagram = CloneStore.detectArchitectureIntent(query)
    const diagrams = CloneStore.getPresetArchitectureDiagrams()

    const diagram = matchedDiagram || diagrams[0]

    return NextResponse.json({
      success: true,
      diagram,
      availablePresets: diagrams.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate architecture diagram.' },
      { status: 500 }
    )
  }
}

