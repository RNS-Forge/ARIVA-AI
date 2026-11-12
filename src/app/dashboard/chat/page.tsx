'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CloneStore,
  ChatMessage,
  UserSettings,
  SocialLink,
  PersonalityQuestion,
  ArchitectureDiagram,
} from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LiveKitVoiceRoom } from '@/components/livekit-voice-room'
import { PlaywrightService, PlaywrightTourResult } from '@/lib/playwright-service'
import { PlaywrightProfileViewer } from '@/components/playwright-profile-viewer'
import { ArchitectureWhiteboard } from '@/components/architecture-whiteboard'

const SUGGESTED_QUESTIONS = [
  'Who are you and what do you stand for?',
  'Explain our system architecture with the interactive whiteboard',
  'Walk me through your LinkedIn experience using Playwright',
  'Show me your GitHub projects and open source work',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [showPersonaPrompt, setShowPersonaPrompt] = useState(false)
  const [personaPromptText, setPersonaPromptText] = useState('')
  const [chatMode, setChatMode] = useState<'interview' | 'mirror'>('interview')
  const [errorNotice, setErrorNotice] = useState('')
  const [showVoiceMode, setShowVoiceMode] = useState(false)
  const [socials, setSocials] = useState<SocialLink[]>([])
  const [personality, setPersonality] = useState<PersonalityQuestion[]>([])
  const [activeTour, setActiveTour] = useState<PlaywrightTourResult | null>(null)
  const [activeArchitecture, setActiveArchitecture] = useState<ArchitectureDiagram | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    initChat()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initChat = async () => {
    try {
      let user = await CloneStore.getCurrentUser()
      if (!user && CloneStore.isLoginDisabled()) {
        user = await CloneStore.loginAsGuest('creator@saruto.local')
      }
      if (!user) {
        router.push('/login')
        return
      }

      const [st, history, sLinks, pData, prompt] = await Promise.all([
        CloneStore.getSettings().catch(() => null),
        CloneStore.getChatHistory().catch(() => []),
        CloneStore.getSocialLinks().catch(() => []),
        CloneStore.getPersonality().catch(() => []),
        CloneStore.generateClonePersonaPrompt().catch(() => ''),
      ])

      setSettings(st)
      setMessages(history)
      setSocials(sLinks)
      setPersonality(pData)
      setPersonaPromptText(prompt)
    } catch (err) {
      console.error('Error initializing chat:', err)
    }
  }

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    const textToSend = (customText || input).trim()
    if (!textToSend || sending) return

    setSending(true)
    setErrorNotice('')
    setInput('')

    try {
      // 1. Add user message
      const userMsg = await CloneStore.addChatMessage('user', textToSend)
      setMessages((prev) => [...prev, userMsg])

      // 2. Check if user asked about system architecture whiteboard
      const archMatch = await CloneStore.detectArchitectureIntent(textToSend)
      if (archMatch) {
        setActiveArchitecture(archMatch)
        const narration = `Opening the interactive architecture whiteboard for ${archMatch.title}. You can click individual system nodes to inspect latency, protocols, and implementation components.`
        const assistantMsg = await CloneStore.addChatMessage('assistant', narration)
        setMessages((prev) => [...prev, assistantMsg])
        handleSpeak(assistantMsg.id, narration)
        setSending(false)
        return
      }

      // 3. Check if user asked about social profiles / experience / projects
      const user = await CloneStore.getCurrentUser()
      const userName = user?.email ? user.email.split('@')[0] : 'The Creator'

      const tourCheck = await PlaywrightService.processQueryForProfileTour(
        textToSend,
        socials,
        personality,
        userName
      )

      let aiReply = ''
      if (tourCheck.isProfileQuery && tourCheck.playwrightCode) {
        // Trigger Playwright walkthrough
        setActiveTour(tourCheck)
        aiReply = tourCheck.narrationText || 'Navigating through your profile with Playwright.'
      } else {
        // Normal conversation without Playwright generation
        aiReply = await CloneStore.askAiProvider(textToSend, messages, settings)
      }

      // 4. Add assistant message
      const assistantMsg = await CloneStore.addChatMessage('assistant', aiReply)
      setMessages((prev) => [...prev, assistantMsg])

      // Auto-speak if tour was triggered
      if (tourCheck.isProfileQuery && tourCheck.narrationText) {
        handleSpeak(assistantMsg.id, tourCheck.narrationText)
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Error communicating with AI engine')
    } finally {
      setSending(false)
    }
  }

  const handleSpeak = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (speakingId === messageId) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setSpeakingId(messageId)
    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)
    window.speechSynthesis.speak(utterance)
  }

  const handleClearHistory = async () => {
    if (!confirm('Clear all conversation history with your clone?')) return
    await CloneStore.clearChatHistory()
    setMessages([])
  }

  const handleExportChat = () => {
    const text = messages
      .map((m) => `[${m.role.toUpperCase()} - ${new Date(m.created_at).toLocaleTimeString()}]\n${m.content}\n`)
      .join('\n---\n\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `saruto-clone-chat-${Date.now()}.txt`
    a.click()
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight">
              Saruto AI
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-900 text-zinc-400">
              {settings?.api_key ? `${settings.provider.toUpperCase()} LLM` : 'Twin Simulator'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVoiceMode(!showVoiceMode)}
              className="text-xs bg-white text-black font-semibold px-3 py-1.5 rounded hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{showVoiceMode ? 'Text Mode' : 'LiveKit Voice UI'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPersonaPrompt(true)}
              className="text-xs text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1.5 rounded transition-colors hidden sm:inline"
            >
              Persona Prompt
            </button>
            <button
              type="button"
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="text-xs text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1.5 rounded transition-colors disabled:opacity-40"
            >
              Export Chat
            </button>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={messages.length === 0}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              Clear
            </button>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white transition-colors ml-2"
            >
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container: Voice Priority or Text View */}
      {showVoiceMode ? (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col">
          <div className="flex-1 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 flex flex-col shadow-2xl">
            <LiveKitVoiceRoom onClose={() => setShowVoiceMode(false)} />
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-6 flex flex-col justify-between">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {/* Active Playwright Tour Viewport if query triggered */}
          {activeTour && activeTour.isProfileQuery && (
            <PlaywrightProfileViewer
              tourResult={activeTour}
              onClose={() => setActiveTour(null)}
              onNarrationPlay={(t) => handleSpeak('active-tour-step', t)}
            />
          )}

          {/* Active Architecture Whiteboard Viewport if query triggered */}
          {activeArchitecture && (
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 p-4">
              <ArchitectureWhiteboard
                initialDiagram={activeArchitecture}
                onClose={() => setActiveArchitecture(null)}
              />
            </div>
          )}

          {messages.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-2xl text-center space-y-6 my-auto mt-12">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                  Autonomous Mirror
                </span>
                <h2 className="text-2xl font-bold">Interact with Your Clone</h2>
                <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                  Your clone speaks strictly from the personality traits and principles trained in your workspace.
                </p>
              </div>

              <div className="space-y-2 text-left max-w-md mx-auto">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium block">
                  Test Prompts
                </span>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(undefined, q)}
                      className="text-xs text-left px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                    {msg.role === 'user' ? 'You' : 'AI Clone'}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-white text-black font-medium'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className="hover:text-zinc-300 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                        </svg>
                        <span>{speakingId === msg.id ? 'Stop Voice' : 'Play Voice'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="hover:text-zinc-300 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {sending && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                AI Clone
              </span>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-xs text-zinc-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></div>
                <span>Synthesizing response through neural personality...</span>
              </div>
            </div>
          )}

          {errorNotice && (
            <div className="bg-red-950/40 border border-red-900/60 text-red-300 p-3 rounded-lg text-xs font-mono">
              {errorNotice}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-zinc-800">
          <form onSubmit={(e) => handleSend(e)} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              placeholder="Ask your clone a question, or test its response..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-white text-black font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-40"
            >
              Send
            </button>
          </form>
          <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-2 px-1">
            <span>Powered by Saruto AI Autonomous Twin Engine</span>
            <span>Zero emojis enforced</span>
          </div>
        </div>
      </main>
      )}

      {/* Persona Prompt Modal */}
      {showPersonaPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-semibold text-white">Synthesized Persona System Prompt</h3>
                <p className="text-xs text-zinc-400">
                  This exact context is fed to the AI model on every inference call.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonaPrompt(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs font-mono text-zinc-300 max-h-80 overflow-y-auto whitespace-pre-wrap">
              {personaPromptText}
            </pre>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(personaPromptText)
                  alert('Persona system prompt copied.')
                }}
                className="bg-white text-black font-semibold text-xs px-4 py-2 rounded hover:bg-zinc-200 transition-colors"
              >
                Copy Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-900 px-6 py-3 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture
      </footer>
    </div>
  )
}
