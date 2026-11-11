'use client'

import { useState, useEffect } from 'react'
import { CloneStore, CloneUser, PersonalityQuestion, SocialLink, UserSettings } from '@/lib/clone-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import JSZip from 'jszip'

export default function ExportPage() {
  const [user, setUser] = useState<CloneUser | null>(null)
  const [personality, setPersonality] = useState<PersonalityQuestion[]>([])
  const [socials, setSocials] = useState<SocialLink[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [cloneName, setCloneName] = useState('My AI Twin')
  const [greeting, setGreeting] = useState('Hello. I am the digital AI clone. Ask me anything about my experience, principles, or projects.')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [voiceAutoplay, setVoiceAutoplay] = useState(true)
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'react' | 'iframe' | 'webflow'>('html')
  const [copiedCode, setCopiedCode] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewTestInput, setPreviewTestInput] = useState('')
  const [previewMessages, setPreviewMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'clone', content: 'Hello. I am the digital AI clone. Ask me anything about my experience, principles, or projects.' }
  ])
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

    const name = currentUser.email.split('@')[0]
    setCloneName(`${name}'s Clone`)
    setGreeting(`Hello! I am the digital AI twin of ${name}. Ask me anything about my background, work, or opinions.`)
    setPreviewMessages([{
      role: 'clone',
      content: `Hello! I am the digital AI twin of ${name}. Ask me anything about my background, work, or opinions.`
    }])

    const p = await CloneStore.getPersonality()
    setPersonality(p)

    const s = await CloneStore.getSocialLinks()
    setSocials(s)

    const st = await CloneStore.getSettings()
    setSettings(st)

    setLoading(false)
  }

  const generateConfigJson = async () => {
    const prompt = await CloneStore.generateClonePersonaPrompt()
    const recruiterSettings = await CloneStore.getRecruiterSettings()
    return JSON.stringify(
      {
        cloneName,
        creatorEmail: user?.email,
        exportedAt: new Date().toISOString(),
        greeting,
        position,
        voiceAutoplay,
        systemPrompt: prompt,
        personalityTraits: personality,
        socialProfiles: socials,
        voiceAcoustics: {
          pitch: 1.0,
          rate: 1.0,
          provider: settings?.voice_cloning?.provider || settings?.provider || 'local-twin',
        },
        recruiterScreening: {
          targetRoles: recruiterSettings.target_roles,
          workPreference: recruiterSettings.work_preference,
          minCompensation: recruiterSettings.min_compensation,
          availability: recruiterSettings.availability,
        },
      },
      null,
      2
    )
  }

  const getEmbedCode = () => {
    if (activeCodeTab === 'html') {
      return `<!-- Saruto AI Autonomous Clone Widget -->
<!-- Paste this code before the closing </body> tag of your portfolio HTML -->
<script
  src="https://cdn.jsdelivr.net/gh/your-repo/saruto-widget.js"
  data-saruto-clone="true"
  data-clone-name="${cloneName}"
  data-position="${position}"
  data-voice-autoplay="${voiceAutoplay}"
  data-greeting="${greeting}"
></script>`
    }

    if (activeCodeTab === 'react') {
      return `// Saruto AI Clone Widget Component for React / Next.js
import { useEffect } from 'react';

export function SarutoCloneWidget() {
  useEffect(() => {
    // Dynamically inject Saruto widget
    const script = document.createElement('script');
    script.src = '/saruto-widget.js'; // Place saruto-widget.js in your public/ folder
    script.setAttribute('data-saruto-clone', 'true');
    script.setAttribute('data-clone-name', '${cloneName}');
    script.setAttribute('data-position', '${position}');
    script.setAttribute('data-voice-autoplay', '${voiceAutoplay}');
    script.setAttribute('data-greeting', '${greeting}');
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById('saruto-clone-root');
      if (existing) existing.remove();
    };
  }, []);

  return null;
}`
    }

    if (activeCodeTab === 'iframe') {
      return `<!-- Saruto AI Responsive Iframe Embed -->
<iframe
  src="https://saruto.ai/embed/${user?.id || 'demo'}"
  width="100%"
  height="600"
  style="border: 1px solid #27272a; border-radius: 16px; background: #000000;"
  allow="microphone; speaker"
></iframe>`
    }

    return `<!-- Webflow / WordPress / Squarespace Custom Code -->
<!-- In your site dashboard, go to Custom Code -> Footer Code and paste: -->
<script
  src="/saruto-widget.js"
  data-saruto-clone="true"
  data-clone-name="${cloneName}"
  data-position="${position}"
  data-voice-autoplay="${voiceAutoplay}"
></script>`
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode())
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleDownloadZip = async () => {
    setDownloadingZip(true)
    try {
      const zip = new JSZip()
      const configJson = await generateConfigJson()

      // 1. Fetch saruto-widget.js from public
      let widgetJs = ''
      try {
        const res = await fetch('/saruto-widget.js')
        widgetJs = await res.text()
      } catch {
        widgetJs = '// Saruto Widget Code'
      }

      // 2. Build index.html demo portfolio
      const demoPortfolioHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cloneName} - Personal Portfolio & AI Twin</title>
  <style>
    body {
      margin: 0;
      background: #000000;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 24px;
    }
    .badge {
      font-family: monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border: 1px solid #27272a;
      background: #09090b;
      padding: 4px 10px;
      border-radius: 9999px;
      color: #a1a1aa;
    }
    h1 {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 20px 0 16px 0;
    }
    p.lead {
      font-size: 20px;
      color: #a1a1aa;
      margin-bottom: 40px;
    }
    .card {
      border: 1px solid #27272a;
      background: #09090b;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .card h3 {
      margin-top: 0;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Creator Portfolio</span>
    <h1>${cloneName}</h1>
    <p class="lead">Welcome to my portfolio. An interactive AI clone of myself is embedded on this page. Click the button in the bottom right corner to speak with it.</p>

    <div class="card">
      <h3>About Me & Background</h3>
      <p style="color:#a1a1aa; font-size:14px;">This portfolio demonstrates the standalone Saruto AI autonomous clone running in any browser environment without external dependencies.</p>
    </div>

    <div class="card">
      <h3>Featured Engineering Principles</h3>
      <p style="color:#a1a1aa; font-size:14px;">Trained on authentic communication patterns, values, and decision-making frameworks.</p>
    </div>
  </div>

  <!-- Saruto AI Embedded Clone -->
  <script src="./saruto-widget.js"
    data-saruto-clone="true"
    data-clone-name="${cloneName}"
    data-position="${position}"
    data-voice-autoplay="${voiceAutoplay}"
    data-greeting="${greeting}"
  ></script>
</body>
</html>`

      // 3. Documentation README
      const readmeMd = `# ${cloneName} - Standalone Embed Package

This bundle contains your exported Saruto AI personal clone, fully prepared for deployment to any external website, portfolio, or hosting provider.

## Package Contents

1. **index.html**: A complete, responsive developer portfolio demonstrating your embedded clone in action.
2. **saruto-widget.js**: The zero-dependency, self-contained JavaScript widget.
3. **clone-config.json**: Your complete exported persona configuration, traits, social profiles, and voice synthesis rules.
4. **README.md**: Complete step-by-step instructions.

## Quick Start (30 Seconds)

Simply open \`index.html\` in any web browser to test your clone locally.

## Embedding in an Existing Website

### Option 1: Vanilla HTML / Static Site
1. Copy \`saruto-widget.js\` into your website directory.
2. Add this snippet before your closing \`</body>\` tag:
\`\`\`html
<script
  src="./saruto-widget.js"
  data-saruto-clone="true"
  data-clone-name="${cloneName}"
  data-position="${position}"
  data-greeting="${greeting}"
></script>
\`\`\`

### Option 2: React / Next.js
Place \`saruto-widget.js\` in your \`public/\` directory and load via:
\`\`\`jsx
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script src="/saruto-widget.js" strategy="lazyOnload" />
    </>
  );
}
\`\`\`

### Option 3: Webflow / WordPress / Squarespace
In your site settings under Custom Code (Footer Code):
\`\`\`html
<script src="https://your-domain.com/saruto-widget.js"></script>
\`\`\`

## Voice Synthesis & Features

- The widget uses the browser's native Web Speech API for voice speech playback.
- Strictly adheres to the zero-emoji monochrome blank theme.
`

      // Add to ZIP
      zip.file('index.html', demoPortfolioHtml)
      zip.file('saruto-widget.js', widgetJs)
      zip.file('clone-config.json', configJson)
      zip.file('README.md', readmeMd)

      // Generate and download
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `saruto-clone-${cloneName.toLowerCase().replace(/\s+/g, '-')}-bundle.zip`
      a.click()
    } catch {
      alert('Failed to generate ZIP package')
    } finally {
      setDownloadingZip(false)
    }
  }

  const handlePreviewSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!previewTestInput.trim()) return

    const userText = previewTestInput.trim()
    setPreviewTestInput('')
    setPreviewMessages((prev) => [...prev, { role: 'user', content: userText }])

    setTimeout(() => {
      let reply = `Speaking as ${cloneName}: I value high-leverage execution, clear communication, and solid architectures. You asked about: "${userText}".`
      setPreviewMessages((prev) => [...prev, { role: 'clone', content: reply }])

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(reply)
        window.speechSynthesis.speak(u)
      }
    }, 400)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-mono">Loading Export Engine...</span>
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
              <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                Saruto AI
              </Link>
              <span className="text-xs px-2 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-900 text-zinc-400">
                Export &amp; Embed Studio
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard/voice-chat" className="text-xs text-white border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-500 transition-colors">
                Voice Studio &rarr;
              </Link>
              <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
                &larr; Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                Portability &amp; External Embedding
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
                Export Your Personal Clone
              </h1>
              <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
                Download your trained AI twin or embed it with a single line of code into your personal portfolio, blog, or resume site.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="bg-white text-black font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{downloadingZip ? 'Packaging ZIP...' : 'Download Standalone Package (ZIP)'}</span>
            </button>
          </div>

          {/* Configurator & Live Preview Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Customization Settings */}
            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-2xl space-y-5">
              <h2 className="text-base font-semibold">1. Configure Widget Appearance</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Clone Display Name
                  </label>
                  <input
                    type="text"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                    Greeting Prompt
                  </label>
                  <textarea
                    rows={2}
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                      Screen Position
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                    >
                      <option value="bottom-right">Bottom Right Corner</option>
                      <option value="bottom-left">Bottom Left Corner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2">
                      Voice Playback
                    </label>
                    <select
                      value={voiceAutoplay ? 'true' : 'false'}
                      onChange={(e) => setVoiceAutoplay(e.target.value === 'true')}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                    >
                      <option value="true">Audio Enabled</option>
                      <option value="false">Muted by Default</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Embed Code Snippet Generator */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Embed Snippet</h3>
                  <button
                    type="button"
                    onClick={copyEmbedCode}
                    className="text-xs bg-white text-black font-semibold px-3 py-1.5 rounded hover:bg-zinc-200 transition-colors"
                  >
                    {copiedCode ? 'Copied' : 'Copy Code'}
                  </button>
                </div>

                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  {(['html', 'react', 'iframe', 'webflow'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveCodeTab(tab)}
                      className={`text-xs px-2.5 py-1 rounded capitalize transition-colors ${
                        activeCodeTab === tab
                          ? 'bg-zinc-800 text-white font-semibold'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <pre className="bg-black border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                  {getEmbedCode()}
                </pre>
              </div>
            </div>

            {/* Right: Live Interactive Sandbox Preview */}
            <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-zinc-500">
                    Live Sandbox Preview
                  </span>
                  <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    Interactive Portfolio Mockup
                  </span>
                </div>
                <h3 className="text-base font-semibold">Test Your Widget Behavior</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  This simulated container shows how the widget responds to visitors on your portfolio.
                </p>
              </div>

              {/* Simulated Portfolio Browser Window */}
              <div className="border border-zinc-800 bg-black rounded-xl p-5 flex-1 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                    <span className="text-[11px] font-mono text-zinc-500">https://yourportfolio.com</span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Portfolio Hero</span>
                    <h4 className="text-lg font-bold text-white">Full-Stack Engineer &amp; Architect</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Building scalable systems. Talk to my autonomous AI clone below for inquiries.
                    </p>
                  </div>
                </div>

                {/* Simulated Widget Box */}
                <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4 shadow-xl mt-4 flex flex-col justify-between max-h-56">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                      <span className="text-xs font-bold text-white">{cloneName}</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500">READY</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 max-h-28 pr-1">
                    {previewMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded-lg leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-white text-black font-medium text-right ml-6'
                            : 'bg-zinc-900 text-zinc-200 border border-zinc-800 mr-6'
                        }`}
                      >
                        {m.content}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handlePreviewSend} className="mt-2 pt-2 border-t border-zinc-900 flex gap-2">
                    <input
                      type="text"
                      value={previewTestInput}
                      onChange={(e) => setPreviewTestInput(e.target.value)}
                      placeholder="Ask the preview clone..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded hover:bg-zinc-200"
                    >
                      Test
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Top-to-Bottom Integration Documentation */}
          <div className="border border-zinc-800 bg-zinc-950 p-8 rounded-2xl space-y-8">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 font-semibold">
                Deployment Manual
              </span>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                Top-to-Bottom Integration Guide
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Comprehensive instructions for hosting and running your personal AI clone anywhere.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-l-2 border-zinc-700 pl-4 space-y-2">
                <span className="text-xs font-mono text-zinc-500">STEP 01</span>
                <h4 className="font-semibold text-white">Download or Host Script</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Download the ZIP package and upload <code className="text-zinc-300">saruto-widget.js</code> to your CDN, GitHub Pages, or website assets folder.
                </p>
              </div>

              <div className="border-l-2 border-zinc-500 pl-4 space-y-2">
                <span className="text-xs font-mono text-zinc-500">STEP 02</span>
                <h4 className="font-semibold text-white">Embed Script Tag</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Include the snippet inside your HTML or React layout. Specify your custom clone name, greeting message, and preferred screen position.
                </p>
              </div>

              <div className="border-l-2 border-white pl-4 space-y-2">
                <span className="text-xs font-mono text-zinc-500">STEP 03</span>
                <h4 className="font-semibold text-white">Autonomous Speech</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The widget automatically taps into the visitor browser Web Speech API for voice playback without requiring third-party audio API fees.
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-6 space-y-4">
              <h3 className="text-base font-semibold">Platform-Specific Integration Notes</h3>
              <div className="grid md:grid-cols-2 gap-4 text-xs text-zinc-400">
                <div className="border border-zinc-900 bg-black p-4 rounded-xl space-y-1">
                  <h5 className="font-semibold text-white">GitHub Pages / Static Sites</h5>
                  <p>Commit <code className="text-zinc-300">saruto-widget.js</code> into your repository root and add the script tag to <code className="text-zinc-300">index.html</code>.</p>
                </div>
                <div className="border border-zinc-900 bg-black p-4 rounded-xl space-y-1">
                  <h5 className="font-semibold text-white">Next.js &amp; React</h5>
                  <p>Place the script in <code className="text-zinc-300">public/saruto-widget.js</code> and use <code className="text-zinc-300">next/script</code> with strategy <code className="text-zinc-300">lazyOnload</code>.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture • Export Studio
      </footer>
    </div>
  )
}

