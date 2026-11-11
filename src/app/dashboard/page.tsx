'use client'

import { useEffect, useState } from 'react'
import { CloneStore, CloneUser, CloneProgress, PersonalityQuestion, VoiceSample, SocialLink } from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<CloneUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<CloneProgress>({
    personality_percentage: 0,
    voice_percentage: 0,
    knowledge_percentage: 0,
    overall_percentage: 0,
    fidelity_status: 'Nascent Stage',
  })
  const [personalityCount, setPersonalityCount] = useState(0)
  const [voiceCount, setVoiceCount] = useState(0)
  const [voiceDuration, setVoiceDuration] = useState(0)
  const [socialCount, setSocialCount] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [repoCount, setRepoCount] = useState(0)
  const [voicemailCount, setVoicemailCount] = useState(0)
  const [latestTrait, setLatestTrait] = useState<PersonalityQuestion | null>(null)
  const [showSchemaModal, setShowSchemaModal] = useState(false)
  const [copiedSchema, setCopiedSchema] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const currentUser = await CloneStore.getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      const prog = await CloneStore.calculateProgress()
      setProgress(prog)

      const pList = await CloneStore.getPersonality()
      setPersonalityCount(pList.length)
      if (pList.length > 0) {
        setLatestTrait(pList[0])
      }

      const vList = await CloneStore.getVoiceSamples()
      setVoiceCount(vList.length)
      const totalSec = vList.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
      setVoiceDuration(totalSec)

      const sList = await CloneStore.getSocialLinks()
      setSocialCount(sList.length)

      const lList = await CloneStore.getRecruiterLeads()
      setLeadsCount(lList.length)

      const rList = await CloneStore.getIngestedRepositories()
      setRepoCount(rList.length)

      const vListAsync = await CloneStore.getVoiceVoicemails()
      setVoicemailCount(vListAsync.length)

      setLoading(false)
    }

    init()
  }, [router])

  const handleLogout = async () => {
    await CloneStore.signOut()
    router.push('/')
  }

  const copySqlSchema = () => {
    const sql = `-- Saruto AI PostgreSQL Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'grok')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS personality_training (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS clone_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_percentage INTEGER DEFAULT 0,
  voice_percentage INTEGER DEFAULT 0,
  knowledge_percentage INTEGER DEFAULT 0,
  overall_percentage INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS voice_samples (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS social_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, platform)
);

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);`
    navigator.clipboard.writeText(sql)
    setCopiedSchema(true)
    setTimeout(() => setCopiedSchema(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm">Loading clone architecture...</span>
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
              <Link href="/" className="text-xl font-bold tracking-tight">
                Saruto AI
              </Link>
              <span className="text-xs px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                {user?.isGuest ? 'Local Sandbox' : 'Cloud Sync'}
              </span>
            </div>

            <div className="flex items-center gap-5">
              <button
                onClick={() => setShowSchemaModal(true)}
                className="text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded px-2.5 py-1 hover:border-zinc-700 transition-colors"
              >
                Database Schema
              </button>
              <span className="text-zinc-400 text-sm hidden sm:inline">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                Autonomous Persona Dashboard
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
                Your AI Twin
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Train your speech, beliefs, and communication habits into an autonomous clone.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/voice-chat"
                className="bg-white text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Voice Call Clone (LiveKit)</span>
              </Link>
              <Link
                href="/dashboard/recruiter"
                className="border border-zinc-700 bg-zinc-900 text-white font-medium text-sm px-5 py-3 rounded-lg hover:border-zinc-500 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Recruiter Agent</span>
              </Link>
              <Link
                href="/dashboard/chat"
                className="border border-zinc-700 bg-zinc-900 text-white font-medium text-sm px-5 py-3 rounded-lg hover:border-zinc-500 transition-colors flex items-center gap-2"
              >
                <span>Text Console</span>
              </Link>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Clone Fidelity</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {progress.fidelity_status}
                </span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{progress.overall_percentage}%</div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500"
                  style={{ width: `${progress.overall_percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-500 mt-2 block">Weighted neural synthesis</span>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Personality</span>
                <span className="text-xs text-zinc-400">{personalityCount} items</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{progress.personality_percentage}%</div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500"
                  style={{ width: `${progress.personality_percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-500 mt-2 block">Target: 8+ interview traits</span>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Voice Samples</span>
                <span className="text-xs text-zinc-400">{voiceCount} files ({voiceDuration}s)</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{progress.voice_percentage}%</div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500"
                  style={{ width: `${progress.voice_percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-500 mt-2 block">Target: 4+ audio samples</span>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Knowledge & Socials</span>
                <span className="text-xs text-zinc-400">{socialCount} links</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{progress.knowledge_percentage}%</div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500"
                  style={{ width: `${progress.knowledge_percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-500 mt-2 block">Target: 4+ connected sources</span>
            </div>
          </div>

          {/* Core Modules Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">Training & Control Modules</h2>
              <Link
                href="/dashboard/voice-chat"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
              >
                <span>Voice Priority Mode</span>
                <span>&rarr;</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* LiveKit Voice Priority */}
              <Link
                href="/dashboard/voice-chat"
                className="border border-zinc-700 bg-zinc-950 p-5 rounded-xl hover:border-zinc-500 transition-all group flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-semibold">
                    Voice 1st
                  </span>
                </div>
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">LiveKit Voice Twin</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Voice-first real-time audio animations &amp; transcript stream.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-300 group-hover:text-white font-medium">
                  <span>Start Voice Call</span>
                  <span>&rarr;</span>
                </div>
              </Link>

              {/* Export & Embed Widget */}
              <Link
                href="/dashboard/export"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Export &amp; Embed</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Download standalone ZIP or embed clone onto your portfolio.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>Export Package</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* Playwright Profile Tour */}
              <Link
                href="/dashboard/profile-tour"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Playwright Tour</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Auto-navigate LinkedIn, GitHub, &amp; explain experience in voice.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>Dynamic Code</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* Training */}
              <Link
                href="/dashboard/training"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Personality</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Train habits, humor, and communication styles.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>{personalityCount} Q&amp;As</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* Voice */}
              <Link
                href="/dashboard/voice"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Voice Studio</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Upload voice files and calibrate pitch and pacing.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>{voiceCount} samples</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* Socials & API Keys */}
              <Link
                href="/dashboard/social"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Profiles &amp; Bio</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Connect social profiles and generate synthesized bio.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>{socialCount} links</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* Recruiter Agent & Voice Voicemails */}
              <Link
                href="/dashboard/recruiter"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Recruiter &amp; Voicemails</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Screen inbound recruiters, communicate salary, and listen to recorded voice notes.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>{leadsCount} leads, {voicemailCount} audio</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* GitHub Knowledge Ingestion */}
              <Link
                href="/dashboard/knowledge"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Knowledge Ingestion</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Ingest GitHub repositories, code modules, and documents into clone memory.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>{repoCount} repos synced</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* Interactive Architecture Whiteboard */}
              <Link
                href="/dashboard/whiteboard"
                className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">Architecture Whiteboard</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Interactive system component graphs with real-time layer and node inspection.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-white">
                  <span>Interactive Diagrams</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>

              {/* API Keys */}
              <Link
                href="/dashboard/api-key"
                className="border border-zinc-800 bg-zinc-950/60 p-6 rounded-xl hover:border-zinc-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">AI Provider Engine</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Configure Google Gemini or xAI Grok API credentials for live LLM inference.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-zinc-400 group-hover:text-white">
                  <span>Provider settings</span>
                  <span>Open &rarr;</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Persona Snapshot Card */}
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                  Clone Persona Snapshot
                </span>
                <h3 className="font-semibold text-white mt-0.5">Emerging Persona Signal</h3>
              </div>
              <Link
                href="/dashboard/chat"
                className="text-xs font-medium text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
              >
                Test in Chat
              </Link>
            </div>

            {latestTrait ? (
              <div className="border-l-2 border-white pl-4 py-1 space-y-1">
                <p className="text-xs text-zinc-400 font-mono">Q: {latestTrait.question}</p>
                <p className="text-sm text-zinc-200 italic">&ldquo;{latestTrait.answer}&rdquo;</p>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 py-3">
                No personality traits entered yet. Visit the Personality Playground to initialize your first trait.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Schema Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-semibold text-white">PostgreSQL Database Schema</h3>
                <p className="text-xs text-zinc-400">
                  Run this in your Supabase SQL Editor to enable cloud synchronization.
                </p>
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs font-mono text-zinc-300 max-h-72 overflow-y-auto">
{`-- Saruto AI PostgreSQL Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'grok')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS personality_training (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS clone_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_percentage INTEGER DEFAULT 0,
  voice_percentage INTEGER DEFAULT 0,
  knowledge_percentage INTEGER DEFAULT 0,
  overall_percentage INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS voice_samples (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS social_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, platform)
);

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);`}
            </pre>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={copySqlSchema}
                className="bg-white text-black font-semibold text-xs px-4 py-2 rounded hover:bg-zinc-200 transition-colors"
              >
                {copiedSchema ? 'Copied to Clipboard' : 'Copy SQL Schema'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture
      </footer>
    </div>
  )
}
