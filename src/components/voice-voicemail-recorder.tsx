'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CloneStore } from '@/lib/clone-store'

interface VoiceVoicemailRecorderProps {
  onVoicemailSent?: () => void
  onClose?: () => void
}

export function VoiceVoicemailRecorder({
  onVoicemailSent,
  onClose,
}: VoiceVoicemailRecorderProps) {
  const [recordingState, setRecordingState] = useState<
    'idle' | 'recording' | 'recorded' | 'sending' | 'sent'
  >('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    setStatusMessage('')
    audioChunksRef.current = []
    setTranscript('')
    setRecordingTime(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setRecordingState('recorded')
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(250)
      setRecordingState('recording')

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Speech Recognition for live transcript
      if (typeof window !== 'undefined') {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'
          recognition.onresult = (e: any) => {
            let current = ''
            for (let i = 0; i < e.results.length; i++) {
              current += e.results[i][0].transcript
            }
            setTranscript(current)
          }
          recognition.start()
          recognitionRef.current = recognition
        }
      }
    } catch {
      setStatusMessage('Microphone access denied or unavailable.')
      setRecordingState('idle')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleSendVoicemail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitorName.trim()) {
      setStatusMessage('Please enter your name.')
      return
    }

    setRecordingState('sending')
    setStatusMessage('Saving voice inquiry and generating clone response...')

    try {
      const finalTranscript =
        transcript.trim() || 'Spoken inquiry left via Voice Voicemail recorder.'

      // Generate authentic clone response
      const cloneResponse = await CloneStore.simulateCloneResponse(finalTranscript)

      // Send to API
      const res = await fetch('/api/voicemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: visitorName.trim(),
          visitorEmail: visitorEmail.trim(),
          audioDataUrl: audioUrl || '',
          durationSeconds: recordingTime,
          transcript: finalTranscript,
          cloneResponse,
        }),
      })

      const data = await res.json()
      if (res.ok && data.voicemail) {
        await CloneStore.addVoiceVoicemail(data.voicemail)
        setRecordingState('sent')
        setStatusMessage('Your voice inquiry was delivered to the creator.')

        // Play clone confirmation
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(cloneResponse)
          u.rate = 1.0
          window.speechSynthesis.speak(u)
        }

        if (onVoicemailSent) {
          onVoicemailSent()
        }
      } else {
        setStatusMessage(data.error || 'Failed to submit voice inquiry.')
        setRecordingState('recorded')
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error uploading voicemail.')
      setRecordingState('recorded')
    }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
          <h3 className="font-bold text-sm text-white">Async Voice Voicemail</h3>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-white"
          >
            Close
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-2.5 rounded-lg text-xs font-mono">
          {statusMessage}
        </div>
      )}

      {recordingState === 'sent' ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white">Voice Message Sent</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Your voice inquiry has been added to the creator inbox. The clone has acknowledged your
            message.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs bg-white text-black font-semibold px-4 py-1.5 rounded-lg"
            >
              Done
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recording Status View */}
          <div className="border border-zinc-800 bg-black rounded-xl p-6 text-center space-y-3">
            {recordingState === 'recording' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1.5 h-10">
                  <span className="w-1 h-6 bg-white animate-pulse rounded-full"></span>
                  <span className="w-1 h-10 bg-white animate-pulse delay-75 rounded-full"></span>
                  <span className="w-1 h-8 bg-white animate-pulse delay-150 rounded-full"></span>
                  <span className="w-1 h-4 bg-white animate-pulse delay-300 rounded-full"></span>
                </div>
                <div className="text-lg font-mono font-bold text-white">
                  00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                </div>
                <p className="text-xs text-zinc-400">Recording your voice note. Speak clearly.</p>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="bg-white text-black font-semibold text-xs px-5 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            ) : recordingState === 'recorded' ? (
              <div className="space-y-3">
                <div className="text-xs text-zinc-400 font-mono">
                  Recorded Note ({recordingTime}s)
                </div>
                {audioUrl && <audio controls src={audioUrl} className="w-full h-9" />}
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="text-xs border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded text-zinc-400"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-xs text-zinc-400">
                  Leave a spoken question for the creator and hear the clone answer.
                </p>
                <button
                  type="button"
                  onClick={startRecording}
                  className="bg-white text-black font-semibold text-xs px-5 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Start Recording Note
                </button>
              </div>
            )}
          </div>

          {/* Live Transcript Preview */}
          {transcript && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                Speech-to-Text Transcription:
              </span>
              <p className="italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Details Form */}
          {(recordingState === 'recorded' || recordingState === 'sending') && (
            <form onSubmit={handleSendVoicemail} className="space-y-3 border-t border-zinc-900 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="jordan@company.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={recordingState === 'sending'}
                className="w-full bg-white text-black font-semibold text-xs py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {recordingState === 'sending' ? 'Submitting Voice Inquiry...' : 'Submit Voice Voicemail'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
