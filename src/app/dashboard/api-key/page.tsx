'use client'

import { useState, useEffect } from 'react'
import { CloneStore, UserSettings } from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ApiKeyPage() {
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState<'gemini' | 'grok'>('gemini')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [savedSettings, setSavedSettings] = useState<UserSettings | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [statusNotice, setStatusNotice] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const user = await CloneStore.getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const settings = await CloneStore.getSettings()
    if (settings) {
      setSavedSettings(settings)
      setProvider(settings.provider)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    setLoading(true)
    setStatusNotice('')
    setTestResult(null)

    try {
      await CloneStore.saveSettings(apiKey, provider)
      await loadSettings()
      setApiKey('')
      setStatusNotice('API credentials saved successfully.')
    } catch (err: any) {
      setStatusNotice(err.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim() || savedSettings?.api_key
    if (!keyToTest) {
      setTestResult({ success: false, message: 'Please enter or save an API key first.' })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      if (provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToTest}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          }
        )
        const data = await res.json()
        if (res.ok && data.candidates) {
          setTestResult({ success: true, message: 'Google Gemini connection verified successfully.' })
        } else {
          setTestResult({
            success: false,
            message: data.error?.message || 'Invalid Gemini API key or quota exceeded.',
          })
        }
      } else {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keyToTest}`,
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
        })
        const data = await res.json()
        if (res.ok && data.choices) {
          setTestResult({ success: true, message: 'xAI Grok connection verified successfully.' })
        } else {
          setTestResult({
            success: false,
            message: data.error?.message || 'Invalid Grok API key.',
          })
        }
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error while contacting AI provider' })
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove the stored API credentials?')) return
    await CloneStore.deleteSettings()
    setSavedSettings(null)
    setStatusNotice('API credentials removed. Built-in persona simulator is now active.')
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '********'
    return key.substring(0, 4) + '...' + key.substring(key.length - 4)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <div>
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight">
              Saruto AI
            </Link>
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
              &larr; Back to Dashboard
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              Inference Engine
            </span>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Configure AI Provider</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Connect your Gemini or Grok API key to power live conversational cloning.
              If no key is configured, Saruto AI automatically uses its built-in personality simulator.
            </p>
          </div>

          {/* Active Status Card */}
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Current Engine Status
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono ${
                  savedSettings?.api_key
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                {savedSettings?.api_key ? 'External LLM Active' : 'Built-in Twin Simulator'}
              </span>
            </div>

            {savedSettings?.api_key ? (
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-sm font-semibold capitalize text-white">
                    {savedSettings.provider} Inference
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    Key: {maskKey(savedSettings.api_key)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testing}
                    className="text-xs border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-950 px-3 py-1.5 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-400 pt-1 leading-relaxed">
                No external API key added yet. The clone will synthesize responses directly using your trained Q&amp;A personality bank.
              </div>
            )}

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs font-mono mt-3 ${
                  testResult.success
                    ? 'bg-zinc-900 border border-zinc-700 text-zinc-200'
                    : 'bg-red-950/40 border border-red-900/60 text-red-300'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl">
            <h2 className="text-base font-semibold mb-4">Update API Credentials</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                  Select Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider('gemini')}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all text-left ${
                      provider === 'gemini'
                        ? 'border-white bg-zinc-900 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-white">Google Gemini</div>
                    <div className="text-[11px] text-zinc-500">Gemini 1.5 Flash (Recommended)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('grok')}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all text-left ${
                      provider === 'grok'
                        ? 'border-white bg-zinc-900 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-white">xAI Grok</div>
                    <div className="text-[11px] text-zinc-500">Grok-Beta inference</div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="apiKey" className="block text-xs uppercase tracking-wider text-zinc-400">
                    {provider === 'gemini' ? 'Gemini API Key' : 'xAI API Key'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === 'gemini'
                      ? 'AIzaSy...'
                      : 'xai-...'
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
                  required
                />
              </div>

              {statusNotice && (
                <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-3 rounded-lg text-xs">
                  {statusNotice}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-white text-black font-semibold text-sm py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save API Credentials'}
                </button>
                {apiKey.trim() && (
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testing}
                    className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white text-sm px-5 py-3 rounded-lg transition-colors"
                  >
                    {testing ? 'Testing...' : 'Test First'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture
      </footer>
    </div>
  )
}
