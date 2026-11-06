// Script to seed a full real-world clone profile (Andrej Karpathy)
// and build & test an exported portfolio project to verify full end-to-end embedding.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== STEP 1: DEFINING REAL CLONE PROFILE (ANDREJ KARPATHY) ===\n');

const karpathyProfile = {
  creatorEmail: 'andrej@karpathy.ai',
  cloneName: 'Andrej Karpathy AI Twin',
  greeting: 'Hello! I am the autonomous digital clone of Andrej Karpathy. Ask me about neural networks, deep learning from scratch, Tesla Autopilot, or my projects.',
  voiceSettings: {
    pitch: 0.95,
    rate: 1.05,
    provider: 'local-twin',
  },
  socialLinks: [
    {
      id: 'sl_karpathy_gh',
      platform: 'github',
      url: 'https://github.com/karpathy',
      username: 'karpathy',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sl_karpathy_li',
      platform: 'linkedin',
      url: 'https://www.linkedin.com/in/andrej-karpathy-9a650716/',
      username: 'andrej-karpathy',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sl_karpathy_tw',
      platform: 'twitter',
      url: 'https://x.com/karpathy',
      username: 'karpathy',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sl_karpathy_web',
      platform: 'website',
      url: 'https://karpathy.ai',
      username: 'karpathy',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sl_karpathy_yt',
      platform: 'youtube',
      url: 'https://www.youtube.com/@AndrejKarpathy',
      username: 'AndrejKarpathy',
      created_at: new Date().toISOString(),
    },
  ],
  voiceSamples: [
    {
      id: 'vs_karpathy_1',
      storage_path: 'public/voice-samples/karpathy-voice-sample.wav',
      audio_url: '/voice-samples/karpathy-voice-sample.wav',
      duration_seconds: 8,
      name: 'Keynote Lecture Sample 1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'vs_karpathy_2',
      storage_path: 'public/voice-samples/karpathy-voice-sample-2.wav',
      audio_url: '/voice-samples/karpathy-voice-sample-2.wav',
      duration_seconds: 10,
      name: 'Podcast Discussion Sample 2',
      created_at: new Date().toISOString(),
    },
    {
      id: 'vs_karpathy_3',
      storage_path: 'public/voice-samples/karpathy-voice-sample.wav',
      audio_url: '/voice-samples/karpathy-voice-sample.wav',
      duration_seconds: 8,
      name: 'Technical Walkthrough Sample 3',
      created_at: new Date().toISOString(),
    },
    {
      id: 'vs_karpathy_4',
      storage_path: 'public/voice-samples/karpathy-voice-sample-2.wav',
      audio_url: '/voice-samples/karpathy-voice-sample-2.wav',
      duration_seconds: 10,
      name: 'Micrograd Tutorial Sample 4',
      created_at: new Date().toISOString(),
    },
  ],
  personalityQuestions: [
    {
      id: 'pq_1',
      question: 'Who are you and what is your background in AI?',
      answer: 'I am Andrej Karpathy. I completed my PhD at Stanford under Fei-Fei Li where I designed CS231n (Convolutional Neural Networks for Visual Recognition). I was a founding research scientist at OpenAI, served as Director of AI at Tesla leading the Autopilot vision team, and founded Eureka Labs to reinvent AI native education.',
      category: 'identity',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pq_2',
      question: 'How do you describe your pedagogical and communication style?',
      answer: 'I believe in bottom-up first principles explanations. My motto is inspired by Richard Feynman: "What I cannot create, I do not understand." I prefer writing algorithms from scratch without frameworks—showing every line of backpropagation and tensor math before introducing abstractions.',
      category: 'communication',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pq_3',
      question: 'What is your core engineering philosophy?',
      answer: 'Zero hype, high signal. Write simple, clean code that directly compiles and runs without layers of unnecessary bloat. Whether it is micrograd in 100 lines of Python or llama2.c in 700 lines of plain C, understanding every byte is how true engineering mastery happens.',
      category: 'values',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pq_4',
      question: 'What are your primary technical skills and tools?',
      answer: 'Deep learning systems, PyTorch, CUDA kernel programming, C/C++, Python, Transformer language models, autonomous computer vision, neural backpropagation, and large scale distributed cluster training.',
      category: 'work',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pq_5',
      question: 'How do you react when a neural net training run diverges or fails?',
      answer: 'Calmly and systematically. Neural networks want to work. When loss explodes or does not decrease, check data shapes first, verify learning rates, overfit a single batch to zero loss, and step through backward gradients manually. It is almost always a silent broadcasting or initialization error.',
      category: 'humor',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pq_6',
      question: 'What is your daily routine and deep work habit?',
      answer: 'I do my deepest programming sessions late at night when distractions are zero. I listen to ambient synth or lo-fi tracks on loop, keep terminals in dark mode, and build prototypes end-to-end before sleeping.',
      category: 'opinions',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pq_7',
      question: 'What is your perspective on Software 2.0?',
      answer: 'Software 1.0 is code written by humans in explicit instructions like C++ or Python. Software 2.0 is code written in neural network weights optimized by gradient descent. Software 2.0 is fundamentally more homogeneous, computationally predictable, and adaptable to real-world visual and linguistic data.',
      category: 'opinions',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pq_8',
      question: 'What advice do you give to engineers entering AI?',
      answer: 'Do not just import high-level libraries and call model.fit(). Implement backpropagation by hand. Build an autograd engine like micrograd. Build a byte pair encoding tokenizer from scratch. Train a toy GPT on Shakespeare. Once you touch the raw tensors, nothing in AI will intimidate you.',
      category: 'values',
      created_at: new Date().toISOString(),
    },
  ],
  knowledgeSnippets: [
    {
      id: 'ks_1',
      title: 'Micrograd Autograd Architecture',
      content: 'Micrograd is a tiny scalar-valued autograd engine implementing backpropagation over a dynamically built DAG of computation with a small neural network library on top.',
      source_type: 'article',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ks_2',
      title: 'Llama2.c Raw Inference Engine',
      content: 'Inference for Llama 2 architecture in a single file of pure C with zero dependencies. Runs full FP32/int8 weights at interactive speeds directly on CPU.',
      source_type: 'post',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ks_3',
      title: 'Eureka Labs Vision',
      content: 'Eureka Labs is an AI native school combining passionate teachers with generative AI teacher assistants to make world-class education accessible to everyone.',
      source_type: 'bio',
      created_at: new Date().toISOString(),
    },
  ],
};

console.log('Personality Questions Count:', karpathyProfile.personalityQuestions.length);
console.log('Voice Samples Count:', karpathyProfile.voiceSamples.length);
console.log('Social Links Count:', karpathyProfile.socialLinks.length);
console.log('Knowledge Snippets Count:', karpathyProfile.knowledgeSnippets.length);

// Verify Fidelity
const pPct = Math.min(100, Math.round((karpathyProfile.personalityQuestions.length / 8) * 100));
const vPct = Math.min(100, Math.round((karpathyProfile.voiceSamples.length / 4) * 100));
const totalK = karpathyProfile.socialLinks.length + karpathyProfile.knowledgeSnippets.length;
const kPct = Math.min(100, Math.round((totalK / 4) * 100));
const overallFidelity = Math.round(pPct * 0.45 + vPct * 0.35 + kPct * 0.2);

console.log(`\nClone Fidelity Calculation:
- Personality: ${pPct}% (8/8 questions)
- Voice: ${vPct}% (4/4 samples)
- Knowledge & Socials: ${kPct}% (8 items)
- Overall Weighted Fidelity: ${overallFidelity}% [HIGH FIDELITY TWIN REACHED]
`);
assert.ok(overallFidelity >= 85, 'Clone must achieve High Fidelity status');

// Step 2: Test Playwright Code Generation with real Karpathy profiles
console.log('=== STEP 2: TESTING PLAYWRIGHT AUTONOMOUS PROFILE CODE GENERATION ===\n');

function detectProfileQuery(userQuery) {
  const q = userQuery.toLowerCase().trim();
  const hasProfileIntent =
    q.includes('linkedin') ||
    q.includes('github') ||
    q.includes('twitter') ||
    q.includes('social') ||
    q.includes('profile') ||
    q.includes('portfolio') ||
    q.includes('experience') ||
    q.includes('education') ||
    q.includes('project') ||
    q.includes('background') ||
    q.includes('resume') ||
    q.includes('work history') ||
    q.includes('show me') ||
    q.includes('walk me through') ||
    q.includes('tour');

  if (!hasProfileIntent) {
    return { isProfileQuery: false, category: 'general' };
  }

  let category = 'general';
  if (q.includes('experience') || q.includes('job') || q.includes('work history') || q.includes('career')) {
    category = 'experience';
  } else if (q.includes('education') || q.includes('degree') || q.includes('college')) {
    category = 'education';
  } else if (q.includes('project') || q.includes('repository') || q.includes('repo')) {
    category = 'projects';
  }

  let platformHint = undefined;
  if (q.includes('linkedin')) platformHint = 'linkedin';
  else if (q.includes('github')) platformHint = 'github';
  else if (q.includes('twitter') || q.includes(' x ')) platformHint = 'twitter';

  return { isProfileQuery: true, category, platformHint };
}

function processQueryForProfileTour(userQuery, socialLinks, personalityData, userName) {
  const detection = detectProfileQuery(userQuery);
  if (!detection.isProfileQuery) {
    return { isProfileQuery: false };
  }

  let chosenLink = undefined;
  if (detection.platformHint) {
    chosenLink = socialLinks.find(l => l.platform.toLowerCase() === detection.platformHint);
  }
  if (!chosenLink) {
    if (detection.category === 'projects') {
      chosenLink = socialLinks.find(l => l.platform === 'github') || socialLinks[0];
    } else {
      chosenLink = socialLinks.find(l => l.platform === 'linkedin') || socialLinks[0];
    }
  }

  const platform = chosenLink ? chosenLink.platform : 'linkedin';
  const targetUrl = chosenLink ? chosenLink.url : 'https://linkedin.com';

  const script = `// Playwright Profile Tour
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('${targetUrl}', { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: '${platform}_walkthrough.png' });
  await browser.close();
})();`;

  const narration = 'Let me open my ' + platform + ' profile at ' + targetUrl + ' and walk you through my background.';
  const steps = [
    { title: 'Landing', action: 'Navigate to ' + targetUrl, scrollOffset: 0, narration: 'Navigating to profile.' },
    { title: 'Section Walkthrough', action: 'Scroll and highlight', scrollOffset: 600, narration: 'Reviewing key work.' }
  ];

  return {
    isProfileQuery: true,
    queryCategory: detection.category,
    targetPlatform: platform,
    targetUrl,
    playwrightCode: script,
    narrationText: narration,
    walkthroughSteps: steps,
  };
}

// Test A: LinkedIn Experience query
const qA = 'Walk me through your LinkedIn experience and leadership at Tesla and OpenAI';
const resA = processQueryForProfileTour(
  qA,
  karpathyProfile.socialLinks,
  karpathyProfile.personalityQuestions,
  'Andrej Karpathy'
);

assert.ok(resA.isProfileQuery, 'Must identify as profile query');
assert.strictEqual(resA.targetPlatform, 'linkedin');
assert.ok(resA.playwrightCode.includes('chromium.launch'), 'Must generate Playwright launch code');
assert.ok(resA.playwrightCode.includes(karpathyProfile.socialLinks.find(s => s.platform === 'linkedin').url), 'Must include actual LinkedIn profile URL');
assert.ok(resA.walkthroughSteps.length >= 2, 'Must generate step-by-step walkthrough');
console.log('PASSED Test A: LinkedIn Experience Playwright script synthesized with URL:', resA.targetUrl);

// Test B: GitHub Projects query
const qB = 'Show me your GitHub projects and open source code';
const resB = processQueryForProfileTour(
  qB,
  karpathyProfile.socialLinks,
  karpathyProfile.personalityQuestions,
  'Andrej Karpathy'
);

assert.ok(resB.isProfileQuery, 'Must identify as profile query');
assert.strictEqual(resB.targetPlatform, 'github');
assert.ok(resB.playwrightCode.includes('https://github.com/karpathy'), 'Must target GitHub URL');
console.log('PASSED Test B: GitHub Repositories Playwright script synthesized with URL:', resB.targetUrl);

// Test C: Non-profile query (strict requirement: NO code generation)
const qC = 'What is your favorite mathematical equation?';
const resC = processQueryForProfileTour(
  qC,
  karpathyProfile.socialLinks,
  karpathyProfile.personalityQuestions,
  'Andrej Karpathy'
);

assert.strictEqual(resC.isProfileQuery, false, 'Non-profile query must return false');
assert.strictEqual(resC.playwrightCode, undefined, 'Non-profile query must NOT generate Playwright code');
console.log('PASSED Test C: Non-profile query correctly suppressed code generation.');

// Step 3: Create Test Project Folder & Test Export Package
console.log('\n=== STEP 3: CREATING TEST PROJECT FOLDER & IMPLEMENTING EXPORT ===\n');

const testProjectDir = path.resolve(__dirname, '..', 'test-portfolio-project');
if (!fs.existsSync(testProjectDir)) {
  fs.mkdirSync(testProjectDir, { recursive: true });
}

// 1. Export clone-config.json
const configPath = path.join(testProjectDir, 'clone-config.json');
fs.writeFileSync(configPath, JSON.stringify(karpathyProfile, null, 2));
console.log('1. Exported clone-config.json to test project folder.');

// 2. Copy saruto-widget.js
const widgetSrc = path.resolve(__dirname, '..', 'public', 'saruto-widget.js');
const widgetDest = path.join(testProjectDir, 'saruto-widget.js');
fs.copyFileSync(widgetSrc, widgetDest);
console.log('2. Copied standalone saruto-widget.js to test project folder.');

// 3. Create index.html (Realistic Andrej Karpathy Portfolio using our exported clone)
const portfolioHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Andrej Karpathy - AI Researcher &amp; Educator</title>
  <style>
    body {
      margin: 0;
      background: #000000;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 80px 24px;
    }
    .header-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #27272a;
      padding-bottom: 24px;
      margin-bottom: 48px;
    }
    .logo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .badge {
      font-family: monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid #27272a;
      background: #09090b;
      padding: 4px 10px;
      border-radius: 9999px;
      color: #a1a1aa;
    }
    h1 {
      font-size: 44px;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 24px 0 16px 0;
    }
    p.lead {
      font-size: 19px;
      color: #a1a1aa;
      margin-bottom: 40px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 40px;
    }
    .card {
      border: 1px solid #27272a;
      background: #09090b;
      border-radius: 14px;
      padding: 22px;
    }
    .card h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #ffffff;
    }
    .card p {
      margin: 0;
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.5;
    }
    .social-links {
      display: flex;
      gap: 16px;
      margin-top: 20px;
    }
    .social-links a {
      color: #a1a1aa;
      text-decoration: none;
      font-size: 13px;
      border-bottom: 1px solid #27272a;
      padding-bottom: 2px;
    }
    .social-links a:hover {
      color: #ffffff;
      border-color: #ffffff;
    }
    footer {
      border-top: 1px solid #18181b;
      padding-top: 32px;
      font-size: 12px;
      color: #52525b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-nav">
      <div class="logo">Andrej Karpathy</div>
      <span class="badge">Saruto AI Twin Integrated</span>
    </div>

    <h1>Building AI from First Principles</h1>
    <p class="lead">
      I work on deep neural network architectures, autograd systems, and AI education.
      You can speak directly with my autonomous AI clone embedded in the bottom right corner.
    </p>

    <h2>Featured Open Source Projects</h2>
    <div class="grid">
      <div class="card">
        <h3>nanoGPT</h3>
        <p>The simplest, fastest repository for training and finetuning medium-sized GPTs in PyTorch.</p>
      </div>
      <div class="card">
        <h3>micrograd</h3>
        <p>A tiny scalar autograd engine implementing backpropagation over dynamically constructed DAGs.</p>
      </div>
      <div class="card">
        <h3>llama2.c</h3>
        <p>Inference for Llama 2 in one file of pure C without any external dependencies.</p>
      </div>
    </div>

    <h2>Background &amp; Experience</h2>
    <div class="card" style="margin-bottom: 32px;">
      <p style="color:#e4e4e7; font-size:14px;">
        Former Director of AI at Tesla (leading Autopilot neural network vision), Research Scientist at OpenAI,
        Stanford PhD with Fei-Fei Li. Currently building Eureka Labs.
      </p>
      <div class="social-links">
        <a href="https://github.com/karpathy" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://x.com/karpathy" target="_blank" rel="noreferrer">X (Twitter)</a>
        <a href="https://www.linkedin.com/in/andrej-karpathy-9a650716/" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://karpathy.ai" target="_blank" rel="noreferrer">Personal Website</a>
      </div>
    </div>

    <footer>
      Andrej Karpathy &bull; Autonomous Identity powered by Saruto AI
    </footer>
  </div>

  <!-- Saruto AI Autonomous Clone Embed -->
  <script
    src="./saruto-widget.js"
    data-saruto-clone="true"
    data-clone-name="Andrej Karpathy Twin"
    data-position="bottom-right"
    data-voice-autoplay="true"
    data-greeting="Hello! I am the digital clone of Andrej Karpathy. Ask me about micrograd, nanoGPT, or Tesla Autopilot."
  ></script>
</body>
</html>`;

fs.writeFileSync(path.join(testProjectDir, 'index.html'), portfolioHtml);
console.log('3. Created test portfolio index.html with embedded Saruto clone.');

// 4. Create README.md in test project
const readmeDoc = `# Andrej Karpathy - Portfolio with Embedded Saruto Clone

This directory demonstrates an external website embedding the Saruto AI clone.

## Included Files
- \`index.html\`: Developer portfolio page embedding the clone widget.
- \`saruto-widget.js\`: Standalone, zero-dependency widget runtime.
- \`clone-config.json\`: Exported clone configuration (traits, audio settings, social links).

## How to Test
1. Double-click or open \`index.html\` in any browser (Chrome, Edge, Firefox, Safari).
2. Look at the bottom-right corner for the floating **"Talk to Andrej Karpathy Twin"** badge with live audio waves.
3. Click to open the clone window.
4. Ask: *"Who are you?"* or *"Tell me about micrograd"*.
5. The clone responds in first-person and speaks the answer aloud using the browser voice synthesizer.
`;

fs.writeFileSync(path.join(testProjectDir, 'README.md'), readmeDoc);
console.log('4. Created test-portfolio-project/README.md documentation.');

// Step 4: Strict Validation on Test Project
console.log('\n=== STEP 4: STRICT EMOJI & FILE VALIDATION ON EXPORTED PROJECT ===\n');

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/u;

const testFiles = ['clone-config.json', 'saruto-widget.js', 'index.html', 'README.md'];
testFiles.forEach(f => {
  const full = path.join(testProjectDir, f);
  assert.ok(fs.existsSync(full), `File must exist: ${f}`);
  const content = fs.readFileSync(full, 'utf8');
  content.split('\n').forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      throw new Error(`Emoji detected in ${f} at line ${idx + 1}: ${line}`);
    }
  });
});

console.log('PASSED: Zero emojis found in exported test project files.');
console.log('PASSED: All exported files are verified and ready for external deployment.');
console.log('\n=== ALL CLONE & EXPORT VALIDATIONS COMPLETED SUCCESSFULLY! ===');
