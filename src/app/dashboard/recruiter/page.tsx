'use client'

import { useState, useEffect, useRef } from 'react'
import { CloneStore, CloneUser, RecruiterSettings, RecruiterLead, VoiceVoicemail } from '@/lib/clone-store'
import { VoiceVoicemailRecorder } from '@/components/voice-voicemail-recorder'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RecruiterPage() {
  const [user, setUser] = useState<CloneUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'simulator' | 'preferences' | 'leads' | 'voicemails'>('simulator')

  // Preferences State
  const [targetRolesText, setTargetRolesText] = useState('')
  const [workPreference, setWorkPreference] = useState<RecruiterSettings['work_preference']>('Remote')
  const [minCompensation, setMinCompensation] = useState('')
  const [availability, setAvailability] = useState('')
  const [preferredStack, setPreferredStack] = useState('')
  const [dealBreakers, setDealBreakers] = useState('')
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [statusNotice, setStatusNotice] = useState('')

  // Simulator State
  const [interviewQuery, setInterviewQuery] = useState('')
  const [sendingInterview, setSendingInterview] = useState(false)
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: 'recruiter' | 'assistant'; content: string; fitScore?: number }>
  >([
    {
      role: 'assistant',
      content:
        'Hello. I am the autonomous AI representative of the creator. I am authorized to discuss target roles, compensation expectations, availability, and technical background with recruiters and clients. What opportunity are you hiring for?',
    },
  ])
  const [currentFitScore, setCurrentFitScore] = useState<number | null>(null)

  // Leads State
  const [leads, setLeads] = useState<RecruiterLead[]>([])
  const [selectedLead, setSelectedLead] = useState<RecruiterLead | null>(null)
  const [manualRecruiterName, setManualRecruiterName] = useState('')
  const [manualCompany, setManualCompany] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualRole, setManualRole] = useState('')
  const [manualComp, setManualComp] = useState('')
  const [showManualModal, setShowManualModal] = useState(false)

  // Voicemails State
  const [voicemails, setVoicemails] = useState<VoiceVoicemail[]>([])
  const [selectedVoicemail, setSelectedVoicemail] = useState<VoiceVoicemail | null>(null)
  const [showRecordModal, setShowRecordModal] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    initData()
  }, [])

  useEffect(() => {
    if (activeTab === 'simulator') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, activeTab])

  const initData = async () => {
    try {
      let currentUser = await CloneStore.getCurrentUser()
      if (!currentUser && CloneStore.isLoginDisabled()) {
        currentUser = await CloneStore.loginAsGuest('creator@saruto.local')
      }
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      const [settings, storedLeads, storedVoicemails] = await Promise.all([
        CloneStore.getRecruiterSettings().catch(() => ({
          target_roles: [],
          work_preference: 'Remote' as const,
          min_compensation: '',
          availability: '',
          preferred_stack: '',
          deal_breakers: '',
        })),
        CloneStore.getRecruiterLeads().catch(() => []),
        CloneStore.getVoiceVoicemails().catch(() => []),
      ])

      setTargetRolesText(settings.target_roles.join(', '))
      setWorkPreference(settings.work_preference)
      setMinCompensation(settings.min_compensation)
      setAvailability(settings.availability)
      setPreferredStack(settings.preferred_stack)
      setDealBreakers(settings.deal_breakers)

      setLeads(storedLeads)
      setVoicemails(storedVoicemails)
    } catch (err) {
      console.error('Error initializing recruiter data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPreferences(true)
    setStatusNotice('')

    try {
      const rolesArray = targetRolesText
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)

      await CloneStore.saveRecruiterSettings({
        target_roles: rolesArray,
        work_preference: workPreference,
        min_compensation: minCompensation.trim(),
        availability: availability.trim(),
        preferred_stack: preferredStack.trim(),
        deal_breakers: dealBreakers.trim(),
      })

      setStatusNotice('Recruiter preferences and candidate rules saved successfully.')
    } catch (err: any) {
      setStatusNotice(err.message || 'Failed to save preferences')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleSendInterview = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    const textToSend = (customText || interviewQuery).trim()
    if (!textToSend || sendingInterview) return

    setSendingInterview(true)
    setInterviewQuery('')

    const updatedHistory = [...chatHistory, { role: 'recruiter' as const, content: textToSend }]
    setChatHistory(updatedHistory)

    try {
      const response = await CloneStore.askRecruiterAgent(textToSend, chatHistory)
      setCurrentFitScore(response.fitScore)

      setChatHistory([
        ...updatedHistory,
        {
          role: 'assistant',
          content: response.reply,
          fitScore: response.fitScore,
        },
      ])
    } catch (err: any) {
      setChatHistory([
        ...updatedHistory,
        {
          role: 'assistant',
          content:
            'I am currently operating in candidate assessment mode. Please share your company name and role specifications.',
        },
      ])
    } finally {
      setSendingInterview(false)
    }
  }

  const handleConvertChatToLead = async () => {
    if (chatHistory.length <= 1) return

    // Extract any recruiter details or prompt for defaults
    const recruiterInput = chatHistory.filter((c) => c.role === 'recruiter')
    const firstQuery = recruiterInput[0]?.content || 'General Opportunity'

    const newLead = await CloneStore.addRecruiterLead({
      recruiter_name: 'Inbound Recruiter',
      company: 'Prospective Client',
      email: 'recruiter@company.com',
      role_title: firstQuery.slice(0, 50),
      compensation_offered: minCompensation || 'Negotiable',
      fit_score: currentFitScore || 80,
      status: 'new',
      notes: `Captured via Live Recruiter Simulator on ${new Date().toLocaleDateString()}`,
      transcript: chatHistory.map((c) => ({ role: c.role, content: c.content })),
    })

    const updated = await CloneStore.getRecruiterLeads()
    setLeads(updated)
    setSelectedLead(newLead)
    setActiveTab('leads')
  }

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualRecruiterName.trim() || !manualCompany.trim() || !manualEmail.trim()) return

    const { score } = CloneStore.evaluateOpportunityFit({
      roleTitle: manualRole,
      compensation: manualComp,
    })

    const lead = await CloneStore.addRecruiterLead({
      recruiter_name: manualRecruiterName.trim(),
      company: manualCompany.trim(),
      email: manualEmail.trim(),
      role_title: manualRole.trim() || 'Software Engineering Role',
      compensation_offered: manualComp.trim() || 'Not specified',
      fit_score: score,
      status: 'new',
      notes: 'Manually logged opportunity',
      transcript: [
        {
          role: 'recruiter',
          content: `Inquiry regarding ${manualRole || 'open position'} at ${manualCompany}`,
        },
      ],
    })

    const updated = await CloneStore.getRecruiterLeads()
    setLeads(updated)
    setSelectedLead(lead)
    setShowManualModal(false)
    setManualRecruiterName('')
    setManualCompany('')
    setManualEmail('')
    setManualRole('')
    setManualComp('')
  }

  const handleUpdateStatus = async (id: string, status: RecruiterLead['status']) => {
    await CloneStore.updateLeadStatus(id, status)
    const updated = await CloneStore.getRecruiterLeads()
    setLeads(updated)
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, status })
    }
  }

  const handleDeleteLead = async (id: string) => {
    await CloneStore.deleteLead(id)
    const updated = await CloneStore.getRecruiterLeads()
    setLeads(updated)
    if (selectedLead?.id === id) {
      setSelectedLead(null)
    }
  }

  const handleUpdateVoicemailStatus = async (id: string, status: VoiceVoicemail['status']) => {
    await CloneStore.updateVoicemailStatus(id, status)
    const updated = await CloneStore.getVoiceVoicemails()
    setVoicemails(updated)
    if (selectedVoicemail?.id === id) {
      setSelectedVoicemail({ ...selectedVoicemail, status })
    }
  }

  const handleDeleteVoicemail = async (id: string) => {
    await CloneStore.deleteVoiceVoicemail(id)
    const updated = await CloneStore.getVoiceVoicemails()
    setVoicemails(updated)
    if (selectedVoicemail?.id === id) {
      setSelectedVoicemail(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm font-mono">Initializing Recruiter Agent Studio...</span>
          <button
            type="button"
            onClick={() => setLoading(false)}
            className="text-[11px] text-zinc-500 hover:text-white underline mt-2 transition-colors"
          >
            Enter Studio Directly
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                Saruto AI
              </Link>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-900 text-zinc-400">
                Recruiter Agent Mode
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

        {/* Main Body */}
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                Autonomous Career Screening
              </span>
              <h1 className="text-3xl font-bold tracking-tight mt-1">
                Recruiter &amp; Inbound Client Agent
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Let your clone screen opportunities, communicate salary baselines, evaluate opportunity
                fit, and collect qualified leads 24/7.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center border border-zinc-800 bg-zinc-950 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'simulator'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Interview Simulator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'leads'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Lead Inbox</span>
                <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {leads.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('voicemails')}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'voicemails'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Voice Voicemails</span>
                <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {voicemails.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'preferences'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Candidate Rules
              </button>
            </div>
          </div>

          {/* TAB 1: INTERVIEW SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Column */}
              <div className="lg:col-span-2 border border-zinc-800 bg-zinc-950 rounded-2xl flex flex-col h-[600px] overflow-hidden">
                <div className="border-b border-zinc-800 bg-zinc-900/60 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Recruiter Screening Console
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConvertChatToLead}
                    disabled={chatHistory.length <= 1}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-3 py-1 rounded transition-colors disabled:opacity-30"
                  >
                    Save As Lead
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${
                        msg.role === 'recruiter' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          {msg.role === 'recruiter' ? 'Recruiter / Client' : 'Your Clone Representative'}
                        </span>
                        {msg.fitScore !== undefined && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              msg.fitScore >= 75
                                ? 'bg-zinc-800 text-white'
                                : msg.fitScore >= 50
                                ? 'bg-zinc-900 text-zinc-400'
                                : 'bg-zinc-900 text-zinc-600'
                            }`}
                          >
                            Fit: {msg.fitScore}%
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'recruiter'
                            ? 'bg-white text-black font-medium'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {sendingInterview && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      <span>Evaluating opportunity alignment...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Suggested Prompts Bar */}
                <div className="border-t border-zinc-900 px-5 py-2.5 flex items-center gap-2 overflow-x-auto text-xs bg-zinc-950">
                  <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap">Test Prompts:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendInterview(
                        undefined,
                        'What are your compensation expectations for senior roles?'
                      )
                    }
                    className="whitespace-nowrap px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    Salary expectations?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendInterview(
                        undefined,
                        'Are you open to hybrid roles or do you require remote work?'
                      )
                    }
                    className="whitespace-nowrap px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    Remote vs Hybrid?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendInterview(
                        undefined,
                        'Tell me about your core tech stack and system architecture experience.'
                      )
                    }
                    className="whitespace-nowrap px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    Architecture stack?
                  </button>
                </div>

                {/* Form Input */}
                <form
                  onSubmit={handleSendInterview}
                  className="border-t border-zinc-800 p-3 bg-zinc-900/50 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={interviewQuery}
                    onChange={(e) => setInterviewQuery(e.target.value)}
                    placeholder="Type an interview inquiry as a recruiter..."
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="submit"
                    disabled={!interviewQuery.trim() || sendingInterview}
                    className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-30"
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Assessment Sidebar */}
              <div className="space-y-4">
                <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                      Live Fit Analysis
                    </h3>
                    {currentFitScore !== null && (
                      <span className="text-xl font-bold font-mono text-white">
                        {currentFitScore}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The clone evaluates role title, compensation thresholds, location model, and tech stack
                    alignment on every recruiter interaction.
                  </p>

                  <div className="border-t border-zinc-900 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-500">Target Baseline:</span>
                      <span className="text-zinc-300 font-mono">{minCompensation || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-500">Location Model:</span>
                      <span className="text-zinc-300">{workPreference}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-500">Availability:</span>
                      <span className="text-zinc-300">{availability || 'Immediate'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('preferences')}
                    className="w-full text-center text-xs border border-zinc-800 hover:border-zinc-700 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    Edit Screening Rules &rarr;
                  </button>
                </div>

                <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-2xl space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Lead Collection Mode
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    When visitors or recruiters interact with your embedded portfolio widget, they can choose
                    Work Inquiry to log their company and role directly into your inbox.
                  </p>
                  <Link
                    href="/dashboard/export"
                    className="text-xs text-zinc-300 hover:text-white underline block"
                  >
                    View Embed Widget Studio &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS INBOX */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Inbound Inquiries &amp; Recruiter Leads</h2>
                  <p className="text-xs text-zinc-400">
                    Track qualified inquiries screened by your autonomous digital clone.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Log Opportunity
                </button>
              </div>

              {leads.length === 0 ? (
                <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white">No Inbound Leads Yet</h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Leads will appear here when recruiters chat with your clone in the simulator or through your
                    embedded portfolio widget.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('simulator')}
                    className="text-xs border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-lg text-zinc-300"
                  >
                    Open Interview Simulator
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Leads List */}
                  <div className="lg:col-span-1 space-y-3">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedLead?.id === lead.id
                            ? 'bg-zinc-900 border-white'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-white">{lead.recruiter_name}</h4>
                          <span
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                              lead.status === 'new'
                                ? 'bg-zinc-800 text-white border border-zinc-700'
                                : lead.status === 'contacted'
                                ? 'bg-zinc-900 text-zinc-300'
                                : 'bg-zinc-900 text-zinc-600'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-400">{lead.company}</div>
                        <div className="text-xs text-zinc-500 truncate mt-1">{lead.role_title}</div>

                        <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-zinc-400">Fit: {lead.fit_score}%</span>
                          <span className="text-zinc-600">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lead Details Column */}
                  <div className="lg:col-span-2">
                    {selectedLead ? (
                      <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 space-y-6">
                        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold">{selectedLead.recruiter_name}</h3>
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                Fit Score: {selectedLead.fit_score}%
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                              {selectedLead.company} • {selectedLead.email}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={selectedLead.status}
                              onChange={(e) =>
                                handleUpdateStatus(
                                  selectedLead.id,
                                  e.target.value as RecruiterLead['status']
                                )
                              }
                              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="archived">Archived</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeleteLead(selectedLead.id)}
                              className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="border border-zinc-900 bg-black p-3 rounded-lg">
                            <span className="text-zinc-500 block mb-1">Target Position</span>
                            <span className="text-zinc-200 font-medium">{selectedLead.role_title}</span>
                          </div>
                          <div className="border border-zinc-900 bg-black p-3 rounded-lg">
                            <span className="text-zinc-500 block mb-1">Offered Baseline</span>
                            <span className="text-zinc-200 font-medium">
                              {selectedLead.compensation_offered || 'Not specified'}
                            </span>
                          </div>
                        </div>

                        {selectedLead.notes && (
                          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300">
                            <span className="text-zinc-500 block mb-0.5">Notes:</span>
                            {selectedLead.notes}
                          </div>
                        )}

                        {/* Interview Transcript */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Interview Transcript ({selectedLead.transcript.length} turns)
                          </h4>

                          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {selectedLead.transcript.map((item, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg text-xs leading-relaxed ${
                                  item.role === 'recruiter'
                                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                                    : 'bg-black border border-zinc-800 text-zinc-400'
                                }`}
                              >
                                <span className="font-semibold block mb-1 text-[10px] uppercase font-mono text-zinc-500">
                                  {item.role === 'recruiter' ? 'Recruiter' : 'Clone AI'}
                                </span>
                                {item.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-12 text-center text-xs text-zinc-500">
                        Select an opportunity lead from the list to view full transcript and details.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: VOICE VOICEMAILS */}
          {activeTab === 'voicemails' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Voice Voicemail Inquiries</h2>
                  <p className="text-xs text-zinc-400">
                    Listen to spoken questions recorded by visitors and review clone audio responses.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRecordModal(true)}
                  className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Record Voicemail
                </button>
              </div>

              {voicemails.length === 0 ? (
                <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white">No Voice Voicemails Yet</h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Visitors who leave a spoken audio message through your portfolio widget will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRecordModal(true)}
                    className="text-xs border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-lg text-zinc-300"
                  >
                    Record a Voice Sample
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* List */}
                  <div className="lg:col-span-1 space-y-3">
                    {voicemails.map((vm) => (
                      <div
                        key={vm.id}
                        onClick={() => setSelectedVoicemail(vm)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedVoicemail?.id === vm.id
                            ? 'bg-zinc-900 border-white'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-white">{vm.visitor_name}</h4>
                          <span
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                              vm.status === 'new'
                                ? 'bg-zinc-800 text-white border border-zinc-700'
                                : vm.status === 'listened'
                                ? 'bg-zinc-900 text-zinc-300'
                                : 'bg-zinc-900 text-zinc-600'
                            }`}
                          >
                            {vm.status}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          Duration: {vm.duration_seconds}s
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-1">{vm.transcript}</p>
                        <div className="mt-2 pt-2 border-t border-zinc-900 text-[11px] text-zinc-600">
                          {new Date(vm.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="lg:col-span-2">
                    {selectedVoicemail ? (
                      <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-6 space-y-6">
                        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                          <div>
                            <h3 className="text-xl font-bold">{selectedVoicemail.visitor_name}</h3>
                            <p className="text-xs text-zinc-400 mt-1">
                              {selectedVoicemail.visitor_email || 'No email provided'} • {selectedVoicemail.duration_seconds}s
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={selectedVoicemail.status}
                              onChange={(e) =>
                                handleUpdateVoicemailStatus(
                                  selectedVoicemail.id,
                                  e.target.value as VoiceVoicemail['status']
                                )
                              }
                              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
                            >
                              <option value="new">New</option>
                              <option value="listened">Listened</option>
                              <option value="archived">Archived</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeleteVoicemail(selectedVoicemail.id)}
                              className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {selectedVoicemail.audio_url && (
                          <div className="p-4 bg-black border border-zinc-900 rounded-xl space-y-2">
                            <span className="text-xs font-mono text-zinc-400 block">
                              Recorded Audio Message:
                            </span>
                            <audio controls src={selectedVoicemail.audio_url} className="w-full h-9" />
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                              Visitor Transcript:
                            </span>
                            <p className="text-xs text-zinc-200 leading-relaxed italic">
                              &ldquo;{selectedVoicemail.transcript}&rdquo;
                            </p>
                          </div>

                          <div className="p-4 bg-black border border-zinc-800 rounded-xl space-y-1">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                              Clone Audio Response:
                            </span>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {selectedVoicemail.clone_response}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-zinc-800 bg-zinc-950 rounded-2xl p-12 text-center text-xs text-zinc-500">
                        Select a voice inquiry from the list to listen and read the conversation.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CANDIDATE RULES & PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="max-w-3xl border border-zinc-800 bg-zinc-950 rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold">Candidate Rules &amp; Compensation Boundaries</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Configure the rules your AI representative uses when screening opportunities.
                </p>
              </div>

              {statusNotice && (
                <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-3 rounded-lg text-xs font-mono">
                  {statusNotice}
                </div>
              )}

              <form onSubmit={handleSavePreferences} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Target Roles (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={targetRolesText}
                    onChange={(e) => setTargetRolesText(e.target.value)}
                    placeholder="Staff Engineer, AI Systems Architect, Tech Lead"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Location Arrangement
                    </label>
                    <select
                      value={workPreference}
                      onChange={(e) =>
                        setWorkPreference(e.target.value as RecruiterSettings['work_preference'])
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                    >
                      <option value="Remote">Remote Only</option>
                      <option value="Hybrid">Hybrid Acceptable</option>
                      <option value="Flexible">Flexible / Open</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Minimum Compensation Baseline
                    </label>
                    <input
                      type="text"
                      value={minCompensation}
                      onChange={(e) => setMinCompensation(e.target.value)}
                      placeholder="$160,000 / year or $90 / hour"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Availability / Notice Period
                    </label>
                    <input
                      type="text"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="Immediate, 2 weeks notice, Q2 2026"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Preferred Technologies
                    </label>
                    <input
                      type="text"
                      value={preferredStack}
                      onChange={(e) => setPreferredStack(e.target.value)}
                      placeholder="TypeScript, Next.js, Python, PostgreSQL"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Deal Breakers &amp; Exclusions
                  </label>
                  <textarea
                    rows={3}
                    value={dealBreakers}
                    onChange={(e) => setDealBreakers(e.target.value)}
                    placeholder="e.g. No unpaid technical take-home assignments, no unsolicited agency submittals."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPreferences}
                  className="bg-white text-black font-semibold text-xs px-6 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {savingPreferences ? 'Saving Rules...' : 'Save Candidate Rules'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Manual Lead Logging Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-sm">Log Opportunity Manually</h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateManualLead} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Recruiter Name *</label>
                <input
                  type="text"
                  required
                  value={manualRecruiterName}
                  onChange={(e) => setManualRecruiterName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Company *</label>
                <input
                  type="text"
                  required
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Role Title</label>
                <input
                  type="text"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  placeholder="e.g. Lead Platform Engineer"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Compensation Offered</label>
                <input
                  type="text"
                  value={manualComp}
                  onChange={(e) => setManualComp(e.target.value)}
                  placeholder="e.g. $175,000 / year"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-white text-black font-semibold text-xs px-4 py-1.5 rounded hover:bg-zinc-200"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Voicemail Recording Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <VoiceVoicemailRecorder
              onVoicemailSent={async () => {
                const updated = await CloneStore.getVoiceVoicemails()
                setVoicemails(updated)
              }}
              onClose={() => setShowRecordModal(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600">
        Saruto AI - Autonomous Identity Architecture • Recruiter Screening Engine
      </footer>
    </div>
  )
}

