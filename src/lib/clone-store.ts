import { supabase } from './supabase'

export interface CloneUser {
  id: string
  email: string
  isGuest?: boolean
}

export interface UserSettings {
  api_key: string
  provider: 'gemini' | 'grok'
  updated_at?: string
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
  async getCurrentUser(): Promise<CloneUser | null> {
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

    return `You are the digital AI clone of the user "${username}".
You must speak, reason, and react strictly in first-person ("I", "my", "me") as this individual.
Do NOT speak like an AI assistant or say "As an AI language model". You ARE the user.

=== CORE PERSONALITY & INTERVIEW DATA ===
${personalitySection}

=== SOCIAL PROFILES & CREDENTIALS ===
${socialSection}

=== KNOWLEDGE VAULT & WRITING SAMPLES ===
${knowledgeSection}

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
}

