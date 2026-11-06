'use client'

import React, { useMemo } from 'react'

export type VoiceAnimationType = 'bars' | 'radial' | 'waveform' | 'neural-orb'

interface VoiceVisualizerProps {
  animationType: VoiceAnimationType
  state: 'idle' | 'listening' | 'speaking' | 'thinking'
  audioLevel: number // 0.0 to 1.0
  className?: string
}

export function LiveKitVoiceVisualizer({
  animationType,
  state,
  audioLevel,
  className = '',
}: VoiceVisualizerProps) {
  // Normalize volume level for dynamic reactivity
  const level = Math.max(0.08, Math.min(audioLevel, 1))

  // Render Bar Visualizer (LiveKit Frequency Spectrum Bars)
  if (animationType === 'bars') {
    const barCount = 24
    return (
      <div className={`flex items-center justify-center gap-1.5 h-36 px-4 ${className}`}>
        {Array.from({ length: barCount }).map((_, i) => {
          // Calculate sinusoidal frequency distribution
          const factor = Math.sin((i / (barCount - 1)) * Math.PI)
          const baseHeight = 12
          const dynamicHeight =
            state === 'idle'
              ? baseHeight
              : state === 'thinking'
              ? baseHeight + Math.sin(Date.now() / 200 + i) * 16 + 10
              : Math.min(130, Math.max(baseHeight, level * 120 * factor + (i % 2 === 0 ? 8 : 16)))

          return (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                state === 'speaking'
                  ? 'bg-white'
                  : state === 'listening'
                  ? 'bg-zinc-300'
                  : state === 'thinking'
                  ? 'bg-zinc-500 animate-pulse'
                  : 'bg-zinc-800'
              }`}
              style={{
                height: `${dynamicHeight}px`,
                opacity: state === 'idle' ? 0.4 : 0.85 + factor * 0.15,
              }}
            />
          )
        })}
      </div>
    )
  }

  // Render Radial / Orbital Ring Pulse
  if (animationType === 'radial') {
    const scale = 1 + level * 0.6
    return (
      <div className={`relative flex items-center justify-center h-48 w-48 mx-auto ${className}`}>
        {/* Outer Ring 3 */}
        <div
          className={`absolute rounded-full border border-zinc-700/60 transition-transform duration-100 ${
            state === 'speaking' || state === 'listening' ? 'scale-125 opacity-70' : 'opacity-20'
          }`}
          style={{
            width: `${140 * scale}px`,
            height: `${140 * scale}px`,
          }}
        />

        {/* Outer Ring 2 */}
        <div
          className={`absolute rounded-full border border-zinc-600 transition-transform duration-100 ${
            state === 'speaking' || state === 'listening' ? 'scale-110 opacity-80' : 'opacity-30'
          }`}
          style={{
            width: `${100 * scale}px`,
            height: `${100 * scale}px`,
          }}
        />

        {/* Core Center Ring */}
        <div
          className={`rounded-full transition-all duration-100 flex items-center justify-center ${
            state === 'speaking'
              ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]'
              : state === 'listening'
              ? 'bg-zinc-300 shadow-[0_0_20px_rgba(200,200,200,0.3)]'
              : state === 'thinking'
              ? 'bg-zinc-600 animate-pulse'
              : 'bg-zinc-800'
          }`}
          style={{
            width: `${56 * (state === 'idle' ? 1 : scale * 0.9)}px`,
            height: `${56 * (state === 'idle' ? 1 : scale * 0.9)}px`,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
        </div>
      </div>
    )
  }

  // Render Waveform Oscilloscope
  if (animationType === 'waveform') {
    const points = 32
    const width = 280
    const height = 100
    const midY = height / 2

    const pathData = useMemo(() => {
      const coords = []
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * width
        const angle = (i / points) * Math.PI * 4
        const waveHeight =
          state === 'idle'
            ? 3
            : state === 'thinking'
            ? Math.sin(angle) * 12
            : Math.sin(angle) * (level * 40 + 6)
        const y = midY + waveHeight
        coords.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
      }
      return coords.join(' ')
    }, [state, level, points, width, midY])

    return (
      <div className={`flex items-center justify-center h-36 ${className}`}>
        <svg width={width} height={height} className="overflow-visible">
          <path
            d={pathData}
            fill="none"
            stroke={
              state === 'speaking'
                ? '#ffffff'
                : state === 'listening'
                ? '#d4d4d8'
                : state === 'thinking'
                ? '#71717a'
                : '#27272a'
            }
            strokeWidth={state === 'idle' ? '2' : '3'}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>
      </div>
    )
  }

  // Render Neural Minimalist Orb / Aura
  return (
    <div className={`relative flex items-center justify-center h-44 w-44 mx-auto ${className}`}>
      {/* Outer Diffuse Halo */}
      <div
        className={`absolute rounded-full transition-all duration-150 ${
          state === 'speaking'
            ? 'bg-white/10 blur-xl scale-150'
            : state === 'listening'
            ? 'bg-zinc-400/10 blur-lg scale-125'
            : state === 'thinking'
            ? 'bg-zinc-700/15 blur-md animate-pulse scale-110'
            : 'bg-zinc-900/10 scale-90'
        }`}
        style={{
          width: `${90 * (1 + level * 0.7)}px`,
          height: `${90 * (1 + level * 0.7)}px`,
        }}
      />

      {/* Mid Aura Ring */}
      <div
        className={`absolute rounded-full border border-zinc-700/80 transition-all duration-100 ${
          state === 'idle' ? 'opacity-30' : 'opacity-90'
        }`}
        style={{
          width: `${76 * (1 + level * 0.45)}px`,
          height: `${76 * (1 + level * 0.45)}px`,
        }}
      />

      {/* Core Orb */}
      <div
        className={`rounded-full transition-all duration-100 ${
          state === 'speaking'
            ? 'bg-white shadow-[0_0_24px_rgba(255,255,255,0.5)]'
            : state === 'listening'
            ? 'bg-zinc-300'
            : state === 'thinking'
            ? 'bg-zinc-600 animate-pulse'
            : 'bg-zinc-800'
        }`}
        style={{
          width: `${46 * (1 + level * 0.25)}px`,
          height: `${46 * (1 + level * 0.25)}px`,
        }}
      />
    </div>
  )
}

