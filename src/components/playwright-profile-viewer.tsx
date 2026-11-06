'use client'

import React, { useState, useEffect } from 'react'
import { PlaywrightTourResult, PlaywrightWalkthroughStep } from '@/lib/playwright-service'

interface PlaywrightProfileViewerProps {
  tourResult: PlaywrightTourResult
  onClose?: () => void
  onNarrationPlay?: (text: string) => void
}

export function PlaywrightProfileViewer({
  tourResult,
  onClose,
  onNarrationPlay,
}: PlaywrightProfileViewerProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual')
  const [copiedCode, setCopiedCode] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)

  const steps = tourResult.walkthroughSteps || []
  const currentStep: PlaywrightWalkthroughStep | undefined = steps[activeStepIndex]

  useEffect(() => {
    if (!autoPlay || steps.length <= 1) return

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < steps.length - 1) {
          const next = prev + 1
          if (onNarrationPlay && steps[next]) {
            onNarrationPlay(steps[next].narration)
          }
          return next
        }
        return prev
      })
    }, 4500)

    return () => clearInterval(interval)
  }, [autoPlay, steps, onNarrationPlay])

  const copyCode = () => {
    if (tourResult.playwrightCode) {
      navigator.clipboard.writeText(tourResult.playwrightCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleStepClick = (index: number) => {
    setActiveStepIndex(index)
    setAutoPlay(false)
    if (onNarrationPlay && steps[index]) {
      onNarrationPlay(steps[index].narration)
    }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4">
      {/* Top Header & Browser Mockup Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
          </div>
          <div className="bg-black border border-zinc-800 rounded px-3 py-1 text-xs font-mono text-zinc-300 max-w-sm truncate flex items-center gap-2">
            <span className="text-zinc-500 font-semibold">PLAYWRIGHT AUTOMATION:</span>
            <span>{tourResult.targetUrl || 'about:blank'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs: Visual vs Generated Code */}
          <div className="flex items-center border border-zinc-800 bg-black rounded p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'visual' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Visual Tour
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'code' ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Generated Code
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-white border border-zinc-800 px-2 py-1 rounded"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'visual' ? (
        <div className="p-6 space-y-6">
          {/* Step Timeline Indicator */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Category: {tourResult.queryCategory?.toUpperCase()}
              </span>
              <span className="text-[11px] text-zinc-600 font-mono">
                Step {activeStepIndex + 1} of {steps.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStepClick(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeStepIndex
                      ? 'w-6 bg-white'
                      : idx < activeStepIndex
                      ? 'w-2 bg-zinc-500'
                      : 'w-2 bg-zinc-800'
                  }`}
                  title={s.title}
                />
              ))}
            </div>
          </div>

          {/* Simulated Browser Viewport with Scroll Indicator */}
          <div className="relative border border-zinc-800 bg-black rounded-xl p-6 min-h-[200px] flex flex-col justify-between overflow-hidden">
            <div className="absolute top-3 right-4 flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                Scroll: {currentStep?.scrollOffset || 0}px
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                Selector: {currentStep?.selector.split(',')[0]}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <h3 className="text-base font-bold text-white">{currentStep?.title}</h3>
              </div>

              <div className="border-l-2 border-zinc-700 pl-4 py-1">
                <p className="text-xs text-zinc-400 font-mono">Action: {currentStep?.action}</p>
                {currentStep?.highlightText && (
                  <p className="text-sm text-zinc-200 mt-2 font-medium bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                    &ldquo;{currentStep.highlightText}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Voice Narration Box */}
            <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
                <span className="italic">&ldquo;{currentStep?.narration}&rdquo;</span>
              </div>

              {onNarrationPlay && currentStep && (
                <button
                  type="button"
                  onClick={() => onNarrationPlay(currentStep.narration)}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded transition-colors flex-shrink-0"
                >
                  Speak Step Aloud
                </button>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={activeStepIndex === 0}
              onClick={() => handleStepClick(activeStepIndex - 1)}
              className="text-xs border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded text-zinc-300 disabled:opacity-30 transition-colors"
            >
              &larr; Previous Section
            </button>

            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {autoPlay ? 'Pause Auto-Tour' : 'Resume Auto-Tour'}
            </button>

            <button
              type="button"
              disabled={activeStepIndex === steps.length - 1}
              onClick={() => handleStepClick(activeStepIndex + 1)}
              className="text-xs bg-white text-black font-semibold px-4 py-2 rounded hover:bg-zinc-200 disabled:opacity-30 transition-colors"
            >
              Next Section &rarr;
            </button>
          </div>
        </div>
      ) : (
        /* Generated Code Tab */
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Dynamically Synthesized Playwright Script
              </span>
              <p className="text-xs text-zinc-500 mt-0.5">
                Zero static templates. Compiled tailored to your specific profile query.
              </p>
            </div>

            <button
              type="button"
              onClick={copyCode}
              className="text-xs bg-white text-black font-semibold px-3.5 py-1.5 rounded hover:bg-zinc-200 transition-colors"
            >
              {copiedCode ? 'Copied to Clipboard' : 'Copy Playwright Code'}
            </button>
          </div>

          <pre className="bg-black border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 overflow-x-auto max-h-80 leading-relaxed">
            {tourResult.playwrightCode || '// No code generated'}
          </pre>
        </div>
      )}
    </div>
  )
}

