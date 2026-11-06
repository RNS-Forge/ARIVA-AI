import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Saruto AI</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Create Your Clone
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 pt-24 pb-20 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1 rounded-full text-xs text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            Autonomous Personal AI Replication Engine
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Clone Yourself <br />
            <span className="text-zinc-500">into an AI Agent.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Replicate your communication patterns, core values, voice cadence, and specialized knowledge
            into an autonomous digital twin that thinks, answers, and reasons authentically as you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white text-black font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Initialize Your Clone
            </Link>
            <Link
              href="#architecture"
              className="w-full sm:w-auto border border-zinc-800 bg-zinc-950 text-white font-medium text-base px-8 py-3.5 rounded-xl hover:border-zinc-700 transition-colors"
            >
              View System Architecture
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-zinc-900 text-left">
            <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                Personality
              </span>
              <span className="text-lg font-bold text-white mt-1 block">Q&A Neural Bank</span>
              <span className="text-xs text-zinc-400 mt-1 block">Tone and decision-making</span>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                Acoustics
              </span>
              <span className="text-lg font-bold text-white mt-1 block">Voice Synthesis</span>
              <span className="text-xs text-zinc-400 mt-1 block">Cadence, pitch, and timbre</span>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                Grounding
              </span>
              <span className="text-lg font-bold text-white mt-1 block">Social & Knowledge</span>
              <span className="text-xs text-zinc-400 mt-1 block">GitHub, X, Articles, Bio</span>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/60 p-4 rounded-xl">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                Inference
              </span>
              <span className="text-lg font-bold text-white mt-1 block">Gemini / Grok</span>
              <span className="text-xs text-zinc-400 mt-1 block">Live LLM or Local Sandbox</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20 border-t border-zinc-800 bg-zinc-950">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                Core Capabilities
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Complete Identity Replication
              </h2>
              <p className="text-zinc-400 text-sm max-w-xl mx-auto">
                Every dimension required to build a digital twin capable of representing you in conversation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">1. Personality Training</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Train your clone on your life philosophy, ethical principles, conflict resolution,
                  humor style, and directness through deep questionnaire modules.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: 6 Guided Trait Categories
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">2. Voice & Acoustic Studio</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Record short audio clips directly in your browser or upload voice files.
                  Calibrate speech pacing, pitch, and audible speech playback.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: In-Browser Audio Synthesis
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">3. Interactive Twin Chat</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Engage directly with your clone. Inspect its live synthesized system prompt,
                  test edge-case questions, listen to spoken answers, and export transcripts.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: Multi-LLM Provider Engine
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="px-6 py-20 border-t border-zinc-800 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
              System Pipeline
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From Raw Identity to Digital Agent
            </h2>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-2xl space-y-8">
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="border-l-2 border-zinc-700 pl-4 space-y-1">
                <span className="text-xs font-mono text-zinc-500">STAGE 01</span>
                <h4 className="font-semibold text-white">Capture & Ingestion</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Structured personality questionnaire, audio duration metadata, social profiles, and writing notes.
                </p>
              </div>

              <div className="border-l-2 border-zinc-500 pl-4 space-y-1">
                <span className="text-xs font-mono text-zinc-500">STAGE 02</span>
                <h4 className="font-semibold text-white">Persona Prompt Synthesis</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Compiles your authentic answers into a strict first-person persona context with tone constraints.
                </p>
              </div>

              <div className="border-l-2 border-white pl-4 space-y-1">
                <span className="text-xs font-mono text-zinc-500">STAGE 03</span>
                <h4 className="font-semibold text-white">Autonomous Inference</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Executes via Gemini 1.5 Flash, Grok-Beta, or local Twin Simulator with audio playback.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-zinc-500">
                Pure monochrome blank theme. Zero emojis across all modules.
              </span>
              <Link
                href="/login"
                className="bg-white text-black font-semibold text-xs px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Launch Workspace &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture • All rights reserved
      </footer>
    </div>
  )
}
