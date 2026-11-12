'use client'

import { useState, useEffect } from 'react'
import { CloneStore, PersonalityQuestion } from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { id: 'identity', label: 'Identity & Story' },
  { id: 'communication', label: 'Communication Style' },
  { id: 'values', label: 'Values & Ethics' },
  { id: 'work', label: 'Work & Skills' },
  { id: 'humor', label: 'Humor & Reactions' },
  { id: 'opinions', label: 'Habits & Opinions' },
]

const CURATED_QUESTIONS = [
  {
    category: 'identity',
    q: 'How would you introduce yourself in three sentences at an informal meetup?',
  },
  {
    category: 'communication',
    q: 'Do you prefer concise, direct answers or detailed explanations with background context?',
  },
  {
    category: 'communication',
    q: 'How do you give constructive criticism without sounding harsh or dismissive?',
  },
  {
    category: 'values',
    q: 'What is a core life or work principle you refuse to compromise on?',
  },
  {
    category: 'work',
    q: 'When faced with an ambiguous engineering problem, what is your step-by-step process?',
  },
  {
    category: 'work',
    q: 'What is your philosophy on deadline pressure versus code perfection?',
  },
  {
    category: 'humor',
    q: 'What is your sense of humor like (dry, sarcastic, playful, witty, deadpan)?',
  },
  {
    category: 'humor',
    q: 'How do you react when a plan completely falls apart at the last minute?',
  },
  {
    category: 'opinions',
    q: 'What is a strong opinion you hold that most people disagree with?',
  },
  {
    category: 'opinions',
    q: 'Are you an early riser or a late-night deep worker, and why?',
  },
]

export default function TrainingPage() {
  const [questions, setQuestions] = useState<PersonalityQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentCategory, setCurrentCategory] = useState('identity')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [statusNotice, setStatusNotice] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      let user = await CloneStore.getCurrentUser()
      if (!user && CloneStore.isLoginDisabled()) {
        user = await CloneStore.loginAsGuest('creator@saruto.local')
      }
      if (!user) {
        router.push('/login')
        return
      }

      const data = await CloneStore.getPersonality()
      setQuestions(data)
    } catch (err) {
      console.error('Error loading personality traits:', err)
    }
  }

  const handlePickCurated = (q: string, cat: string) => {
    setCurrentQuestion(q)
    setCurrentCategory(cat)
  }

  const handleShufflePrompt = () => {
    const random = CURATED_QUESTIONS[Math.floor(Math.random() * CURATED_QUESTIONS.length)]
    setCurrentQuestion(random.q)
    setCurrentCategory(random.category)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentQuestion.trim() || !currentAnswer.trim()) return

    setLoading(true)
    setStatusNotice('')

    try {
      await CloneStore.addPersonalityQuestion(currentQuestion, currentAnswer, currentCategory)
      setCurrentQuestion('')
      setCurrentAnswer('')
      await loadData()
      setStatusNotice('Personality trait saved to clone memory.')
      setTimeout(() => setStatusNotice(''), 3000)
    } catch (err: any) {
      setStatusNotice(err.message || 'Error saving trait')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this question from clone memory?')) return
    await CloneStore.deletePersonalityQuestion(id)
    await loadData()
  }

  const handleExportJson = () => {
    const json = JSON.stringify(questions, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `saruto-personality-${Date.now()}.json`
    a.click()
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.question && item.answer) {
              await CloneStore.addPersonalityQuestion(
                item.question,
                item.answer,
                item.category || 'general'
              )
            }
          }
          await loadData()
          setStatusNotice(`Imported ${parsed.length} traits successfully.`)
        }
      } catch {
        setStatusNotice('Invalid JSON file format.')
      }
    }
    reader.readAsText(file)
  }

  const filteredQuestions =
    filterCategory === 'all'
      ? questions
      : questions.filter((q) => q.category === filterCategory)

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

        <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                Neural Training
              </span>
              <h1 className="text-3xl font-bold tracking-tight mt-1">Personality Playground</h1>
              <p className="text-zinc-400 text-sm mt-1">
                Feed your clone your authentic viewpoints, thought patterns, and conversational tone.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                disabled={questions.length === 0}
                className="text-xs border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 px-3 py-2 rounded transition-colors disabled:opacity-50"
              >
                Export JSON
              </button>
              <label className="text-xs border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 px-3 py-2 rounded transition-colors cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Quick Prompts Suggestion Bar */}
          <div className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Recommended Prompts (Click to Use)
              </span>
              <button
                type="button"
                onClick={handleShufflePrompt}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Shuffle Prompt
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {CURATED_QUESTIONS.slice(0, 4).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePickCurated(item.q, item.category)}
                  className="text-xs text-left px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all"
                >
                  {item.q}
                </button>
              ))}
            </div>
          </div>

          {/* Main Input Form */}
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl space-y-6">
            <h2 className="text-base font-semibold">Add New Personality Trait</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="question" className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Interview Question or Prompt
                  </label>
                  <input
                    id="question"
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="e.g., How do you prioritize tasks during a crisis?"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={currentCategory}
                    onChange={(e) => setCurrentCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="answer" className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                  Your Authentic Answer (How you actually speak and think)
                </label>
                <textarea
                  id="answer"
                  rows={4}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Answer in first person ('I prefer to...', 'My rule is...'). Include your natural tone, vocabulary, and directness."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  required
                />
              </div>

              {statusNotice && (
                <div className="bg-zinc-900 border border-zinc-800 text-zinc-200 p-3 rounded-lg text-xs">
                  {statusNotice}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Embedding...' : 'Store Personality Trait'}
                </button>
              </div>
            </form>
          </div>

          {/* Stored Questions Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold">
                Trained Personality Memory ({filteredQuestions.length} of {questions.length})
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className={`text-xs px-2.5 py-1 rounded transition-colors ${
                    filterCategory === 'all'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterCategory(cat.id)}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      filterCategory === cat.id
                        ? 'bg-white text-black font-semibold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-xl text-center space-y-2">
                <p className="text-sm text-zinc-400">No personality traits found for this view.</p>
                <p className="text-xs text-zinc-600">
                  Select a suggested prompt above or type your own question to begin training your twin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((item) => (
                  <div
                    key={item.id}
                    className="border border-zinc-800 bg-zinc-950 p-5 rounded-xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {item.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        {item.question}
                      </h3>
                      <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        {item.answer}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-600">
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </div>
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
