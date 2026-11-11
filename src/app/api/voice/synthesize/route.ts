import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, voiceId, apiKey, stability, similarityBoost, modelId } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text prompt is required for synthesis.' }, { status: 400 })
    }

    const elevenKey = apiKey || process.env.ELEVENLABS_API_KEY

    // If ElevenLabs API key is provided, perform real voice cloning synthesis
    if (elevenKey && elevenKey.trim()) {
      const selectedVoice = voiceId || '21m00Tcm4TlvDq8ikWAM' // Default to Rachel if not chosen
      const selectedModel = modelId || 'eleven_multilingual_v2'

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenKey.trim(),
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text.slice(0, 1000), // Limit single synthesis block
            model_id: selectedModel,
            voice_settings: {
              stability: stability !== undefined ? Number(stability) : 0.5,
              similarity_boost: similarityBoost !== undefined ? Number(similarityBoost) : 0.75,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}))
        const errorMessage =
          errorJson.detail?.message ||
          errorJson.message ||
          `ElevenLabs request failed with status ${response.status}`
        return NextResponse.json({ error: errorMessage }, { status: response.status })
      }

      const audioBuffer = await response.arrayBuffer()
      const base64Audio = Buffer.from(audioBuffer).toString('base64')
      const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`

      return NextResponse.json({
        success: true,
        audioUrl: audioDataUrl,
        provider: 'elevenlabs',
        voiceId: selectedVoice,
      })
    }

    // Fallback response when ElevenLabs API key is not yet configured
    return NextResponse.json({
      success: false,
      isFallback: true,
      message:
        'ElevenLabs API key not configured. The clone will use browser speech synthesis for real-time speech.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Voice synthesis encountered an internal error.' },
      { status: 500 }
    )
  }
}

