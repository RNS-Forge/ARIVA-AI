import Link from 'next/link'

const isLoginDisabled = () => {
  const envVal = process.env.NEXT_PUBLIC_LOGIN ?? process.env.LOGIN
  if (envVal !== undefined && envVal !== null) {
    const norm = String(envVal).trim().toLowerCase()
    return norm === 'false' || norm === '0' || norm === 'disabled' || norm === 'off' || norm === 'no'
  }
  return false
}

export default function Home() {
  const loginDisabled = isLoginDisabled()
  const primaryHref = loginDisabled ? '/dashboard' : '/login'

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
            {!loginDisabled && (
              <Link
                href="/login"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}
            <Link
              href={primaryHref}
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              {loginDisabled ? 'Enter Workspace' : 'Create Your Clone'}
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
              href={primaryHref}
              className="w-full sm:w-auto bg-white text-black font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              {loginDisabled ? 'Enter Workspace' : 'Initialize Your Clone'}
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

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">1. Personality Training</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Train your clone on your life philosophy, ethics, communication directness,
                  and decision frameworks across 6 guided trait categories.
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
                <h3 className="text-xl font-bold">2. Voice Studio &amp; ElevenLabs</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Record audio in browser or calibrate ElevenLabs voice cloning with custom voice IDs,
                  stability, and similarity sliders for neural acoustics.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: Cloud Neural TTS &amp; Web Audio
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">3. LiveKit Real-Time Voice</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Engage directly in voice call sessions with 4 sound visualizer animations
                  (Bars, Orbital Rings, Waveform, Neural Orb) and live transcripts.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: WebRTC Audio Priority Room
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">4. Playwright Autonomous Tours</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  When asked about work or repos, the clone synthesizes Playwright scripts, launches
                  headless Chromium, captures live frames, and explains your experience.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: Headless Chromium Capture
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">5. Recruiter &amp; Client Agent</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Screen opportunities 24/7. Your clone communicates salary baselines,
                  scores mutual fit, collects contact details, and logs leads into an inbox.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: Candidate Screening &amp; Inbox
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">6. Standalone Export &amp; Embed</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Embed your clone with 1 line of HTML script or React component.
                  Download turnkey ZIP packages with zero external dependencies.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: 1-Line Embed &amp; Standalone ZIP
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">7. GitHub Repo Grounding</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Index codebases, README files, and module summaries into clone memory.
                  Answers reference verified architecture and implementation logic.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: Deep Codebase Knowledge
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">8. Async Voice Voicemails</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Visitors and recruiters record spoken audio notes directly in the widget.
                  Review voice inquiries with audio playback and clone confirmations.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: Inbound Audio Inquiries
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-8 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">9. Architecture Whiteboard</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Interactive system component graphs with real-time node inspection,
                  network protocol badges, latency estimates, and voice narration.
                </p>
                <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  Feature: Interactive System Design
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
                href={primaryHref}
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
