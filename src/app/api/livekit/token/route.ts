import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const room = searchParams.get('room') || 'saruto-voice-room'
    const username = searchParams.get('username') || `clone-user-${Date.now().toString(36)}`

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey'
    const apiSecret =
      process.env.LIVEKIT_API_SECRET || 'secret_key_needs_to_be_long_enough_123456789'
    const livekitUrl =
      process.env.LIVEKIT_URL ||
      process.env.NEXT_PUBLIC_LIVEKIT_URL ||
      'wss://saruto-clone.livekit.cloud'

    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
    })

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({
      token,
      url: livekitUrl,
      room,
      username,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate LiveKit access token',
      },
      { status: 500 }
    )
  }
}

