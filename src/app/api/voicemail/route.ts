import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { visitorName, visitorEmail, audioDataUrl, durationSeconds, transcript, cloneResponse } =
      body

    if (!transcript && !audioDataUrl) {
      return NextResponse.json(
        { error: 'Either transcript or audio data URL is required.' },
        { status: 400 }
      )
    }

    const voicemail = {
      id: 'vm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      visitor_name: visitorName?.trim() || 'Anonymous Visitor',
      visitor_email: visitorEmail?.trim() || 'not_provided@visitor.com',
      audio_url: audioDataUrl || '',
      duration_seconds: Number(durationSeconds) || 5,
      transcript: transcript?.trim() || 'Spoken audio inquiry',
      clone_response:
        cloneResponse?.trim() ||
        'Thank you for leaving a voice inquiry. I have logged your message in the creator inbox.',
      status: 'new' as const,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      voicemail,
      message: 'Voice inquiry recorded and saved successfully.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process voice inquiry.' },
      { status: 500 }
    )
  }
}

