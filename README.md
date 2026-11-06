# Saruto AI - Autonomous Identity Architecture

Transform yourself into an autonomous AI agent. Clone your personality, speech patterns, voice characteristics, and knowledge to create a digital version of yourself that thinks, speaks, and responds authentically like you.

## System Features

- **LiveKit Voice-First Twin**: Real-time voice interaction priority with selectable acoustic visualizer animations (Frequency Bars, Orbital Rings, Waveform, Neural Orb) and live background transcript streaming.
- **Personality Playground**: Train your digital twin on your authentic beliefs, communication style, ethics, conflict handling, and humor across 6 structured categories.
- **Voice & Acoustic Studio**: In-browser audio recording and file uploading with speech calibration (pitch, speed, and Web Speech API playback).
- **Knowledge & Social Grounding**: Connect GitHub, X, LinkedIn, YouTube, and custom writing samples to synthesize an accurate digital bio.
- **Interactive Twin Chat**: Real-time conversation with your clone. Supports Google Gemini 1.5 Flash, xAI Grok-Beta, and a built-in neural simulator that works offline.
- **Playwright Autonomous Social Profile Tour**: When asked about your background, experience, or projects, the clone writes dynamic Playwright code tailored to your profiles, opens the page, auto-scrolls through sections, and narrates in voice as you explaining your career.
- **Standalone Clone Export & Embed Studio**: Download a turnkey standalone ZIP package with a sample portfolio, or embed your clone into external websites (HTML, React, Next.js, Webflow, WordPress) with a single script tag.
- **Progress & Fidelity Tracking**: Weighted metrics calculating overall clone fidelity with status badges (Nascent, Developing, Proficient, High Fidelity).
- **Zero Emojis Enforced**: Pure monochrome blank theme with strict minimalist typography and clean SVG iconography.
- **Hybrid Storage Architecture**: Operates with cloud Supabase PostgreSQL sync or instant client sandbox mode for zero-friction testing.

## Tech Stack

- **Framework**: Next.js 16 with App Router & Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Pure Black / Monochrome Theme)
- **Audio & Realtime**: LiveKit Cloud / Open-Source SDKs (`livekit-client`, `livekit-server-sdk`, `@livekit/components-react`)
- **Browser Automation**: Playwright (`playwright`) for autonomous profile tours and dynamic code generation
- **Packaging**: JSZip (`jszip`) for standalone bundle downloads
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth, Storage) + Local Clone Store fallback
- **Inference Engines**: Google Gemini API, xAI Grok API, Built-in Persona Simulator

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone or navigate to the repository directory:

```bash
npm install
```

2. Environment Configuration (`.env.local`):

```env
SUPABASE_URL=https://bldguwxrytyxwnfzoxgd.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_URL=https://bldguwxrytyxwnfzoxgd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

# LiveKit Configuration (Free Cloud or Local Server)
LIVEKIT_URL=wss://saruto-clone.livekit.cloud
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret_key_needs_to_be_long_enough_123456789
NEXT_PUBLIC_LIVEKIT_URL=wss://saruto-clone.livekit.cloud
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Routes & Studios

- **Voice Priority Studio**: `/dashboard/voice-chat`
- **Interactive Chat & Mirror**: `/dashboard/chat`
- **Playwright Profile Tour**: `/dashboard/profile-tour`
- **Export & Embed Studio**: `/dashboard/export`
- **Personality Playground**: `/dashboard/training`
- **Voice & Acoustic Studio**: `/dashboard/voice`
- **Social Profiles & Bio**: `/dashboard/social`
- **AI Provider Settings**: `/dashboard/api-key`

## Exporting Your Clone to External Websites

### 1. Download Standalone Package
Navigate to `/dashboard/export` and click **"Download Standalone Package (ZIP)"**.
The downloaded ZIP contains:
- `index.html`: Fully styled turnkey portfolio page with your embedded clone.
- `saruto-widget.js`: Zero-dependency, lightweight embeddable widget.
- `clone-config.json`: Your complete portable persona context, traits, and acoustic settings.
- `README.md`: Step-by-step instructions.

### 2. Embed on Any Website (1 Line Script Tag)
Add this before your closing `</body>` tag on your portfolio:

```html
<script
  src="https://your-domain.com/saruto-widget.js"
  data-saruto-clone="true"
  data-clone-name="Your Name's Clone"
  data-position="bottom-right"
  data-greeting="Hello, ask my personal AI clone anything!"
></script>
```

### 3. Embed in React or Next.js
```jsx
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script src="/saruto-widget.js" strategy="lazyOnload" />
    </>
  );
}
```

## Playwright Dynamic Automation

When someone asks: *"Walk me through your LinkedIn experience"* or *"Show me your GitHub repositories"*:
1. The engine checks for profile intent. Non-profile queries never generate code.
2. The AI generates a customized Playwright script in TypeScript targeting the person's exact profile URL.
3. The interactive viewer renders the auto-scrolling viewport and displays the compiled code.
4. The clone simultaneously explains the sections aloud in voice as the creator.

## Automated Testing

Run the automated test suite verifying zero emojis, system prompt synthesis, LiveKit token minting, and Playwright dynamic code generation:

```bash
npm test
```

## Production Build

Verify production bundle compilation:

```bash
npm run build
```

## License

All rights reserved.
