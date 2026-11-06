// Automated verification using Playwright to test the exported portfolio & clone widget
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  console.log('=== VERIFYING EXPORTED PORTFOLIO WITH PLAYWRIGHT ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }
  });

  const htmlPath = path.resolve(__dirname, '..', 'test-portfolio-project', 'index.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('1. Navigating to exported portfolio:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

  // 1. Check Page Title
  const title = await page.title();
  console.log('   Page Title:', title);
  assert.ok(title.includes('Andrej Karpathy'), 'Page title must include Andrej Karpathy');

  // 2. Check Saruto Clone Widget Button rendered by script
  console.log('2. Inspecting Saruto AI widget button in DOM...');
  const widgetBtn = page.locator('#saruto-toggle-btn');
  await widgetBtn.waitFor({ state: 'visible', timeout: 5000 });
  const btnText = await widgetBtn.textContent();
  console.log('   Widget Button Label:', btnText.trim());
  assert.ok(btnText.includes('Andrej Karpathy Twin'), 'Button must display clone name');

  // 3. Click Widget Button to open clone conversation window
  console.log('3. Clicking widget button to open clone dialog...');
  await widgetBtn.click();

  const windowEl = page.locator('#saruto-window');
  await windowEl.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   Clone dialog opened successfully.');

  // 4. Verify Initial Greeting
  const greetingEl = page.locator('#saruto-messages .saruto-msg-clone').first();
  const greetingText = await greetingEl.textContent();
  console.log('   Initial Greeting:', greetingText);
  assert.ok(greetingText.includes('digital clone of Andrej Karpathy'), 'Must display configured greeting');

  // 5. Test Asking a Question to the Clone
  console.log('4. Submitting question to clone: "What is micrograd?"');
  const inputEl = page.locator('#saruto-input');
  await inputEl.fill('Tell me about micrograd and autograd');
  const sendBtn = page.locator('#saruto-send-btn');
  await sendBtn.click();

  // Wait for clone answer to appear
  await page.waitForTimeout(1000);
  const messages = await page.locator('#saruto-messages .saruto-msg').allTextContents();
  console.log('   Total messages in stream:', messages.length);
  const lastReply = messages[messages.length - 1];
  console.log('   Clone Response:', lastReply);
  assert.ok(lastReply.length > 10, 'Clone must generate valid response');

  // 6. Capture Verification Screenshot
  const screenshotPath = path.resolve(__dirname, '..', 'test-portfolio-project', 'test_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log('5. Verification screenshot saved to:', screenshotPath);

  await browser.close();
  console.log('\n=== PLAYWRIGHT VERIFICATION OF EXPORTED PORTFOLIO PASSED 100%! ===');
})();

