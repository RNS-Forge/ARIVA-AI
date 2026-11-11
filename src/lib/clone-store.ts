import { supabase } from './supabase'

export interface CloneUser {
  id: string
  email: string
  isGuest?: boolean
}

export interface VoiceCloningConfig {
  provider: 'browser' | 'elevenlabs'
  elevenlabs_api_key?: string
  elevenlabs_voice_id?: string
  stability?: number
  similarity_boost?: number
}

export interface UserSettings {
  api_key: string
  provider: 'gemini' | 'grok'
  voice_cloning?: VoiceCloningConfig
  updated_at?: string
}

export interface RecruiterSettings {
  target_roles: string[]
  work_preference: 'Remote' | 'Hybrid' | 'On-site' | 'Flexible'
  min_compensation: string
  availability: string
  preferred_stack: string
  deal_breakers: string
  auto_respond: boolean
  updated_at?: string
}

export interface RecruiterLead {
  id: string
  user_id?: string
  recruiter_name: string
  company: string
  email: string
  role_title: string
  compensation_offered: string
  fit_score: number
  status: 'new' | 'contacted' | 'archived'
  notes: string
  transcript: Array<{ role: 'recruiter' | 'assistant'; content: string }>
  created_at: string
}

export interface IngestedFile {
  path: string
  language?: string
  summary: string
  contentSnippet?: string
}

export interface IngestedRepository {
  id: string
  user_id?: string
  repo_url: string
  repo_name: string
  description?: string
  stars?: number
  language?: string
  file_count: number
  files: IngestedFile[]
  created_at: string
}

export interface VoiceVoicemail {
  id: string
  user_id?: string
  visitor_name: string
  visitor_email?: string
  audio_url?: string
  duration_seconds: number
  transcript: string
  clone_response: string
  status: 'new' | 'listened' | 'archived'
  created_at: string
}

export interface ArchitectureNode {
  id: string
  label: string
  tier: 'client' | 'gateway' | 'service' | 'database' | 'queue' | 'ai'
  description: string
  tech: string
}

export interface ArchitectureEdge {
  from: string
  to: string
  protocol: string
}

export interface ArchitectureDiagram {
  id: string
  title: string
  category: string
  description: string
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
}

export interface PersonalityQuestion {
  id: string
  user_id?: string
  question: string
  answer: string
  category: string
  created_at: string
}

export interface VoiceSample {
  id: string
  user_id?: string
  storage_path: string
  audio_url?: string
  duration_seconds: number
  created_at: string
  name?: string
}

export interface SocialLink {
  id: string
  user_id?: string
  platform: 'linkedin' | 'twitter' | 'github' | 'instagram' | 'youtube' | 'website' | 'other'
  url: string
  username?: string | null
  created_at: string
}

export interface KnowledgeSnippet {
  id: string
  user_id?: string
  title: string
  content: string
  source_type: 'post' | 'bio' | 'article' | 'note'
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id?: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface CloneProgress {
  personality_percentage: number
  voice_percentage: number
  knowledge_percentage: number
  overall_percentage: number
  fidelity_status: string
}

const STORAGE_KEYS = {
  GUEST_USER: 'saruto_guest_user',
  SETTINGS: 'saruto_user_settings',
  PERSONALITY: 'saruto_personality_training',
  VOICE: 'saruto_voice_samples',
  SOCIAL: 'saruto_social_links',
  KNOWLEDGE: 'saruto_knowledge_snippets',
  CHAT: 'saruto_chat_history',
  RECRUITER_SETTINGS: 'saruto_recruiter_settings',
  RECRUITER_LEADS: 'saruto_recruiter_leads',
  INGESTED_REPOS: 'saruto_ingested_repos',
  VOICE_VOICEMAILS: 'saruto_voice_voicemails',
  ARCHITECTURE_DIAGRAMS: 'saruto_architecture_diagrams',
}

const isBrowser = typeof window !== 'undefined'

function getLocalData<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

function setLocalData<T>(key: string, value: T): void {
  if (!isBrowser) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore local storage quota errors
  }
}

export const CloneStore = {
  isLoginDisabled(): boolean {
    const envVal = process.env.NEXT_PUBLIC_LOGIN ?? process.env.LOGIN
    if (envVal !== undefined && envVal !== null) {
      const normalized = String(envVal).trim().toLowerCase()
      if (
        normalized === 'false' ||
        normalized === '0' ||
        normalized === 'disabled' ||
        normalized === 'off' ||
        normalized === 'no'
      ) {
        return true
      }
      if (
        normalized === 'true' ||
        normalized === '1' ||
        normalized === 'enabled' ||
        normalized === 'on' ||
        normalized === 'yes'
      ) {
        return false
      }
    }
    return false
  },

  async getCurrentUser(): Promise<CloneUser | null> {
    if (this.isLoginDisabled()) {
      const existing = getLocalData<CloneUser | null>(STORAGE_KEYS.GUEST_USER, null)
      if (existing) return existing

      const defaultUser: CloneUser = {
        id: 'creator_workspace',
        email: 'creator@saruto.local',
        isGuest: true,
      }
      setLocalData(STORAGE_KEYS.GUEST_USER, defaultUser)
      return defaultUser
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        return {
          id: user.id,
          email: user.email,
          isGuest: false,
        }
      }
    } catch {
      // Continue to check local guest
    }

    const guest = getLocalData<CloneUser | null>(STORAGE_KEYS.GUEST_USER, null)
    return guest
  },

  async loginAsGuest(customEmail?: string): Promise<CloneUser> {
    const user: CloneUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 10),
      email: customEmail?.trim() || 'me@saruto.local',
      isGuest: true,
    }
    setLocalData(STORAGE_KEYS.GUEST_USER, user)
    return user
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore
    }
    if (isBrowser) {
      localStorage.removeItem(STORAGE_KEYS.GUEST_USER)
    }
  },

  async getSettings(): Promise<UserSettings | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('api_key, provider, updated_at')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          return data as UserSettings
        }
      } catch {
        // Fall back to local
      }
    }

    return getLocalData<UserSettings | null>(STORAGE_KEYS.SETTINGS, null)
  },

  async saveSettings(apiKey: string, provider: 'gemini' | 'grok'): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const newSettings: UserSettings = {
      api_key: apiKey.trim(),
      provider,
      updated_at: new Date().toISOString(),
    }

    setLocalData(STORAGE_KEYS.SETTINGS, newSettings)

    if (!user.isGuest) {
      try {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          api_key: newSettings.api_key,
          provider: newSettings.provider,
          updated_at: newSettings.updated_at,
        })
      } catch {
        // Fall back to local
      }
    }
  },

  async deleteSettings(): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) return

    if (isBrowser) {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS)
    }

    if (!user.isGuest) {
      try {
        await supabase.from('user_settings').delete().eq('user_id', user.id)
      } catch {
        // Ignore
      }
    }
  },

  async getPersonality(): Promise<PersonalityQuestion[]> {
    const user = await this.getCurrentUser()
    if (!user) return []

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('personality_training')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as PersonalityQuestion[]
        }
      } catch {
        // Fall back to local
      }
    }

    return getLocalData<PersonalityQuestion[]>(STORAGE_KEYS.PERSONALITY, [])
  },

  async addPersonalityQuestion(
    question: string,
    answer: string,
    category: string
  ): Promise<PersonalityQuestion> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const item: PersonalityQuestion = {
      id: 'pq_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: user.id,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || 'general',
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<PersonalityQuestion[]>(STORAGE_KEYS.PERSONALITY, [])
    const updated = [item, ...current.filter((q) => q.question !== item.question)]
    setLocalData(STORAGE_KEYS.PERSONALITY, updated)

    if (!user.isGuest) {
      try {
        await supabase.from('personality_training').insert({
          user_id: user.id,
          question: item.question,
          answer: item.answer,
          category: item.category,
        })
      } catch {
        // Table not ready or network issue; local data preserved
      }
    }

    await this.calculateProgress()
    return item
  },

  async deletePersonalityQuestion(id: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) return

    const current = getLocalData<PersonalityQuestion[]>(STORAGE_KEYS.PERSONALITY, [])
    const filtered = current.filter((item) => item.id !== id)
    setLocalData(STORAGE_KEYS.PERSONALITY, filtered)

    if (!user.isGuest) {
      try {
        await supabase.from('personality_training').delete().eq('id', id)
      } catch {
        // Ignore
      }
    }

    await this.calculateProgress()
  },

  async getVoiceSamples(): Promise<VoiceSample[]> {
    const user = await this.getCurrentUser()
    if (!user) return []

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('voice_samples')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as VoiceSample[]
        }
      } catch {
        // Fall back to local
      }
    }

    return getLocalData<VoiceSample[]>(STORAGE_KEYS.VOICE, [])
  },

  async addVoiceSample(
    storagePath: string,
    durationSeconds: number,
    audioUrl?: string,
    name?: string
  ): Promise<VoiceSample> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const sample: VoiceSample = {
      id: 'vs_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: user.id,
      storage_path: storagePath,
      audio_url: audioUrl,
      duration_seconds: durationSeconds,
      name: name || 'Voice Note',
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<VoiceSample[]>(STORAGE_KEYS.VOICE, [])
    const updated = [sample, ...current]
    setLocalData(STORAGE_KEYS.VOICE, updated)

    if (!user.isGuest) {
      try {
        await supabase.from('voice_samples').insert({
          user_id: user.id,
          storage_path: storagePath,
          duration_seconds: durationSeconds,
        })
      } catch {
        // Saved locally
      }
    }

    await this.calculateProgress()
    return sample
  },

  async deleteVoiceSample(id: string, storagePath?: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) return

    const current = getLocalData<VoiceSample[]>(STORAGE_KEYS.VOICE, [])
    const filtered = current.filter((item) => item.id !== id)
    setLocalData(STORAGE_KEYS.VOICE, filtered)

    if (!user.isGuest && storagePath) {
      try {
        await supabase.storage.from('voice-samples').remove([storagePath])
        await supabase.from('voice_samples').delete().eq('id', id)
      } catch {
        // Ignore
      }
    }

    await this.calculateProgress()
  },

  async getSocialLinks(): Promise<SocialLink[]> {
    const user = await this.getCurrentUser()
    if (!user) return []

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('social_links')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as SocialLink[]
        }
      } catch {
        // Fall back to local
      }
    }

    return getLocalData<SocialLink[]>(STORAGE_KEYS.SOCIAL, [])
  },

  async saveSocialLink(
    platform: SocialLink['platform'],
    url: string,
    username?: string
  ): Promise<SocialLink> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const link: SocialLink = {
      id: 'sl_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: user.id,
      platform,
      url: url.trim(),
      username: username ? username.trim() : null,
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<SocialLink[]>(STORAGE_KEYS.SOCIAL, [])
    const updated = [link, ...current.filter((item) => item.platform !== platform)]
    setLocalData(STORAGE_KEYS.SOCIAL, updated)

    if (!user.isGuest) {
      try {
        await supabase.from('social_links').upsert({
          user_id: user.id,
          platform,
          url: link.url,
          username: link.username,
        })
      } catch {
        // Saved locally
      }
    }

    await this.calculateProgress()
    return link
  },

  async deleteSocialLink(id: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) return

    const current = getLocalData<SocialLink[]>(STORAGE_KEYS.SOCIAL, [])
    const filtered = current.filter((item) => item.id !== id)
    setLocalData(STORAGE_KEYS.SOCIAL, filtered)

    if (!user.isGuest) {
      try {
        await supabase.from('social_links').delete().eq('id', id)
      } catch {
        // Ignore
      }
    }

    await this.calculateProgress()
  },

  async getKnowledgeSnippets(): Promise<KnowledgeSnippet[]> {
    return getLocalData<KnowledgeSnippet[]>(STORAGE_KEYS.KNOWLEDGE, [])
  },

  async addKnowledgeSnippet(
    title: string,
    content: string,
    source_type: KnowledgeSnippet['source_type']
  ): Promise<KnowledgeSnippet> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const snippet: KnowledgeSnippet = {
      id: 'ks_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      source_type,
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<KnowledgeSnippet[]>(STORAGE_KEYS.KNOWLEDGE, [])
    const updated = [snippet, ...current]
    setLocalData(STORAGE_KEYS.KNOWLEDGE, updated)

    await this.calculateProgress()
    return snippet
  },

  async deleteKnowledgeSnippet(id: string): Promise<void> {
    const current = getLocalData<KnowledgeSnippet[]>(STORAGE_KEYS.KNOWLEDGE, [])
    const filtered = current.filter((item) => item.id !== id)
    setLocalData(STORAGE_KEYS.KNOWLEDGE, filtered)
    await this.calculateProgress()
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const user = await this.getCurrentUser()
    if (!user) return []

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as ChatMessage[]
        }
      } catch {
        // Fall back to local
      }
    }

    return getLocalData<ChatMessage[]>(STORAGE_KEYS.CHAT, [])
  },

  async addChatMessage(role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const msg: ChatMessage = {
      id: 'cm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: user.id,
      role,
      content,
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<ChatMessage[]>(STORAGE_KEYS.CHAT, [])
    const updated = [...current, msg]
    setLocalData(STORAGE_KEYS.CHAT, updated)

    if (!user.isGuest) {
      try {
        await supabase.from('chat_history').insert({
          user_id: user.id,
          role,
          content,
        })
      } catch {
        // Fallback saved locally
      }
    }

    return msg
  },

  async clearChatHistory(): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) return

    setLocalData(STORAGE_KEYS.CHAT, [])

    if (!user.isGuest) {
      try {
        await supabase.from('chat_history').delete().eq('user_id', user.id)
      } catch {
        // Ignore
      }
    }
  },

  async calculateProgress(): Promise<CloneProgress> {
    const personality = await this.getPersonality()
    const voice = await this.getVoiceSamples()
    const social = await this.getSocialLinks()
    const knowledge = await this.getKnowledgeSnippets()

    // Personality: 8 questions = 100%
    const personalityPct = Math.min(100, Math.round((personality.length / 8) * 100))

    // Voice: 4 samples = 100%
    const voicePct = Math.min(100, Math.round((voice.length / 4) * 100))

    // Knowledge & Social: 4 items (socials + snippets) = 100%
    const totalKnowledge = social.length + knowledge.length
    const knowledgePct = Math.min(100, Math.round((totalKnowledge / 4) * 100))

    // Overall weighted calculation
    const overallPct = Math.round(personalityPct * 0.45 + voicePct * 0.35 + knowledgePct * 0.2)

    let fidelityStatus = 'Nascent Stage'
    if (overallPct >= 85) {
      fidelityStatus = 'High Fidelity Twin'
    } else if (overallPct >= 60) {
      fidelityStatus = 'Proficient Clone'
    } else if (overallPct >= 30) {
      fidelityStatus = 'Developing Clone'
    }

    const progress: CloneProgress = {
      personality_percentage: personalityPct,
      voice_percentage: voicePct,
      knowledge_percentage: knowledgePct,
      overall_percentage: overallPct,
      fidelity_status: fidelityStatus,
    }

    const user = await this.getCurrentUser()
    if (user && !user.isGuest) {
      try {
        await supabase.from('clone_progress').upsert({
          user_id: user.id,
          personality_percentage: personalityPct,
          voice_percentage: voicePct,
          knowledge_percentage: knowledgePct,
          overall_percentage: overallPct,
          updated_at: new Date().toISOString(),
        })
      } catch {
        // Table not ready; local calculation preserved
      }
    }

    return progress
  },

  async generateClonePersonaPrompt(): Promise<string> {
    const user = await this.getCurrentUser()
    const personality = await this.getPersonality()
    const socials = await this.getSocialLinks()
    const knowledge = await this.getKnowledgeSnippets()

    const identityEmail = user?.email || 'me@saruto.local'
    const username = identityEmail.split('@')[0]

    const personalitySection = personality.length
      ? personality
          .map((item) => `[Category: ${item.category}]\nQuestion: ${item.question}\nAnswer: ${item.answer}`)
          .join('\n\n')
      : 'No explicit personality interview answers provided yet.'

    const socialSection = socials.length
      ? socials
          .map((item) => `${item.platform.toUpperCase()}: ${item.url}${item.username ? ` (@${item.username})` : ''}`)
          .join('\n')
      : 'No public profiles connected.'

    const knowledgeSection = knowledge.length
      ? knowledge.map((item) => `### ${item.title} (${item.source_type})\n${item.content}`).join('\n\n')
      : 'No extra knowledge articles added.'

    const repos = await this.getIngestedRepositories()
    const repoSection = repos.length
      ? repos
          .map(
            (r) =>
              `### Codebase Repository: ${r.repo_name} (${r.language || 'Software'})\nURL: ${r.repo_url}\nDescription: ${r.description || 'Verified repository'}\nKey Files and Modules:\n${r.files.map((f) => `- ${f.path}: ${f.summary}`).join('\n')}`
          )
          .join('\n\n')
      : 'No connected code repositories.'

    return `You are the digital AI clone of the user "${username}".
You must speak, reason, and react strictly in first-person ("I", "my", "me") as this individual.
Do NOT speak like an AI assistant or say "As an AI language model". You ARE the user.

=== CORE PERSONALITY & INTERVIEW DATA ===
${personalitySection}

=== SOCIAL PROFILES & CREDENTIALS ===
${socialSection}

=== KNOWLEDGE VAULT & WRITING SAMPLES ===
${knowledgeSection}

=== INGESTED CODE REPOSITORIES & ARCHITECTURES ===
${repoSection}

RULES:
1. Speak in the exact tone, vocabulary, and conciseness demonstrated in the answers above.
2. If asked something not in the personality data, infer an answer consistent with your core values and principles.
3. Be authentic, human, and direct.
4. Strictly do not use any emojis in your response.`
  },

  async simulateCloneResponse(userMessage: string): Promise<string> {
    const personality = await this.getPersonality()
    const lower = userMessage.toLowerCase()

    // 1. Exact or keyword match from user's personality questionnaire
    for (const item of personality) {
      const qLower = item.question.toLowerCase()
      const words = lower.split(/\s+/).filter((w) => w.length > 3)
      const matched = words.filter((w) => qLower.includes(w))
      if (matched.length >= 2 || (words.length === 1 && qLower.includes(words[0]))) {
        return `Based on how I think about that: ${item.answer}`
      }
    }

    // 2. Query type heuristics
    if (lower.includes('who are you') || lower.includes('tell me about yourself') || lower.includes('introduce')) {
      const bioItem = personality.find((p) => p.category === 'identity' || p.question.toLowerCase().includes('who are you'))
      if (bioItem) {
        return bioItem.answer
      }
      return 'I am your personal AI clone on Saruto AI. I have been trained on your communication style, principles, and preferences so that I can represent you accurately.'
    }

    if (lower.includes('value') || lower.includes('belief') || lower.includes('principle')) {
      const valItem = personality.find((p) => p.category === 'values' || p.question.toLowerCase().includes('value'))
      if (valItem) {
        return `My core principles are clear: ${valItem.answer}`
      }
    }

    if (lower.includes('work') || lower.includes('skill') || lower.includes('project')) {
      const workItem = personality.find((p) => p.category === 'work' || p.question.toLowerCase().includes('work'))
      if (workItem) {
        return `Regarding my work and approach: ${workItem.answer}`
      }
    }

    if (personality.length > 0) {
      const sample = personality[Math.floor(Math.random() * personality.length)]
      return `Speaking authentically as your digital clone: ${sample.answer}`
    }

    return 'I am ready to mirror your exact personality and responses. Please add more Q&A pairs in the Training Playground so I can speak with higher fidelity.'
  },

  async askAiProvider(
    userMessage: string,
    history: ChatMessage[],
    settings: UserSettings | null
  ): Promise<string> {
    const systemPrompt = await this.generateClonePersonaPrompt()

    if (!settings || !settings.api_key) {
      // Use built-in simulated twin engine when no API key configured
      return await this.simulateCloneResponse(userMessage)
    }

    if (settings.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.api_key}`
      
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nAcknowledge your identity as this clone.` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am now acting strictly as this person without emojis.' }],
        },
        ...history.slice(-6).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ]

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errMsg = errorData.error?.message || response.statusText
        throw new Error(`Gemini API Error: ${errMsg}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      return text || 'I could not generate a response from the Gemini model.'
    }

    if (settings.provider === 'grok') {
      const url = 'https://api.x.ai/v1/chat/completions'
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ]

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.api_key}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error?.message || `Grok API error: ${response.statusText}`)
      }

      const json = await response.json()
      return json.choices?.[0]?.message?.content || 'No response returned from Grok.'
    }

    return await this.simulateCloneResponse(userMessage)
  },

  async saveVoiceCloningSettings(voiceConfig: VoiceCloningConfig): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const current = (await this.getSettings()) || {
      api_key: '',
      provider: 'gemini',
    }

    const updated: UserSettings = {
      ...current,
      voice_cloning: voiceConfig,
      updated_at: new Date().toISOString(),
    }

    setLocalData(STORAGE_KEYS.SETTINGS, updated)

    if (!user.isGuest) {
      try {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          api_key: updated.api_key,
          provider: updated.provider,
          updated_at: updated.updated_at,
        })
      } catch {
        // Fall back to local
      }
    }
  },

  async getRecruiterSettings(): Promise<RecruiterSettings> {
    const user = await this.getCurrentUser()
    const defaultSettings: RecruiterSettings = {
      target_roles: ['Staff Software Engineer', 'AI Systems Architect', 'Full Stack Tech Lead'],
      work_preference: 'Remote',
      min_compensation: '$160,000 / year or $90 / hour',
      availability: '2 to 4 weeks notice',
      preferred_stack: 'TypeScript, Next.js, Python, PostgreSQL, LLMs',
      deal_breakers: 'No unsolicited third-party agencies, no unpaid technical trials',
      auto_respond: true,
      updated_at: new Date().toISOString(),
    }

    if (!user) return defaultSettings

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('recruiter_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          return {
            target_roles: data.target_roles || defaultSettings.target_roles,
            work_preference: data.work_preference || defaultSettings.work_preference,
            min_compensation: data.min_compensation || defaultSettings.min_compensation,
            availability: data.availability || defaultSettings.availability,
            preferred_stack: data.preferred_stack || defaultSettings.preferred_stack,
            deal_breakers: data.deal_breakers || defaultSettings.deal_breakers,
            auto_respond: data.auto_respond !== undefined ? data.auto_respond : true,
            updated_at: data.updated_at,
          }
        }
      } catch {
        // Fall back to local
      }
    }

    return getLocalData<RecruiterSettings>(STORAGE_KEYS.RECRUITER_SETTINGS, defaultSettings)
  },

  async saveRecruiterSettings(settings: Partial<RecruiterSettings>): Promise<RecruiterSettings> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const current = await this.getRecruiterSettings()
    const updated: RecruiterSettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    }

    setLocalData(STORAGE_KEYS.RECRUITER_SETTINGS, updated)

    if (!user.isGuest) {
      try {
        await supabase.from('recruiter_settings').upsert({
          user_id: user.id,
          target_roles: updated.target_roles,
          work_preference: updated.work_preference,
          min_compensation: updated.min_compensation,
          availability: updated.availability,
          preferred_stack: updated.preferred_stack,
          deal_breakers: updated.deal_breakers,
          auto_respond: updated.auto_respond,
          updated_at: updated.updated_at,
        })
      } catch {
        // Fall back to local
      }
    }

    return updated
  },

  async getRecruiterLeads(): Promise<RecruiterLead[]> {
    const user = await this.getCurrentUser()
    if (!user) return []

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('recruiter_leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as RecruiterLead[]
        }
      } catch {
        // Fall back to local
      }
    }

    return getLocalData<RecruiterLead[]>(STORAGE_KEYS.RECRUITER_LEADS, [])
  },

  async addRecruiterLead(
    leadData: Omit<RecruiterLead, 'id' | 'created_at'>
  ): Promise<RecruiterLead> {
    const user = await this.getCurrentUser()
    const id = 'lead_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
    const newLead: RecruiterLead = {
      ...leadData,
      id,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<RecruiterLead[]>(STORAGE_KEYS.RECRUITER_LEADS, [])
    const updated = [newLead, ...current]
    setLocalData(STORAGE_KEYS.RECRUITER_LEADS, updated)

    if (user && !user.isGuest) {
      try {
        await supabase.from('recruiter_leads').insert({
          id: newLead.id,
          user_id: user.id,
          recruiter_name: newLead.recruiter_name,
          company: newLead.company,
          email: newLead.email,
          role_title: newLead.role_title,
          compensation_offered: newLead.compensation_offered,
          fit_score: newLead.fit_score,
          status: newLead.status,
          notes: newLead.notes,
          transcript: newLead.transcript,
        })
      } catch {
        // Saved locally
      }
    }

    return newLead
  },

  async updateLeadStatus(id: string, status: RecruiterLead['status']): Promise<void> {
    const current = getLocalData<RecruiterLead[]>(STORAGE_KEYS.RECRUITER_LEADS, [])
    const updated = current.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    setLocalData(STORAGE_KEYS.RECRUITER_LEADS, updated)

    const user = await this.getCurrentUser()
    if (user && !user.isGuest) {
      try {
        await supabase.from('recruiter_leads').update({ status }).eq('id', id)
      } catch {
        // Ignore
      }
    }
  },

  async deleteLead(id: string): Promise<void> {
    const current = getLocalData<RecruiterLead[]>(STORAGE_KEYS.RECRUITER_LEADS, [])
    const filtered = current.filter((lead) => lead.id !== id)
    setLocalData(STORAGE_KEYS.RECRUITER_LEADS, filtered)

    const user = await this.getCurrentUser()
    if (user && !user.isGuest) {
      try {
        await supabase.from('recruiter_leads').delete().eq('id', id)
      } catch {
        // Ignore
      }
    }
  },

  evaluateOpportunityFit(params: {
    roleTitle?: string
    compensation?: string
    workPreference?: string
    stack?: string
    settings?: RecruiterSettings
  }): { score: number; reasoning: string } {
    const settings = params.settings || {
      target_roles: ['engineer', 'architect', 'lead', 'developer'],
      work_preference: 'Remote' as const,
      min_compensation: '160000',
      availability: 'immediate',
      preferred_stack: 'typescript, next.js, python, react',
      deal_breakers: '',
      auto_respond: true,
    }

    let score = 50
    const reasons: string[] = []

    // 1. Role alignment
    if (params.roleTitle) {
      const titleLower = params.roleTitle.toLowerCase()
      const roleMatch = settings.target_roles.some((r) =>
        titleLower.includes(r.toLowerCase().trim())
      )
      if (roleMatch) {
        score += 20
        reasons.push('Role matches target seniority and specialization.')
      } else if (
        titleLower.includes('engineer') ||
        titleLower.includes('architect') ||
        titleLower.includes('tech')
      ) {
        score += 10
        reasons.push('Role is in target technical domain.')
      } else {
        score -= 10
        reasons.push('Role title is outside primary focus.')
      }
    }

    // 2. Work location alignment
    if (params.workPreference) {
      const wpLower = params.workPreference.toLowerCase()
      const prefLower = settings.work_preference.toLowerCase()
      if (wpLower.includes(prefLower) || wpLower.includes('remote')) {
        score += 15
        reasons.push('Location model matches preferred arrangement.')
      } else if (wpLower.includes('on-site') && prefLower.includes('remote')) {
        score -= 20
        reasons.push('On-site requirement does not match remote preference.')
      }
    }

    // 3. Compensation evaluation
    if (params.compensation) {
      const numbers = params.compensation.replace(/[^0-9]/g, '')
      const offered = parseInt(numbers, 10)
      if (!isNaN(offered) && offered > 0) {
        if (offered >= 140000 || offered >= 80) {
          score += 15
          reasons.push('Compensation meets or exceeds target threshold.')
        } else if (offered < 90000 && offered > 500) {
          score -= 15
          reasons.push('Compensation is below target compensation level.')
        }
      }
    }

    // Cap between 10 and 99
    const finalScore = Math.max(10, Math.min(99, score))
    return {
      score: finalScore,
      reasoning: reasons.join(' ') || 'Standard inquiry evaluated against candidate baseline.',
    }
  },

  async generateRecruiterPersonaPrompt(): Promise<string> {
    const user = await this.getCurrentUser()
    const name = user?.email ? user.email.split('@')[0] : 'The Creator'
    const settings = await this.getRecruiterSettings()
    const personality = await this.getPersonality()
    const workTrait = personality.find((p) => p.category === 'work')?.answer || 'Focusing on high scalability.'

    return `You are the autonomous AI career and recruiter representative of "${name}".
You represent ${name} when recruiters, hiring managers, and clients reach out.
Always speak politely and professionally in first-person ("I", "my experience", "my expectations").

CANDIDATE PREFERENCES:
- Target Roles: ${settings.target_roles.join(', ')}
- Work Location Preference: ${settings.work_preference}
- Compensation Expectations: ${settings.min_compensation}
- Availability / Notice Period: ${settings.availability}
- Preferred Tech Stack: ${settings.preferred_stack}
- Deal Breakers: ${settings.deal_breakers}
- Technical Philosophy: "${workTrait}"

RULES:
1. Be professional, candid, and direct.
2. If asked about salary, share the target range clearly.
3. If asked about stack or work style, explain alignment with preferred stack.
4. Encourage the recruiter to leave their company name, email, and role details.
5. Strictly do not use any emojis in your response.`
  },

  async askRecruiterAgent(
    query: string,
    history: Array<{ role: 'recruiter' | 'assistant'; content: string }>
  ): Promise<{ reply: string; fitScore: number }> {
    const settings = await this.getRecruiterSettings()
    const qLower = query.toLowerCase()

    const { score } = this.evaluateOpportunityFit({
      roleTitle: query,
      compensation: query,
      workPreference: query,
      stack: query,
      settings,
    })

    // Specialized canned responses if no API key or provider
    const userSettings = await this.getSettings()
    if (!userSettings?.api_key) {
      if (qLower.includes('salary') || qLower.includes('rate') || qLower.includes('compensation') || qLower.includes('budget')) {
        return {
          reply: `Regarding compensation: My target baseline is ${settings.min_compensation}, depending on equity and scope of impact. What budget range does your team have budgeted for this position?`,
          fitScore: score,
        }
      }

      if (qLower.includes('remote') || qLower.includes('relocation') || qLower.includes('hybrid') || qLower.includes('location')) {
        return {
          reply: `For location: My primary preference is ${settings.work_preference}. I work best in high-trust autonomous environments with flexible collaboration. Does this role support ${settings.work_preference} work?`,
          fitScore: score,
        }
      }

      if (qLower.includes('stack') || qLower.includes('technologies') || qLower.includes('tools') || qLower.includes('skills')) {
        return {
          reply: `My preferred technology stack centers on ${settings.preferred_stack}. I focus on clean architectures, high performance, and rapid delivery. What does your current architecture stack look like?`,
          fitScore: score,
        }
      }

      if (qLower.includes('available') || qLower.includes('start') || qLower.includes('notice')) {
        return {
          reply: `My current availability is ${settings.availability}. I am open to discussing immediate technical roadmaps. Could you share more about the team and timeline?`,
          fitScore: score,
        }
      }

      return {
        reply: `Thank you for reaching out. I specialize in ${settings.target_roles.join(', ')}, working with ${settings.preferred_stack}. Could you share your company name, the role title, and a link or description so we can evaluate mutual fit?`,
        fitScore: score,
      }
    }

    // If API key is available, use provider with recruiter persona prompt
    const recruiterPrompt = await this.generateRecruiterPersonaPrompt()
    const chatHistory: ChatMessage[] = history.map((h, idx) => ({
      id: `rc_${idx}`,
      role: h.role === 'recruiter' ? 'user' : 'assistant',
      content: h.content,
      created_at: new Date().toISOString(),
    }))

    const reply = await this.askAiProvider(
      `${recruiterPrompt}\n\nRecruiter Query: "${query}"`,
      chatHistory,
      userSettings
    )

    return { reply, fitScore: score }
  },

  async getIngestedRepositories(): Promise<IngestedRepository[]> {
    return getLocalData<IngestedRepository[]>(STORAGE_KEYS.INGESTED_REPOS, [])
  },

  async addIngestedRepository(
    repoData: Omit<IngestedRepository, 'id' | 'created_at'>
  ): Promise<IngestedRepository> {
    const user = await this.getCurrentUser()
    const id = 'repo_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
    const newRepo: IngestedRepository = {
      ...repoData,
      id,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<IngestedRepository[]>(STORAGE_KEYS.INGESTED_REPOS, [])
    const updated = [newRepo, ...current.filter((r) => r.repo_url !== newRepo.repo_url)]
    setLocalData(STORAGE_KEYS.INGESTED_REPOS, updated)

    await this.calculateProgress()
    return newRepo
  },

  async deleteIngestedRepository(id: string): Promise<void> {
    const current = getLocalData<IngestedRepository[]>(STORAGE_KEYS.INGESTED_REPOS, [])
    const filtered = current.filter((r) => r.id !== id)
    setLocalData(STORAGE_KEYS.INGESTED_REPOS, filtered)
    await this.calculateProgress()
  },

  async getVoiceVoicemails(): Promise<VoiceVoicemail[]> {
    return getLocalData<VoiceVoicemail[]>(STORAGE_KEYS.VOICE_VOICEMAILS, [])
  },

  async addVoiceVoicemail(
    data: Omit<VoiceVoicemail, 'id' | 'created_at'>
  ): Promise<VoiceVoicemail> {
    const user = await this.getCurrentUser()
    const id = 'vm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
    const newVoicemail: VoiceVoicemail = {
      ...data,
      id,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    }

    const current = getLocalData<VoiceVoicemail[]>(STORAGE_KEYS.VOICE_VOICEMAILS, [])
    const updated = [newVoicemail, ...current]
    setLocalData(STORAGE_KEYS.VOICE_VOICEMAILS, updated)
    return newVoicemail
  },

  async updateVoicemailStatus(id: string, status: VoiceVoicemail['status']): Promise<void> {
    const current = getLocalData<VoiceVoicemail[]>(STORAGE_KEYS.VOICE_VOICEMAILS, [])
    const updated = current.map((v) => (v.id === id ? { ...v, status } : v))
    setLocalData(STORAGE_KEYS.VOICE_VOICEMAILS, updated)
  },

  async deleteVoiceVoicemail(id: string): Promise<void> {
    const current = getLocalData<VoiceVoicemail[]>(STORAGE_KEYS.VOICE_VOICEMAILS, [])
    const filtered = current.filter((v) => v.id !== id)
    setLocalData(STORAGE_KEYS.VOICE_VOICEMAILS, filtered)
  },

  getPresetArchitectureDiagrams(): ArchitectureDiagram[] {
    return [
      {
        id: 'arch_microservices',
        title: 'Cloud Native Microservices Architecture',
        category: 'backend',
        description:
          'Distributed, event-driven service mesh designed for high throughput, zero single points of failure, and clean bounded contexts.',
        nodes: [
          {
            id: 'n_client',
            label: 'Web & Mobile Client',
            tier: 'client',
            description: 'React, Next.js, and iOS native clients with optimistic caching.',
            tech: 'Next.js 16, React 19, Tailwind CSS',
          },
          {
            id: 'n_gateway',
            label: 'Edge API Gateway',
            tier: 'gateway',
            description: 'Handles rate limiting, JWT authentication, and request routing.',
            tech: 'Kong / Envoy, TLS 1.3, Redis Rate Limiting',
          },
          {
            id: 'n_auth',
            label: 'Auth & Identity Service',
            tier: 'service',
            description: 'Issues signed asymmetric JWT tokens with refresh rotation.',
            tech: 'Node.js, Supabase Auth, Ed25519 Keys',
          },
          {
            id: 'n_core',
            label: 'Core Business Service',
            tier: 'service',
            description: 'Executes transaction logic and enforces domain invariants.',
            tech: 'TypeScript, Express, Prisma ORM',
          },
          {
            id: 'n_ai',
            label: 'AI Inference Engine',
            tier: 'ai',
            description: 'Runs real-time LLM reasoning and custom neural pipelines.',
            tech: 'Python FastAPI, vLLM, Gemini 1.5 Flash',
          },
          {
            id: 'n_db',
            label: 'Primary Database & Cache',
            tier: 'database',
            description: 'ACID PostgreSQL relational cluster with in-memory Redis layer.',
            tech: 'PostgreSQL 16, Redis 7, WAL Replication',
          },
          {
            id: 'n_queue',
            label: 'Event Stream & Queue',
            tier: 'queue',
            description: 'Asynchronous event distribution for decoupled background processing.',
            tech: 'Apache Kafka, BullMQ, Dead Letter Queues',
          },
        ],
        edges: [
          { from: 'n_client', to: 'n_gateway', protocol: 'HTTPS / WSS' },
          { from: 'n_gateway', to: 'n_auth', protocol: 'gRPC' },
          { from: 'n_gateway', to: 'n_core', protocol: 'gRPC' },
          { from: 'n_core', to: 'n_ai', protocol: 'HTTP/2 Streaming' },
          { from: 'n_core', to: 'n_db', protocol: 'TCP Connection Pool' },
          { from: 'n_core', to: 'n_queue', protocol: 'Kafka Producer' },
        ],
      },
      {
        id: 'arch_livekit_voice',
        title: 'Real-Time WebRTC Voice & Audio Architecture',
        category: 'audio',
        description:
          'Sub-300ms bidirectional voice streaming architecture with live acoustic visualizers and server-side speech recognition.',
        nodes: [
          {
            id: 'v_client',
            label: 'Browser Audio Stream',
            tier: 'client',
            description: 'Captures microphone stream and computes FFT frequency bins in Web Audio API.',
            tech: 'WebRTC MediaStream, AnalyserNode, Canvas Visualizers',
          },
          {
            id: 'v_sfu',
            label: 'LiveKit SFU Server',
            tier: 'gateway',
            description: 'Selective Forwarding Unit managing low-latency audio packet routing.',
            tech: 'LiveKit Cloud, Go, WebRTC ICE/DTLS',
          },
          {
            id: 'v_stt',
            label: 'Streaming Speech-to-Text',
            tier: 'ai',
            description: 'Transcribes streaming voice packets into text tokens in real time.',
            tech: 'Deepgram / Web Speech API, Sub-200ms latency',
          },
          {
            id: 'v_llm',
            label: 'Persona Inference Core',
            tier: 'ai',
            description: 'Streams token responses conditioned on authentic creator identity.',
            tech: 'Gemini 1.5 Flash, Streaming HTTP SSE',
          },
          {
            id: 'v_tts',
            label: 'Neural Voice Synthesis',
            tier: 'service',
            description: 'Converts streamed text tokens to cloned audio voice waveforms.',
            tech: 'ElevenLabs Multilingual v2, Web Audio Buffer',
          },
        ],
        edges: [
          { from: 'v_client', to: 'v_sfu', protocol: 'WebRTC (Opus Audio)' },
          { from: 'v_sfu', to: 'v_stt', protocol: 'RTP Audio Stream' },
          { from: 'v_stt', to: 'v_llm', protocol: 'Text Stream' },
          { from: 'v_llm', to: 'v_tts', protocol: 'SSE Token Stream' },
          { from: 'v_tts', to: 'v_client', protocol: 'RTP Opus / Audio Buffer' },
        ],
      },
      {
        id: 'arch_rag_pipeline',
        title: 'Repository & Document Knowledge Pipeline',
        category: 'knowledge',
        description:
          'Automated repository ingestion and semantic search engine grounding clone responses in verified source code.',
        nodes: [
          {
            id: 'r_source',
            label: 'GitHub & Documents',
            tier: 'client',
            description: 'Public git repos, technical papers, resumes, and code files.',
            tech: 'GitHub REST API, Markdown, TypeScript, Python',
          },
          {
            id: 'r_parser',
            label: 'AST & Code Chunker',
            tier: 'service',
            description: 'Splits source code into semantic function and module blocks.',
            tech: 'Tree-sitter, Recursive Character Splitter',
          },
          {
            id: 'r_embed',
            label: 'Embedding Engine',
            tier: 'ai',
            description: 'Generates high-dimensional vector embeddings for code snippets.',
            tech: 'text-embedding-3-small, 1536 Dimensions',
          },
          {
            id: 'r_vector',
            label: 'Vector Knowledge Store',
            tier: 'database',
            description: 'HNSW index enabling sub-10ms semantic similarity queries.',
            tech: 'PostgreSQL pgvector, Local Memory Cache',
          },
          {
            id: 'r_persona',
            label: 'Persona Grounding Layer',
            tier: 'ai',
            description: 'Injects relevant code citations into first-person clone replies.',
            tech: 'Saruto Dynamic System Prompt, Citation Mapper',
          },
        ],
        edges: [
          { from: 'r_source', to: 'r_parser', protocol: 'HTTPS / Multipart' },
          { from: 'r_parser', to: 'r_embed', protocol: 'JSON Batch' },
          { from: 'r_embed', to: 'r_vector', protocol: 'Vector Upsert' },
          { from: 'r_vector', to: 'r_persona', protocol: 'kNN Cosine Distance' },
        ],
      },
    ]
  },

  async getArchitectureDiagrams(): Promise<ArchitectureDiagram[]> {
    const presets = this.getPresetArchitectureDiagrams()
    const custom = getLocalData<ArchitectureDiagram[]>(STORAGE_KEYS.ARCHITECTURE_DIAGRAMS, [])
    return [...presets, ...custom]
  },

  detectArchitectureIntent(query: string): ArchitectureDiagram | null {
    const qLower = query.toLowerCase()
    const hasArchIntent =
      qLower.includes('architecture') ||
      qLower.includes('system design') ||
      qLower.includes('diagram') ||
      qLower.includes('whiteboard') ||
      qLower.includes('flowchart') ||
      qLower.includes('how it works') ||
      qLower.includes('pipeline') ||
      qLower.includes('infrastructure')

    if (!hasArchIntent) return null

    const diagrams = this.getPresetArchitectureDiagrams()

    if (qLower.includes('voice') || qLower.includes('audio') || qLower.includes('livekit') || qLower.includes('webrtc')) {
      return diagrams.find((d) => d.id === 'arch_livekit_voice') || diagrams[0]
    }

    if (qLower.includes('rag') || qLower.includes('knowledge') || qLower.includes('repo') || qLower.includes('ingest')) {
      return diagrams.find((d) => d.id === 'arch_rag_pipeline') || diagrams[0]
    }

    return diagrams.find((d) => d.id === 'arch_microservices') || diagrams[0]
  },
}

