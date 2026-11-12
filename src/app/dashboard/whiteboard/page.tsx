'use client'

import { useState, useEffect } from 'react'
import { CloneStore, CloneUser, ArchitectureDiagram } from '@/lib/clone-store'
import { ArchitectureWhiteboard } from '@/components/architecture-whiteboard'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WhiteboardPage() {
  const [user, setUser] = useState<CloneUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [customPrompt, setCustomPrompt] = useState('')
  const [activeDiagram, setActiveDiagram] = useState<ArchitectureDiagram | null>(null)
  const [statusNotice, setStatusNotice] = useState('')
  const router = useRouter()

  useEffect(() => {
    initData()
  }, [])

  const initData = async () => {
    try {
      let currentUser = await CloneStore.getCurrentUser()
      if (!currentUser && CloneStore.isLoginDisabled()) {
        currentUser = await CloneStore.loginAsGuest('creator@saruto.local')
      }
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      const presets = CloneStore.getPresetArchitectureDiagrams()
      setActiveDiagram(presets[0])
    } catch (err) {
      console.error('Error initializing whiteboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customPrompt.trim()) return

    setStatusNotice('Analyzing system architecture query...')
    try {
      const res = await fetch('/api/architecture/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customPrompt.trim() }),
      })

      const data = await res.json()
      if (res.ok && data.diagram) {
        setActiveDiagram(data.diagram)
        setStatusNotice(`Loaded architecture: ${data.diagram.title}`)
      } else {
        setStatusNotice(data.error || 'Failed to match architecture.')
      }
    } catch {
      setStatusNotice('Error querying architecture engine.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-mono">Initializing Architecture Studio...</span>
          <button
            type="button"
            onClick={() => setLoading(false)}
            className="text-[11px] text-zinc-500 hover:text-white underline mt-2 transition-colors"
          >
            Enter Studio Directly
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <div>
        {/* Navbar */}
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                Saruto AI
              </Link>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-900 text-zinc-400">
                Interactive Whiteboard
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                &larr; Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Body */}
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                System Design Visualization
              </span>
              <h1 className="text-3xl font-bold tracking-tight mt-1">
                Interactive Architecture Whiteboard
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Explain your system designs, communication protocols, and engineering trade-offs with
                interactive visual component diagrams narrated in your clone voice.
              </p>
            </div>
          </div>

          {/* Query Bar */}
          <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Query or Search Architecture Flow
            </h3>
            <form onSubmit={handleGenerateCustom} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Explain our real-time voice streaming pipeline or microservices mesh..."
                className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                className="bg-white text-black font-semibold text-xs px-6 py-2 rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap"
              >
                Visualize Flow
              </button>
            </form>

            {statusNotice && (
              <div className="text-xs text-zinc-400 font-mono pt-1">{statusNotice}</div>
            )}
          </div>

          {/* Interactive Whiteboard Canvas */}
          {activeDiagram && (
            <ArchitectureWhiteboard
              initialDiagram={activeDiagram}
              key={activeDiagram.id}
            />
          )}
        </main>
      </div>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture • Visual System Design
      </footer>
    </div>
  )
}

