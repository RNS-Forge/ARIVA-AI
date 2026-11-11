'use client'

import { useState, useEffect } from 'react'
import {
  CloneStore,
  CloneUser,
  IngestedRepository,
  KnowledgeSnippet,
} from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function KnowledgePage() {
  const [user, setUser] = useState<CloneUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'repos' | 'documents' | 'snippets'>('repos')

  // Repositories State
  const [repoUrl, setRepoUrl] = useState('')
  const [ingestingRepo, setIngestingRepo] = useState(false)
  const [repositories, setRepositories] = useState<IngestedRepository[]>([])
  const [repoStatusNotice, setRepoStatusNotice] = useState('')

  // Snippets & Documents State
  const [snippets, setSnippets] = useState<KnowledgeSnippet[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<KnowledgeSnippet['source_type']>('article')
  const [savingSnippet, setSavingSnippet] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  const router = useRouter()

  useEffect(() => {
    initData()
  }, [])

  const initData = async () => {
    const currentUser = await CloneStore.getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    const repoList = await CloneStore.getIngestedRepositories()
    setRepositories(repoList)

    const snippetList = await CloneStore.getKnowledgeSnippets()
    setSnippets(snippetList)

    setLoading(false)
  }

  const handleIngestRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim()) return

    setIngestingRepo(true)
    setRepoStatusNotice('')

    try {
      const response = await fetch('/api/knowledge/ingest-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      })

      const data = await response.json()
      if (response.ok && data.repository) {
        const added = await CloneStore.addIngestedRepository(data.repository)
        setRepositories((prev) => [added, ...prev.filter((r) => r.id !== added.id)])
        setRepoUrl('')
        setRepoStatusNotice(data.message || 'Repository successfully indexed.')
      } else {
        setRepoStatusNotice(data.error || 'Failed to ingest repository.')
      }
    } catch (err: any) {
      setRepoStatusNotice(err.message || 'Network error during ingestion.')
    } finally {
      setIngestingRepo(false)
    }
  }

  const handleDeleteRepo = async (id: string) => {
    await CloneStore.deleteIngestedRepository(id)
    const updated = await CloneStore.getIngestedRepositories()
    setRepositories(updated)
  }

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    setSavingSnippet(true)
    try {
      const created = await CloneStore.addKnowledgeSnippet(newTitle, newContent, newType)
      setSnippets((prev) => [created, ...prev])
      setNewTitle('')
      setNewContent('')
    } catch {
      // Ignore
    } finally {
      setSavingSnippet(false)
    }
  }

  const handleDeleteSnippet = async (id: string) => {
    await CloneStore.deleteKnowledgeSnippet(id)
    const updated = await CloneStore.getKnowledgeSnippets()
    setSnippets(updated)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      if (text) {
        const created = await CloneStore.addKnowledgeSnippet(
          file.name,
          text.slice(0, 5000),
          file.name.endsWith('.md') ? 'article' : 'note'
        )
        setSnippets((prev) => [created, ...prev])
      }
    }
    reader.readAsText(file)
  }

  const filteredSnippets = snippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.content.toLowerCase().includes(searchFilter.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-mono">Loading Knowledge Ingestion Engine...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <div>
        {/* Navbar */}
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                Saruto AI
              </Link>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-900 text-zinc-400">
                Knowledge &amp; Repo Ingestion
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                &larr; Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                Deep Knowledge Grounding
              </span>
              <h1 className="text-3xl font-bold tracking-tight mt-1">
                Repository &amp; Document Ingestion
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Connect public code repositories and technical documents. Your clone references verified
                architecture and code files when explaining your work.
              </p>
            </div>

            <div className="flex items-center border border-zinc-800 bg-zinc-950 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('repos')}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'repos'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Code Repositories</span>
                <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {repositories.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'documents'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Knowledge Articles</span>
                <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {snippets.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: CODE REPOSITORIES */}
          {activeTab === 'repos' && (
            <div className="space-y-6">
              {/* Ingestion Form */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  <h2 className="text-base font-semibold">Connect Public GitHub Repository</h2>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter a GitHub URL. The ingestion engine parses folder structure, module summaries,
                  and documentation into your persona context.
                </p>

                {repoStatusNotice && (
                  <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-3 rounded-lg text-xs font-mono">
                    {repoStatusNotice}
                  </div>
                )}

                <form onSubmit={handleIngestRepo} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={ingestingRepo}
                    className="bg-white text-black font-semibold text-xs px-6 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {ingestingRepo ? 'Ingesting Repository...' : 'Ingest & Index'}
                  </button>
                </form>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
                  <span>Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setRepoUrl('https://github.com/karpathy/micrograd')}
                    className="underline hover:text-zinc-300"
                  >
                    karpathy/micrograd
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setRepoUrl('https://github.com/facebook/react')}
                    className="underline hover:text-zinc-300"
                  >
                    facebook/react
                  </button>
                </div>
              </div>

              {/* Ingested Repos Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Ingested Repositories ({repositories.length})
                </h3>

                {repositories.length === 0 ? (
                  <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-10 text-center space-y-2">
                    <p className="text-sm text-zinc-400">No code repositories ingested yet.</p>
                    <p className="text-xs text-zinc-600">
                      Enter a GitHub link above to ground your clone in real software projects.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {repositories.map((repo) => (
                      <div
                        key={repo.id}
                        className="border border-zinc-800 bg-zinc-950 rounded-xl p-5 space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{repo.repo_name}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {repo.language || 'Codebase'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">{repo.description}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteRepo(repo.id)}
                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Files Index list */}
                        <div className="border-t border-zinc-900 pt-3 space-y-2">
                          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                            Indexed Modules ({repo.files.length} files)
                          </span>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {repo.files.map((file, idx) => (
                              <div
                                key={idx}
                                className="bg-black border border-zinc-900 rounded p-2 text-xs flex items-center justify-between"
                              >
                                <span className="font-mono text-zinc-300">{file.path}</span>
                                <span className="text-[11px] text-zinc-500">{file.summary}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-500 font-mono">
                          <span>{repo.stars} Stars</span>
                          <a
                            href={repo.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white underline"
                          >
                            View on GitHub &rarr;
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS & SNIPPETS */}
          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Creator Form */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 space-y-4 h-fit">
                <h2 className="text-base font-semibold">Add Knowledge Document</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload text files or paste engineering decisions, papers, and system design notes.
                </p>

                {/* Upload Button */}
                <label className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-black rounded-xl p-4 text-center cursor-pointer block transition-colors">
                  <span className="text-xs text-zinc-400 block font-medium">Upload Markdown or Code File</span>
                  <span className="text-[11px] text-zinc-600 block mt-1">.md, .ts, .py, .json, .txt</span>
                  <input
                    type="file"
                    accept=".md,.txt,.ts,.py,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="text-center text-xs text-zinc-600 font-mono">— OR TYPE MANUALLY —</div>

                <form onSubmit={handleAddSnippet} className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Document Title</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Microservices Database Sharding Strategy"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Category</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as KnowledgeSnippet['source_type'])}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="article">Technical Article</option>
                      <option value="note">Design Note</option>
                      <option value="post">Blog / Post</option>
                      <option value="bio">Personal Biography</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Content &amp; Notes</label>
                    <textarea
                      rows={5}
                      required
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Write or paste your technical explanations, architectural choices, and key learnings..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingSnippet}
                    className="w-full bg-white text-black font-semibold text-xs py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {savingSnippet ? 'Saving Article...' : 'Add Knowledge Article'}
                  </button>
                </form>
              </div>

              {/* Articles Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Vault Articles ({filteredSnippets.length})
                  </h3>

                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search knowledge..."
                    className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none w-48"
                  />
                </div>

                {filteredSnippets.length === 0 ? (
                  <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-8 text-center text-xs text-zinc-500">
                    No articles match your filter. Add an article using the form on the left.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSnippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className="border border-zinc-800 bg-zinc-950 rounded-xl p-5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-white">{snippet.title}</h4>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {snippet.source_type}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSnippet(snippet.id)}
                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-black border border-zinc-900 p-3 rounded-lg">
                          {snippet.content}
                        </p>

                        <div className="text-[11px] text-zinc-600 font-mono">
                          Indexed on {new Date(snippet.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture • Knowledge Grounding Layer
      </footer>
    </div>
  )
}

