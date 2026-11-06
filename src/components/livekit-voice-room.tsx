'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  LiveKitVoiceVisualizer,
  VoiceAnimationType,
} from './livekit-voice-visualizer'
import { CloneStore, ChatMessage, UserSettings, SocialLink, PersonalityQuestion } from '@/lib/clone-store'
import { PlaywrightService, PlaywrightTourResult } from '@/lib/playwright-service'
import { PlaywrightProfileViewer } from './playwright-profile-viewer'

interface LiveKitVoiceRoomProps {
  onClose?: () => void
  initialAnimation?: VoiceAnimationType
}

export function LiveKitVoiceRoom({
  onClose,
  initialAnimation = 'bars',
}: LiveKitVoiceRoomProps) {
  const [animationType, setAnimationType] = useState<VoiceAnimationType>(initialAnimation)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0.0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [transcript, setTranscript] = useState('')
  const [statusMessage, setStatusMessage] = useState('Initializing LiveKit voice session...')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [socials, setSocials] = useState<SocialLink[]>([])
  const [personality, setPersonality] = useState<PersonalityQuestion[]>([])
  const [activeTour, setActiveTour] = useState<PlaywrightTourResult | null>(null)

  // Audio & Stream refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initVoiceSession()

    return () => {
      cleanupAudio()
    }
  }, [])

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, transcript])

  const initVoiceSession = async () => {
    try {
      const user = await CloneStore.getCurrentUser()
      const st = await CloneStore.getSettings()
      setSettings(st)

      const history = await CloneStore.getChatHistory()
      setMessages(history)

      const sLinks = await CloneStore.getSocialLinks()
      setSocials(sLinks)

      const pData = await CloneStore.getPersonality()
      setPersonality(pData)

      // Fetch LiveKit token
      const res = await fetch(
        `/api/livekit/token?room=clone-session&username=${user?.id || 'guest'}`
      )
      const data = await res.json()

      // Initialize local microphone & audio context
      await setupMicrophone()

      setConnectionState('connected')
      setStatusMessage('Voice channel active. Speak naturally to your clone.')
      startSpeechRecognition()
    } catch (err: any) {
      setStatusMessage('Connected in local acoustic fallback mode.')
      setConnectionState('connected')
      await setupMicrophone()
      startSpeechRecognition()
    }
  }

  const setupMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass()
        audioContextRef.current = audioCtx

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        analyserRef.current = analyser

        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        monitorAudioLevels()
      }
    } catch {
      setStatusMessage('Microphone access unavailable. You can use text input.')
    }
  }

  const monitorAudioLevels = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const update = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        const normalized = Math.min(1, avg / 128)

        setAudioLevel((prev) => {
          // Smooth the transitions
          return prev * 0.7 + normalized * 0.3
        })

        if (normalized > 0.15 && voiceState !== 'speaking' && voiceState !== 'thinking') {
          setVoiceState('listening')
        } else if (normalized <= 0.05 && voiceState === 'listening') {
          setVoiceState('idle')
        }
      }
      animFrameRef.current = requestAnimationFrame(update)
    }

    update()
  }

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        setTranscript(currentTranscript)

        if (event.results[event.results.length - 1].isFinal) {
          const finalPrompt = currentTranscript.trim()
          if (finalPrompt.length > 2) {
            handleUserVoiceQuery(finalPrompt)
            setTranscript('')
          }
        }
      }

      recognition.onerror = () => {
        // restart silently if needed
      }

      recognition.onend = () => {
        if (connectionState === 'connected' && !isMuted) {
          try {
            recognition.start()
          } catch {
            // Ignore
          }
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch {
      // Speech recognition not supported
    }
  }

  const handleUserVoiceQuery = async (userText: string) => {
    if (!userText.trim()) return

    setVoiceState('thinking')
    setStatusMessage('Synthesizing persona response...')

    // 1. Add user message
    const userMsg = await CloneStore.addChatMessage('user', userText)
    setMessages((prev) => [...prev, userMsg])

    try {
      // 2. Check if user asked about social profiles / experience / projects
      const user = await CloneStore.getCurrentUser()
      const userName = user?.email ? user.email.split('@')[0] : 'The Creator'

      const tourCheck = await PlaywrightService.processQueryForProfileTour(
        userText,
        socials,
        personality,
        userName
      )

      let reply = ''
      if (tourCheck.isProfileQuery && tourCheck.playwrightCode) {
        // Trigger Playwright walkthrough
        setActiveTour(tourCheck)
        reply = tourCheck.narrationText || 'Navigating through your profile with Playwright.'
      } else {
        // Normal voice interaction
        reply = await CloneStore.askAiProvider(userText, messages, settings)
      }

      // 3. Add assistant message
      const assistantMsg = await CloneStore.addChatMessage('assistant', reply)
      setMessages((prev) => [...prev, assistantMsg])
      setSelectedMessageId(assistantMsg.id)

      // 4. Speak response aloud with synchronized animation
      speakCloneResponse(reply, assistantMsg.id)
    } catch (err: any) {
      setStatusMessage(err.message || 'Error processing response')
      setVoiceState('idle')
    }
  }

  const speakCloneResponse = (text: string, msgId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setVoiceState('idle')
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => {
      setVoiceState('speaking')
      setStatusMessage('Clone is speaking...')
      if (msgId) setSelectedMessageId(msgId)
      simulateSpeakingAudioWaves()
    }

    utterance.onend = () => {
      setVoiceState('idle')
      setStatusMessage('Listening for your voice...')
    }

    utterance.onerror = () => {
      setVoiceState('idle')
      setStatusMessage('Ready for next query.')
    }

    window.speechSynthesis.speak(utterance)
  }

  const simulateSpeakingAudioWaves = () => {
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        setAudioLevel(0.4 + Math.random() * 0.5)
      } else {
        clearInterval(interval)
        setAudioLevel(0)
      }
    }, 100)
  }

  const toggleMute = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)

      if (!isMuted && recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      } else if (isMuted && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {}
      }
    }
  }

  const handleSelectMessage = (msg: ChatMessage) => {
    setSelectedMessageId(msg.id)
    if (msg.role === 'assistant') {
      speakCloneResponse(msg.content, msg.id)
    } else {
      handleUserVoiceQuery(msg.content)
    }
  }

  const cleanupAudio = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return
    handleUserVoiceQuery(textInput)
    setTextInput('')
  }

  return (
    <div className="flex flex-col h-full bg-black text-white relative overflow-hidden">
      {/* Top Header Controls */}
      <div className="border-b border-zinc-800 bg-zinc-950/90 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                connectionState === 'connected' ? 'bg-white animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-sm font-bold tracking-tight">LiveKit Voice Twin</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
            {voiceState.toUpperCase()}
          </span>
        </div>

        {/* Animation Picker Dropdown / Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Animation:</span>
          <div className="flex items-center border border-zinc-800 bg-zinc-900 rounded-lg p-0.5 text-xs">
            {(['bars', 'radial', 'waveform', 'neural-orb'] as VoiceAnimationType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAnimationType(type)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  animationType === type
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {type.replace('-', ' ')}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded transition-colors ml-2"
            >
              Exit Voice
            </button>
          )}
        </div>
      </div>

      {/* Main Center Stage: Priority Voice UI Visualizer */}
      <div className="relative flex-shrink-0 py-8 px-6 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-950/80 to-black z-10 flex flex-col items-center justify-center min-h-[260px]">
        {/* Real-time Status Badge */}
        <div className="mb-4 text-center space-y-1">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
            {statusMessage}
          </span>
          {transcript && (
            <div className="text-sm text-zinc-200 font-mono italic max-w-lg mx-auto bg-zinc-900/90 border border-zinc-800 px-4 py-1.5 rounded-full">
              &ldquo;{transcript}&rdquo;
            </div>
          )}
        </div>

        {/* Selected LiveKit Animation Visualizer */}
        <div className="my-2 flex items-center justify-center w-full">
          <LiveKitVoiceVisualizer
            animationType={animationType}
            state={voiceState}
            audioLevel={audioLevel}
          />
        </div>

        {/* Live Audio Control Bar */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              isMuted
                ? 'bg-red-950/60 border-red-900 text-red-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
            <span>{isMuted ? 'Microphone Muted' : 'Microphone Live'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (messages.length > 0) {
                const last = [...messages].reverse().find((m) => m.role === 'assistant')
                if (last) speakCloneResponse(last.content, last.id)
              } else {
                speakCloneResponse('I am your personal AI clone ready for conversation.')
              }
            }}
            className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            <span>Replay Voice</span>
          </button>
        </div>
      </div>

      {/* Background Text Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Active Playwright Tour Viewport if voice query triggered */}
        {activeTour && activeTour.isProfileQuery && (
          <PlaywrightProfileViewer
            tourResult={activeTour}
            onClose={() => setActiveTour(null)}
            onNarrationPlay={(t) => speakCloneResponse(t)}
          />
        )}

        <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Background Transcript Stream (Click any entry to speak)
          </span>
          <span className="text-[11px] text-zinc-600">
            {messages.length} exchanges recorded
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-xs">
            Start speaking. Your voice query and clone responses will stream live here.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => handleSelectMessage(msg)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedMessageId === msg.id
                  ? 'border-white bg-zinc-900'
                  : 'border-zinc-900 bg-zinc-950/60 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {msg.role === 'user' ? 'You (Voice Ingest)' : 'AI Clone (Synthetic Voice)'}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          ))
        )}

        <div ref={conversationEndRef} />
      </div>

      {/* Manual Input Bar */}
      <div className="border-t border-zinc-900 bg-zinc-950/90 px-6 py-3.5 z-20">
        <form onSubmit={handleManualSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ask with text or speak directly into microphone..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || voiceState === 'thinking'}
            className="bg-white text-black font-semibold text-xs px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40"
          >
            Voice Ask
          </button>
        </form>
      </div>
    </div>
  )
}

