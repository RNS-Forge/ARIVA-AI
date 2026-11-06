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

      <div class="saruto-footer">
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
})();

