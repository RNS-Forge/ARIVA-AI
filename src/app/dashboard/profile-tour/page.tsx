'use client'

import { useState, useEffect } from 'react'
import { CloneStore, SocialLink, PersonalityQuestion } from '@/lib/clone-store'
import { PlaywrightService, PlaywrightTourResult } from '@/lib/playwright-service'
import { PlaywrightProfileViewer } from '@/components/playwright-profile-viewer'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfileTourPage() {
  const [socials, setSocials] = useState<SocialLink[]>([])
  const [personality, setPersonality] = useState<PersonalityQuestion[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<string>('linkedin')
  const [selectedFocus, setSelectedFocus] = useState<'experience' | 'education' | 'projects' | 'general'>('experience')
  const [customPrompt, setCustomPrompt] = useState('')
  const [tourResult, setTourResult] = useState<PlaywrightTourResult | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    initData()
  }, [])

  const initData = async () => {
    const user = await CloneStore.getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const sLinks = await CloneStore.getSocialLinks()
    setSocials(sLinks)
    if (sLinks.length > 0) {
      setSelectedPlatform(sLinks[0].platform)
    }

    const pData = await CloneStore.getPersonality()
    setPersonality(pData)

    setLoading(false)
  }

  const handleRunTour = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setGenerating(true)

    try {
      const user = await CloneStore.getCurrentUser()
      const userName = user?.email ? user.email.split('@')[0] : 'The Creator'

      const queryText = customPrompt.trim()
        ? customPrompt.trim()
        : `Show and explain my ${selectedPlatform} ${selectedFocus}`

      const result = await PlaywrightService.processQueryForProfileTour(
        queryText,
        socials,
        personality,
        userName
      )

      setTourResult(result)

      // Automatically speak the main narration script aloud
      if (result.narrationText) {
        speakNarration(result.narrationText)
      }
    } catch {
      // Ignore
    } finally {
      setGenerating(false)
    }
  }

  const speakNarration = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-mono">Loading Profile Tour Engine...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <div>
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                Saruto AI
              </Link>
              <span className="text-xs px-2 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-900 text-zinc-400">
                Playwright Automation
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard/voice-chat" className="text-xs text-white border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-500 transition-colors">
                Voice Mode &rarr;
              </Link>
              <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
                &larr; Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
              Autonomous Social Navigation
            </span>
            <h1 className="text-3xl font-bold tracking-tight mt-1">
              Playwright Social Profile Walkthrough
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Your AI clone autonomously navigates to your social profiles (LinkedIn, GitHub, Portfolio),
              scrolls through your experience, education, and projects, and explains them in voice.
            </p>
          </div>

          {/* Configuration Form */}
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-2xl space-y-6">
            <h2 className="text-base font-semibold">Select Walkthrough Parameters</h2>

            <form onSubmit={handleRunTour} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Target Profile Channel
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 capitalize"
                  >
                    {socials.length > 0 ? (
                      socials.map((s) => (
                        <option key={s.id} value={s.platform}>
                          {s.platform} ({s.url})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="linkedin">LinkedIn (Default)</option>
                        <option value="github">GitHub</option>
                        <option value="website">Portfolio Website</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Focus Section
                  </label>
                  <select
                    value={selectedFocus}
                    onChange={(e) => setSelectedFocus(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
                  >
                    <option value="experience">Professional Experience &amp; Roles</option>
                    <option value="education">Academic Education &amp; Certifications</option>
                    <option value="projects">Featured Projects &amp; Repositories</option>
                    <option value="general">Complete Profile Overview</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                  Or Natural Language Voice Query (Optional)
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Open my LinkedIn and explain my background in distributed systems..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-white text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Compiling Playwright Automation...' : 'Synthesize & Launch Profile Tour'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Tour Viewport & Code Display */}
          {tourResult && tourResult.isProfileQuery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">
                  Active Playwright Tour Stream
                </span>
                <span className="text-xs text-zinc-500">Auto-scrolling with synchronized speech</span>
              </div>

              <PlaywrightProfileViewer
                tourResult={tourResult}
                onNarrationPlay={speakNarration}
              />
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture • Dynamic Playwright Engine
      </footer>
    </div>
  )
}

