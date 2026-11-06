'use client'

import { useEffect, useState } from 'react'
import { CloneStore } from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LiveKitVoiceRoom } from '@/components/livekit-voice-room'

export default function VoiceChatPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const user = await CloneStore.getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-mono">Initializing LiveKit Audio Stream...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight">
              Saruto AI
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-900 text-zinc-400">
              LiveKit Voice Priority
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/chat"
              className="text-xs text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1.5 rounded transition-colors"
            >
              Switch to Text View
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col">
        <div className="flex-1 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 flex flex-col shadow-2xl">
          <LiveKitVoiceRoom />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-3 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture • LiveKit Audio Protocol
      </footer>
    </div>
  )
}

