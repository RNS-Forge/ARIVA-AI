'use client'

import { useState, useEffect } from 'react'
import { CloneStore, SocialLink, KnowledgeSnippet } from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLATFORMS: Array<{ id: SocialLink['platform']; label: string }> = [
  { id: 'github', label: 'GitHub' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'website', label: 'Personal Website / Portfolio' },
  { id: 'other', label: 'Substack / Blog / Other' },
]

export default function SocialPage() {
  const [links, setLinks] = useState<SocialLink[]>([])
  const [snippets, setSnippets] = useState<KnowledgeSnippet[]>([])
  const [platform, setPlatform] = useState<SocialLink['platform']>('github')
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [snippetTitle, setSnippetTitle] = useState('')
  const [snippetContent, setSnippetContent] = useState('')
  const [snippetType, setSnippetType] = useState<KnowledgeSnippet['source_type']>('post')
  const [synthesizedBio, setSynthesizedBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedBio, setCopiedBio] = useState(false)
  const [statusNotice, setStatusNotice] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const user = await CloneStore.getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const sLinks = await CloneStore.getSocialLinks()
    setLinks(sLinks)

    const kSnippets = await CloneStore.getKnowledgeSnippets()
    setSnippets(kSnippets)

    generateBioSummary(sLinks, kSnippets)
  }

  const generateBioSummary = async (sLinks: SocialLink[], kSnippets: KnowledgeSnippet[]) => {
    const user = await CloneStore.getCurrentUser()
    const personality = await CloneStore.getPersonality()
    const name = user?.email ? user.email.split('@')[0] : 'The Creator'

    const traits = personality.slice(0, 3).map((p) => p.answer)
    const connectedList = sLinks.map((s) => s.platform).join(', ')

    let bio = `Digital AI twin of ${name}. `
    if (traits.length > 0) {
      bio += `Trained on core principles: "${traits[0].substring(0, 80)}...". `
    }
    if (connectedList) {
      bio += `Verified across ${connectedList}. `
    }
    if (kSnippets.length > 0) {
      bio += `Synthesized with ${kSnippets.length} custom knowledge articles.`
    }

    setSynthesizedBio(bio)
  }

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setStatusNotice('')

    try {
      await CloneStore.saveSocialLink(platform, url, username)
      setUrl('')
      setUsername('')
      await loadAll()
      setStatusNotice('Public profile connected.')
      setTimeout(() => setStatusNotice(''), 3000)
    } catch (err: any) {
      setStatusNotice(err.message || 'Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSocial = async (id: string) => {
    await CloneStore.deleteSocialLink(id)
    await loadAll()
  }

  const handleSaveSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!snippetTitle.trim() || !snippetContent.trim()) return

    setLoading(true)
    setStatusNotice('')

    try {
      await CloneStore.addKnowledgeSnippet(snippetTitle, snippetContent, snippetType)
      setSnippetTitle('')
      setSnippetContent('')
      await loadAll()
      setStatusNotice('Knowledge snippet embedded into clone memory.')
      setTimeout(() => setStatusNotice(''), 3000)
    } catch (err: any) {
      setStatusNotice(err.message || 'Error saving snippet')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSnippet = async (id: string) => {
    await CloneStore.deleteKnowledgeSnippet(id)
    await loadAll()
  }

  const copyBio = () => {
    navigator.clipboard.writeText(synthesizedBio)
    setCopiedBio(true)
    setTimeout(() => setCopiedBio(false), 2500)
  }

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

        <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              External Context & Knowledge
            </span>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Digital Presence & Knowledge</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Connect external channels, portfolio URLs, and writing samples to inform your clone persona.
            </p>
          </div>

          {/* Synthesized Bio Card */}
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                Autonomous Persona Bio
              </span>
              <button
                type="button"
                onClick={copyBio}
                className="text-xs text-zinc-300 hover:text-white border border-zinc-800 px-3 py-1 rounded transition-colors"
              >
                {copiedBio ? 'Copied' : 'Copy Bio'}
              </button>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-mono bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              {synthesizedBio || 'Connecting more profiles and personality answers will auto-generate your clone bio.'}
            </p>
          </div>

          {statusNotice && (
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-3 rounded-lg text-xs">
              {statusNotice}
            </div>
          )}

          {/* Connect Profile Form */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl space-y-5">
              <h2 className="text-base font-semibold">Connect Public Profile</h2>

              <form onSubmit={handleSaveSocial} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Profile URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Username / Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@handle"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-semibold text-sm py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  Link Social Channel
                </button>
              </form>
            </div>

            {/* Knowledge Vault Form */}
            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl space-y-5">
              <h2 className="text-base font-semibold">Writing Sample / Knowledge Note</h2>

              <form onSubmit={handleSaveSnippet} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Title or Subject
                  </label>
                  <input
                    type="text"
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    placeholder="e.g. My take on System Architecture"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Source Type
                  </label>
                  <select
                    value={snippetType}
                    onChange={(e) => setSnippetType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="post">Social Post / Tweet</option>
                    <option value="article">Blog Post / Essay</option>
                    <option value="bio">Personal Manifesto / Bio</option>
                    <option value="note">Field Note / Thought</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Sample Text
                  </label>
                  <textarea
                    rows={3}
                    value={snippetContent}
                    onChange={(e) => setSnippetContent(e.target.value)}
                    placeholder="Paste an excerpt that shows your vocabulary and phrasing..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-semibold text-sm py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  Save Writing Sample
                </button>
              </form>
            </div>
          </div>

          {/* Stored Links & Snippets */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Social Links List */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Connected Profiles ({links.length})</h2>
              {links.length === 0 ? (
                <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl text-xs text-zinc-500 text-center">
                  No public profiles added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="border border-zinc-800 bg-zinc-950 p-4 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold capitalize text-zinc-200">
                          {link.platform} {link.username && <span className="text-zinc-500">({link.username})</span>}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-400 hover:text-white truncate block max-w-xs mt-0.5"
                        >
                          {link.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSocial(link.id)}
                        className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Knowledge Snippets List */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Stored Writing Snippets ({snippets.length})</h2>
              {snippets.length === 0 ? (
                <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl text-xs text-zinc-500 text-center">
                  No writing samples stored yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {snippets.map((snip) => (
                    <div
                      key={snip.id}
                      className="border border-zinc-800 bg-zinc-950 p-4 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-200">{snip.title}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnippet(snip.id)}
                          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        {snip.content}
                      </p>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 block">
                        Type: {snip.source_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture
      </footer>
    </div>
  )
}
