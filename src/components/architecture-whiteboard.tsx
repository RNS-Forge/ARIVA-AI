'use client'

import React, { useState } from 'react'
import {
  ArchitectureDiagram,
  ArchitectureNode,
  CloneStore,
} from '@/lib/clone-store'

interface ArchitectureWhiteboardProps {
  initialDiagram?: ArchitectureDiagram
  onNodeSelect?: (node: ArchitectureNode) => void
  onNarrationPlay?: (text: string) => void
  onClose?: () => void
}

export function ArchitectureWhiteboard({
  initialDiagram,
  onNodeSelect,
  onNarrationPlay,
  onClose,
}: ArchitectureWhiteboardProps) {
  const presets = CloneStore.getPresetArchitectureDiagrams()
  const [selectedDiagram, setSelectedDiagram] = useState<ArchitectureDiagram>(
    initialDiagram || presets[0]
  )
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(
    selectedDiagram.nodes[0] || null
  )

  const handleSelectDiagram = (diagram: ArchitectureDiagram) => {
    setSelectedDiagram(diagram)
    setSelectedNode(diagram.nodes[0] || null)
  }

  const handleSelectNode = (node: ArchitectureNode) => {
    setSelectedNode(node)
    if (onNodeSelect) {
      onNodeSelect(node)
    }
  }

  const handleSpeakOverview = () => {
    const text = `${selectedDiagram.title}. ${selectedDiagram.description} It connects ${selectedDiagram.nodes.length} key components from client through data persistence.`
    if (onNarrationPlay) {
      onNarrationPlay(text)
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.0
      window.speechSynthesis.speak(u)
    }
  }

  const getTierColor = (tier: ArchitectureNode['tier']) => {
    switch (tier) {
      case 'client':
        return 'border-zinc-500 bg-zinc-950 text-white'
      case 'gateway':
        return 'border-zinc-400 bg-zinc-900 text-white'
      case 'service':
        return 'border-zinc-600 bg-black text-zinc-200'
      case 'ai':
        return 'border-white bg-zinc-900 text-white font-semibold'
      case 'database':
        return 'border-zinc-700 bg-zinc-950 text-zinc-300'
      case 'queue':
        return 'border-zinc-600 bg-zinc-900 text-zinc-300'
      default:
        return 'border-zinc-800 bg-black text-zinc-300'
    }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4">
      {/* Top Bar with Presets & Voice Button */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider whitespace-nowrap">
            System Design:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectDiagram(preset)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedDiagram.id === preset.id
                  ? 'bg-white text-black font-semibold'
                  : 'bg-black border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={handleSpeakOverview}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
            </svg>
            <span>Narrate Architecture</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 min-h-[440px]">
        {/* Node Graph Grid (2 Cols) */}
        <div className="lg:col-span-2 p-6 flex flex-col justify-between space-y-6 bg-black/40">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-white">{selectedDiagram.title}</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                {selectedDiagram.category}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {selectedDiagram.description}
            </p>
          </div>

          {/* Interactive Graph Nodes Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 my-2">
            {selectedDiagram.nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id
              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${getTierColor(
                    node.tier
                  )} ${isSelected ? 'ring-2 ring-white scale-[1.02]' : 'hover:border-zinc-500'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                      Tier: {node.tier}
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </div>
                  <h4 className="font-bold text-xs">{node.label}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{node.description}</p>
                </div>
              )
            })}
          </div>

          {/* Protocols & Edge Connections */}
          <div className="border-t border-zinc-900 pt-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
              Communication Protocols:
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedDiagram.edges.map((edge, i) => {
                const fromNode = selectedDiagram.nodes.find((n) => n.id === edge.from)
                const toNode = selectedDiagram.nodes.find((n) => n.id === edge.to)
                return (
                  <div
                    key={i}
                    className="bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5"
                  >
                    <span className="text-zinc-300 font-semibold">{fromNode?.label || edge.from}</span>
                    <span className="text-zinc-600">&rarr;</span>
                    <span className="text-zinc-300 font-semibold">{toNode?.label || edge.to}</span>
                    <span className="bg-zinc-900 text-zinc-400 px-1 rounded text-[9px] border border-zinc-800">
                      {edge.protocol}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Node Inspection Drawer */}
        <div className="p-6 bg-zinc-950 space-y-5">
          <div className="border-b border-zinc-900 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
              Node Inspector
            </span>
            <h4 className="text-base font-bold text-white mt-1">
              {selectedNode ? selectedNode.label : 'Select a component'}
            </h4>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">Architecture Role &amp; Responsibilities</span>
                <p className="text-zinc-300 leading-relaxed bg-black border border-zinc-900 p-3 rounded-lg">
                  {selectedNode.description}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">Technologies &amp; Libraries</span>
                <div className="bg-black border border-zinc-900 p-3 rounded-lg font-mono text-zinc-200">
                  {selectedNode.tech}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">Architectural Tier</span>
                <span className="inline-block px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono uppercase text-zinc-300 text-[11px]">
                  {selectedNode.tier} Tier
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `${selectedNode.label}. Built using ${selectedNode.tech}. ${selectedNode.description}`
                    if (onNarrationPlay) onNarrationPlay(text)
                    else if (typeof window !== 'undefined' && window.speechSynthesis) {
                      const u = new SpeechSynthesisUtterance(text)
                      window.speechSynthesis.speak(u)
                    }
                  }}
                  className="w-full text-center text-xs bg-white text-black font-semibold py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Speak Component Details
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Click any component node in the whiteboard to inspect.</p>
          )}
        </div>
      </div>
    </div>
  )
}
