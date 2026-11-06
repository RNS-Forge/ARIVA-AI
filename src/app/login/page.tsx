'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CloneStore } from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfoMessage('')

    if (!email || !password) {
      setError('Please provide both email and password.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.session) {
          router.push('/dashboard')
        } else {
          setInfoMessage(
            'Confirmation email sent. You can also click "Instant Guest Access" below to enter immediately.'
          )
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          // If login fails, check if guest account exists with this email or offer direct access
          throw error
        }

        if (data.session) {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed'
      if (msg.includes('Invalid login credentials')) {
        setError('Invalid credentials. If this is your first time, switch to Sign Up or use Instant Guest Access.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setGuestLoading(true)
    setError('')
    try {
      await CloneStore.loginAsGuest(email || 'creator@saruto.local')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Could not start guest session')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Saruto AI
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="inline-block text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-2">
              Authentication
            </span>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isSignUp ? 'Create Your Account' : 'Welcome to Saruto AI'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isSignUp
                ? 'Register to initialize your personal clone profile'
                : 'Sign in to access your digital clone and neural training'}
            </p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-8 shadow-2xl">
            <div className="flex border-b border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setError('')
                  setInfoMessage('')
                }}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  !isSignUp
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setError('')
                  setInfoMessage('')
                }}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isSignUp
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-950/40 border border-red-900/60 text-red-300 px-4 py-3 rounded-lg text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {infoMessage && (
                <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 px-4 py-3 rounded-lg text-xs leading-relaxed">
                  {infoMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold text-sm py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {loading
                  ? 'Processing...'
                  : isSignUp
                  ? 'Create Clone Account'
                  : 'Sign In to Workspace'}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <span className="relative bg-zinc-950 px-3 text-xs text-zinc-500 uppercase tracking-wider">
                Or Quick Test
              </span>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="w-full border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-white font-medium text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Instant Guest Mode (Zero Setup)</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture
      </footer>
    </div>
  )
}
