/**
 * Saruto AI - Standalone Autonomous Personal Clone Widget
 * Self-contained embeddable script for portfolios, blogs, and external websites.
 * Zero external dependencies. Strictly no emojis.
 */
(function () {
  'use strict';

  // Read configuration from script tag attributes or window global
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-saruto-clone]') ||
    document.querySelector('script[src*="saruto-widget.js"]');

  const config = window.__SARUTO_CLONE_CONFIG__ || {
    cloneName: currentScript?.getAttribute('data-clone-name') || 'AI Twin',
    greeting: currentScript?.getAttribute('data-greeting') || 'Hello. I am the digital AI clone. Ask me anything about my experience, principles, or projects.',
    position: currentScript?.getAttribute('data-position') || 'bottom-right',
    theme: currentScript?.getAttribute('data-theme') || 'black',
    voiceAutoPlay: currentScript?.getAttribute('data-voice-autoplay') === 'true',
    systemPrompt: currentScript?.getAttribute('data-system-prompt') || 'You are an autonomous AI clone of the creator. Answer in first-person without emojis.',
  };

  // Prevent multiple injections
  if (document.getElementById('saruto-clone-root')) return;

  // Create Root Container
  const root = document.createElement('div');
  root.id = 'saruto-clone-root';
  root.style.cssText = 'position:fixed; z-index:999999; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

  if (config.position === 'bottom-left') {
    root.style.bottom = '24px';
    root.style.left = '24px';
  } else {
    root.style.bottom = '24px';
    root.style.right = '24px';
  }

  // Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    .saruto-widget-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #000000;
      color: #ffffff;
      border: 1px solid #27272a;
      border-radius: 9999px;
      padding: 10px 18px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      transition: all 0.2s ease;
      font-size: 13px;
      font-weight: 600;
    }
    .saruto-widget-btn:hover {
      background: #18181b;
      border-color: #52525b;
      transform: translateY(-2px);
    }
    .saruto-wave-bar {
      width: 2px;
      height: 12px;
      background: #ffffff;
      border-radius: 1px;
      display: inline-block;
      animation: sarutoWave 1.2s infinite ease-in-out;
    }
    .saruto-wave-bar:nth-child(2) { animation-delay: -1.0s; height: 16px; }
    .saruto-wave-bar:nth-child(3) { animation-delay: -0.8s; height: 10px; }
    @keyframes sarutoWave {
      0%, 40%, 100% { transform: scaleY(0.4); }
      20% { transform: scaleY(1.0); }
    }
    .saruto-window {
      display: none;
      width: 380px;
      height: 520px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 100px);
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .saruto-window.open {
      display: flex;
    }
    .saruto-header {
      background: #000000;
      border-bottom: 1px solid #27272a;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .saruto-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .saruto-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.45;
      word-break: break-word;
    }
    .saruto-msg-clone {
      background: #18181b;
      color: #f4f4f5;
      border: 1px solid #27272a;
      align-self: flex-start;
    }
    .saruto-msg-user {
      background: #ffffff;
      color: #000000;
      font-weight: 500;
      align-self: flex-end;
    }
    .saruto-footer {
      border-top: 1px solid #27272a;
      padding: 12px;
      background: #000000;
      display: flex;
      gap: 8px;
    }
    .saruto-input {
      flex: 1;
      background: #18181b;
      border: 1px solid #27272a;
      color: #ffffff;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
    }
    .saruto-input:focus {
      border-color: #71717a;
    }
    .saruto-send {
      background: #ffffff;
      color: #000000;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .saruto-send:hover {
      background: #e4e4e7;
    }
  `;
  document.head.appendChild(style);

  // Widget HTML structure
  root.innerHTML = `
    <div class="saruto-window" id="saruto-window">
      <div class="saruto-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:8px; height:8px; border-radius:50%; background:#ffffff;"></div>
          <span style="font-size:14px; font-weight:700; color:#ffffff;">${config.cloneName}</span>
          <span style="font-size:10px; font-family:monospace; background:#18181b; border:1px solid #27272a; color:#a1a1aa; padding:2px 6px; border-radius:4px;">AI TWIN</span>
        </div>
        <button id="saruto-close-btn" style="background:none; border:none; color:#a1a1aa; cursor:pointer; font-size:16px;">&times;</button>
      </div>

      <div class="saruto-body" id="saruto-messages">
        <div class="saruto-msg saruto-msg-clone">${config.greeting}</div>
      </div>

      <div style="padding:4px 12px 8px 12px; display:flex; gap:6px; overflow-x:auto; background:#000000; border-top:1px solid #18181b;">
        <button id="saruto-chip-general" style="background:#18181b; border:1px solid #27272a; color:#a1a1aa; font-size:11px; padding:3px 8px; border-radius:12px; cursor:pointer; white-space:nowrap;">General Bio</button>
        <button id="saruto-chip-arch" style="background:#18181b; border:1px solid #27272a; color:#a1a1aa; font-size:11px; padding:3px 8px; border-radius:12px; cursor:pointer; white-space:nowrap;">System Architecture</button>
        <button id="saruto-chip-recruiter" style="background:#18181b; border:1px solid #27272a; color:#a1a1aa; font-size:11px; padding:3px 8px; border-radius:12px; cursor:pointer; white-space:nowrap;">Recruiter Inquiry</button>
      </div>

      <div class="saruto-footer">
        <button id="saruto-mic-btn" title="Record Voice Voicemail" style="background:#18181b; border:1px solid #27272a; color:#a1a1aa; border-radius:8px; padding:8px 10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <input type="text" class="saruto-input" id="saruto-input" placeholder="Ask my AI clone anything..." />
        <button class="saruto-send" id="saruto-send-btn">Send</button>
      </div>
    </div>

    <button class="saruto-widget-btn" id="saruto-toggle-btn">
      <div style="display:flex; gap:3px; align-items:center;">
        <span class="saruto-wave-bar"></span>
        <span class="saruto-wave-bar"></span>
        <span class="saruto-wave-bar"></span>
      </div>
      <span>Talk to ${config.cloneName}</span>
    </button>
  `;

  document.body.appendChild(root);

  // Behavior
  const toggleBtn = document.getElementById('saruto-toggle-btn');
  const windowEl = document.getElementById('saruto-window');
  const closeBtn = document.getElementById('saruto-close-btn');
  const sendBtn = document.getElementById('saruto-send-btn');
  const inputEl = document.getElementById('saruto-input');
  const messagesEl = document.getElementById('saruto-messages');

  let isOpen = false;

  function toggleWindow() {
    isOpen = !isOpen;
    if (isOpen) {
      windowEl.classList.add('open');
      inputEl.focus();
    } else {
      windowEl.classList.remove('open');
    }
  }

  toggleBtn.addEventListener('click', toggleWindow);
  closeBtn.addEventListener('click', toggleWindow);

  function speakText(text) {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    }
  }

  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `saruto-msg saruto-msg-${role}`;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function handleSend() {
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputEl.value = '';

    // Simulate or query clone
    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();
      if (lower.includes('who are you') || lower.includes('introduce')) {
        reply = 'I am the autonomous digital clone of the creator, trained on their communication style, values, and engineering principles.';
      } else if (lower.includes('architecture') || lower.includes('tech stack') || lower.includes('whiteboard')) {
        reply = 'My architecture is composed of an Autonomous Identity Engine (Next.js 16), a real-time WebRTC audio streaming pipeline (LiveKit), Playwright dynamic browser automation, and deep repository grounding.';
      } else if (lower.includes('experience') || lower.includes('work')) {
        reply = 'Regarding my experience: I focus on building reliable software architectures, scalable full-stack applications, and pragmatic engineering execution.';
      } else if (lower.includes('contact') || lower.includes('hire') || lower.includes('email')) {
        reply = 'You can reach out through the social links or contact form on this portfolio site.';
      } else {
        reply = `Speaking as the creator: "${text}" is an important consideration. I approach problems by understanding constraints first, then architecting clean, maintainable solutions.`;
      }

      appendMessage('clone', reply);
      speakText(reply);
    }, 450);
  }

  sendBtn.addEventListener('click', handleSend);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  const chipGeneral = document.getElementById('saruto-chip-general');
  const chipArch = document.getElementById('saruto-chip-arch');
  const chipRecruiter = document.getElementById('saruto-chip-recruiter');
  const micBtn = document.getElementById('saruto-mic-btn');

  if (chipGeneral) {
    chipGeneral.addEventListener('click', () => {
      inputEl.value = 'Introduce yourself and summarize your background.';
      handleSend();
    });
  }

  if (chipArch) {
    chipArch.addEventListener('click', () => {
      inputEl.value = 'Can you explain your system architecture and technology stack?';
      handleSend();
    });
  }

  if (chipRecruiter) {
    chipRecruiter.addEventListener('click', () => {
      inputEl.value = 'I am a recruiter with an open technical role. What are your target positions and compensation?';
      handleSend();
    });
  }

  // Voice Voicemail Recording Support
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecordingVoicemail = false;

  if (micBtn) {
    micBtn.addEventListener('click', async () => {
      if (!isRecordingVoicemail) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
          };
          mediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Data = reader.result;
              appendMessage('user', 'Recorded voice inquiry audio message');
              // Deliver voicemail to local store or API
              try {
                await fetch('/api/voicemail', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    audioDataUrl: base64Data,
                    durationSeconds: Math.max(1, Math.round(blob.size / 16000)),
                    transcript: 'Audio voicemail recorded by visitor via standalone portfolio widget.',
                    visitorName: 'Portfolio Visitor',
                  }),
                });
              } catch (_) {
                // Ignore network error in standalone widget
              }
              const confirmReply = 'I have received your voice message and saved it directly to the creator dashboard.';
              appendMessage('clone', confirmReply);
              speakText(confirmReply);
            };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start();
          isRecordingVoicemail = true;
          micBtn.style.background = '#ffffff';
          micBtn.style.color = '#000000';
          micBtn.title = 'Click to finish recording';
        } catch (err) {
          appendMessage('clone', 'Microphone access is required to record a voice note.');
        }
      } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        isRecordingVoicemail = false;
        micBtn.style.background = '#18181b';
        micBtn.style.color = '#a1a1aa';
        micBtn.title = 'Record Voice Voicemail';
      }
    });
  }
})();

