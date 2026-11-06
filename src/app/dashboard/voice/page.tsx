'use client'

import { useState, useEffect, useRef } from 'react'
import { CloneStore, VoiceSample } from '@/lib/clone-store'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VoicePage() {
  const [samples, setSamples] = useState<VoiceSample[]>([])
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [statusNotice, setStatusNotice] = useState('')
  const [testSpeechText, setTestSpeechText] = useState('Hello. I am your autonomous AI clone speaking back to you.')
  const [speechPitch, setSpeechPitch] = useState(1.0)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [speaking, setSpeaking] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const router = useRouter()

  useEffect(() => {
    loadVoiceSamples()
  }, [])

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setRecordingTime(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recording])

  const loadVoiceSamples = async () => {
    const user = await CloneStore.getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const data = await CloneStore.getVoiceSamples()
    setSamples(data)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setStatusNotice('')

    try {
      const user = await CloneStore.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const reader = new FileReader()
      reader.onload = async (event) => {
        const audioUrl = event.target?.result as string
        const audio = new Audio(audioUrl)

        audio.onloadedmetadata = async () => {
          const duration = Math.round(audio.duration) || 5
          const storagePath = `local-voice/${Date.now()}_${file.name}`

          // Try uploading to Supabase Storage if user is not guest
          if (!user.isGuest) {
            try {
              await supabase.storage
                .from('voice-samples')
                .upload(`${user.id}/${Date.now()}_${file.name}`, file)
            } catch {
              // Local fallback preserved
            }
          }

          await CloneStore.addVoiceSample(storagePath, duration, audioUrl, file.name)
          await loadVoiceSamples()
          setStatusNotice(`Uploaded voice sample "${file.name}" (${duration}s).`)
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setStatusNotice(err.message || 'Error processing audio file')
      setUploading(false)
    }
  }

  const startRecording = async () => {
    try {
      setStatusNotice('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = recordingTime || 4
        const user = await CloneStore.getCurrentUser()
        if (!user) return

        const reader = new FileReader()
        reader.onloadend = async () => {
          const audioUrl = reader.result as string
          const sampleName = `Recording ${new Date().toLocaleTimeString()}`
          const storagePath = `recordings/${user.id}_${Date.now()}.webm`

          // Attempt remote upload if not guest
          if (!user.isGuest) {
            try {
              await supabase.storage.from('voice-samples').upload(storagePath, blob)
            } catch {
              // fallback
            }
          }

          await CloneStore.addVoiceSample(storagePath, duration, audioUrl, sampleName)
          await loadVoiceSamples()
          setStatusNotice(`Saved voice recording (${duration}s).`)
        }
        reader.readAsDataURL(blob)

        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      setStatusNotice('Microphone access denied or audio input device not detected.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      mediaRecorderRef.current = null
    }
  }

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm('Delete this voice sample?')) return
    await CloneStore.deleteVoiceSample(id, storagePath)
    await loadVoiceSamples()
  }

  const handleTestSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setStatusNotice('Web Speech API is not supported in this browser environment.')
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(testSpeechText)
    utterance.pitch = speechPitch
    utterance.rate = speechRate

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const totalDuration = samples.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <div>
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight">
              Saruto AI
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chat" className="text-xs text-white border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-500 transition-colors">
                Test in Chat &rarr;
              </Link>
              <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
                &larr; Back to Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              Acoustic Cloning
            </span>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Voice Studio</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Capture your vocal characteristics, cadence, and speech tone to power your clone audio synthesis.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Recorded Samples</span>
              <div className="text-2xl font-bold mt-1">{samples.length}</div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Recommended: 4+ samples</span>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Total Audio Capture</span>
              <div className="text-2xl font-bold mt-1">{totalDuration}s</div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Recommended: 60s+</span>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Vocal Fidelity</span>
              <div className="text-2xl font-bold mt-1">
                {Math.min(100, Math.round((samples.length / 4) * 100))}%
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">Acoustic profile status</span>
            </div>
          </div>

          {/* Audio Input Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Record Box */}
            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Direct Microphone Recording</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Record short phrases directly. Speak naturally in your standard speaking pace.
                </p>
              </div>

              {recording && (
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-sm font-mono text-white">
                      Recording: {formatSeconds(recordingTime)}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">Audio input live</span>
                </div>
              )}

              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={uploading}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  recording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-white hover:bg-zinc-200 text-black'
                }`}
              >
                {recording ? 'Stop & Save Recording' : 'Start Audio Recording'}
              </button>
            </div>

            {/* Upload Box */}
            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-base font-semibold mb-1">Upload Voice File</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload audio clips (MP3, WAV, WebM, M4A). Podcasts or voice memos work best.
                </p>
              </div>

              <div>
                <label className="block w-full border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg p-6 text-center cursor-pointer transition-colors">
                  <span className="text-xs text-zinc-300 block font-medium">
                    {uploading ? 'Processing audio...' : 'Click to select audio file'}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-1 block">MP3, WAV, WEBM up to 25MB</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={uploading || recording}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {statusNotice && (
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-3 rounded-lg text-xs">
              {statusNotice}
            </div>
          )}

          {/* Voice Speech Synthesis Test */}
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Speech Synthesizer Simulator</h2>
                <p className="text-xs text-zinc-400">
                  Calibrate the speech synthesizer to match your pitch and pacing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestSpeech}
                disabled={speaking}
                className="bg-white text-black font-semibold text-xs px-4 py-2 rounded hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {speaking ? 'Speaking...' : 'Play Synthetic Voice'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Vocal Pitch</span>
                  <span>{speechPitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Speaking Rate</span>
                  <span>{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>
            </div>

            <input
              type="text"
              value={testSpeechText}
              onChange={(e) => setTestSpeechText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              placeholder="Type phrase to test clone voice..."
            />
          </div>

          {/* Stored Samples */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Stored Voice Samples ({samples.length})</h2>

            {samples.length === 0 ? (
              <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-xl text-center space-y-2">
                <p className="text-sm text-zinc-400">No vocal samples in database.</p>
                <p className="text-xs text-zinc-600">
                  Record a voice sample above to initialize acoustic replication.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200">
                          {sample.name || 'Voice Note'}
                        </h3>
                        <span className="text-[11px] text-zinc-500">
                          {sample.duration_seconds}s • {new Date(sample.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(sample.id, sample.storage_path)}
                        className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    {sample.audio_url ? (
                      <audio controls src={sample.audio_url} className="w-full h-9" />
                    ) : (
                      <div className="text-xs text-zinc-500">Audio sample stored in cloud</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture
      </footer>
    </div>
  )
}
