import { SocialLink, PersonalityQuestion } from './clone-store'

export interface PlaywrightWalkthroughStep {
  title: string
  action: string
  selector: string
  narration: string
  scrollOffset: number
  highlightText?: string
}

export interface PlaywrightTourResult {
  isProfileQuery: boolean
  queryCategory?: 'experience' | 'education' | 'projects' | 'general'
  targetPlatform?: string
  targetUrl?: string
  playwrightCode?: string
  narrationText?: string
  walkthroughSteps?: PlaywrightWalkthroughStep[]
}

export const PlaywrightService = {
  detectProfileQuery(userQuery: string): {
    isProfileQuery: boolean
    category: 'experience' | 'education' | 'projects' | 'general'
    platformHint?: string
  } {
    const q = userQuery.toLowerCase().trim()

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
      q.includes('tour')

    if (!hasProfileIntent) {
      return { isProfileQuery: false, category: 'general' }
    }

    let category: 'experience' | 'education' | 'projects' | 'general' = 'general'
    if (q.includes('experience') || q.includes('job') || q.includes('work history') || q.includes('career')) {
      category = 'experience'
    } else if (q.includes('education') || q.includes('degree') || q.includes('college') || q.includes('university') || q.includes('school')) {
      category = 'education'
    } else if (q.includes('project') || q.includes('repository') || q.includes('repo') || q.includes('portfolio') || q.includes('code')) {
      category = 'projects'
    }

    let platformHint: string | undefined = undefined
    if (q.includes('linkedin')) platformHint = 'linkedin'
    else if (q.includes('github')) platformHint = 'github'
    else if (q.includes('twitter') || q.includes(' x ')) platformHint = 'twitter'

    return { isProfileQuery: true, category, platformHint }
  },

  generateDynamicPlaywrightScript(params: {
    userName: string
    targetUrl: string
    platform: string
    category: 'experience' | 'education' | 'projects' | 'general'
    relevantAnswers: PersonalityQuestion[]
  }): {
    code: string
    narration: string
    steps: PlaywrightWalkthroughStep[]
  } {
    const { userName, targetUrl, platform, category, relevantAnswers } = params
    const safeUrl = targetUrl || 'https://linkedin.com'

    // Extract personalized details from clone's personality answers
    const workAnswer =
      relevantAnswers.find((a) => a.category === 'work')?.answer ||
      'Focusing on high-impact scalable architectures and pragmatic delivery.'
    const identityAnswer =
      relevantAnswers.find((a) => a.category === 'identity')?.answer ||
      'Passionate technologist building autonomous software systems.'
    const educationSnippet =
      relevantAnswers.find((a) => a.question.toLowerCase().includes('education') || a.answer.toLowerCase().includes('degree'))?.answer ||
      'Continuous learner with strong foundational computer science grounding.'

    let narration = ''
    let steps: PlaywrightWalkthroughStep[] = []
    let scriptActions = ''

    if (platform === 'linkedin') {
      if (category === 'experience') {
        narration = `Let me open my LinkedIn profile and walk you through my career experience. Navigating down to the experience section... You can see my core roles where I specialize in architecture and systems. As I always say: "${workAnswer.substring(0, 110)}".`
        steps = [
          {
            title: 'Profile Landing',
            action: 'Navigate to LinkedIn Profile Header',
            selector: 'div.top-card-layout',
            narration: `Here is my verified profile overview for ${userName}.`,
            scrollOffset: 0,
            highlightText: userName,
          },
          {
            title: 'Experience Section',
            action: 'Smooth Scroll to Experience Timeline',
            selector: 'section#experience-section, div[data-section="experience"]',
            narration: `Scrolling down into my Experience timeline. Here are my key technical achievements and roles.`,
            scrollOffset: 650,
            highlightText: 'Professional Experience & Engineering Leadership',
          },
          {
            title: 'Role Highlights',
            action: 'Inspect Position Responsibilities and Core Impact',
            selector: 'li.experience-item',
            narration: `Examining technical milestones: ${workAnswer.substring(0, 90)}...`,
            scrollOffset: 920,
            highlightText: workAnswer.substring(0, 80),
          },
        ]
        scriptActions = `  // 1. Navigate to LinkedIn profile
  await page.goto('${safeUrl}', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 2. Scroll to Experience Section
  const experienceSection = page.locator('section#experience-section, [data-section="experience"], div:has-text("Experience")').first();
  await experienceSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  // 3. Highlight role accomplishments
  await page.evaluate(() => {
    window.scrollBy({ top: 400, behavior: 'smooth' });
  });
  await page.screenshot({ path: 'linkedin_experience_walkthrough.png', fullPage: false });`
      } else if (category === 'education') {
        narration = `Let me navigate to my Education credentials on LinkedIn. Scrolling directly past the header down to the education section. Here are my academic foundations and degrees: "${educationSnippet.substring(0, 110)}".`
        steps = [
          {
            title: 'Profile Header',
            action: 'Access Profile Details',
            selector: 'div.top-card-layout',
            narration: `Connecting to ${userName}'s profile page.`,
            scrollOffset: 0,
          },
          {
            title: 'Education Section',
            action: 'Scroll to Education & Certifications',
            selector: 'section#education-section, [data-section="education"]',
            narration: `Scrolling into Education credentials and certifications.`,
            scrollOffset: 1200,
            highlightText: 'Academic Qualifications & Continuous Learning',
          },
          {
            title: 'Degree Details',
            action: 'Inspect Focus Areas',
            selector: 'div.education-item',
            narration: educationSnippet.substring(0, 90),
            scrollOffset: 1450,
          },
        ]
        scriptActions = `  // 1. Navigate to LinkedIn Profile
  await page.goto('${safeUrl}', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 2. Locate and scroll smoothly to Education section
  const educationSection = page.locator('section#education-section, [data-section="education"], div:has-text("Education")').first();
  await educationSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  // 3. Capture education frame
  await page.screenshot({ path: 'linkedin_education_walkthrough.png' });`
      } else {
        narration = `Opening my LinkedIn profile to give you a complete visual tour. Starting from my headline: "${identityAnswer.substring(0, 90)}", scrolling through my featured work, and highlighting my background.`
        steps = [
          {
            title: 'Profile Header & Headline',
            action: 'Display Profile Card',
            selector: 'div.top-card-layout',
            narration: `Headline and summary for ${userName}.`,
            scrollOffset: 0,
            highlightText: identityAnswer.substring(0, 70),
          },
          {
            title: 'Featured & Experience',
            action: 'Scroll through Career Highlights',
            selector: 'section#experience-section',
            narration: `Reviewing technical background and career trajectory.`,
            scrollOffset: 700,
            highlightText: workAnswer.substring(0, 70),
          },
        ]
        scriptActions = `  await page.goto('${safeUrl}', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
  await page.screenshot({ path: 'linkedin_overview_walkthrough.png' });`
      }
    } else if (platform === 'github') {
      narration = `Let me open my GitHub profile and showcase my open-source code and projects. Navigating to ${safeUrl}... Scrolling through my pinned repositories and contribution activity.`
      steps = [
        {
          title: 'GitHub Bio & Pinned Repos',
          action: 'Navigate to GitHub User Overview',
          selector: 'div.js-pinned-items-reorder-container',
          narration: `Here are my top pinned repositories, source code libraries, and active contributions.`,
          scrollOffset: 250,
          highlightText: 'Pinned Repositories & Engineering Work',
        },
        {
          title: 'Repository Code & Readme',
          action: 'Inspect Architecture & Commits',
          selector: 'ol.pinned-items-list',
          narration: `Focusing on codebase modularity and architecture standards.`,
          scrollOffset: 550,
          highlightText: workAnswer.substring(0, 80),
        },
      ]
      scriptActions = `  // 1. Navigate to GitHub Profile
  await page.goto('${safeUrl}', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.pinned-item-list-item, .UnderlineNav', { timeout: 10000 });

  // 2. Scroll to Pinned Repositories
  const pinnedRepos = page.locator('.js-pinned-items-reorder-container');
  await pinnedRepos.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  // 3. Highlight commit activity
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.screenshot({ path: 'github_projects_walkthrough.png' });`
    } else {
      // General Portfolio / External Site
      narration = `Opening my portfolio site at ${safeUrl}. Let me scroll through my background and demonstrate my work.`
      steps = [
        {
          title: 'Hero & Introduction',
          action: 'Open Web Portfolio',
          selector: 'header, h1',
          narration: `Landing on personal portfolio for ${userName}.`,
          scrollOffset: 0,
        },
        {
          title: 'Projects & Work',
          action: 'Scroll to Portfolio Showcase',
          selector: '#projects, section.projects',
          narration: `Highlighting featured work and engineering accomplishments.`,
          scrollOffset: 600,
          highlightText: workAnswer.substring(0, 80),
        },
      ]
      scriptActions = `  // 1. Open Personal Portfolio
  await page.goto('${safeUrl}', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 2. Auto-scroll through showcase
  await page.evaluate(() => {
    window.scrollBy({ top: 500, behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'portfolio_walkthrough.png' });`
    }

    const code = `// Autonomous Playwright Profile Tour Script
// Generated dynamically for: ${userName}
// Target URL: ${safeUrl}
// Category: ${category.toUpperCase()}

import { chromium } from 'playwright';

(async () => {
  // Launch browser with realistic viewport
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

${scriptActions}

  await browser.close();
  console.log('Playwright profile tour completed successfully.');
})();`

    return { code, narration, steps }
  },

  async processQueryForProfileTour(
    userQuery: string,
    socialLinks: SocialLink[],
    personalityData: PersonalityQuestion[],
    userName: string = 'The Creator'
  ): Promise<PlaywrightTourResult> {
    const detection = this.detectProfileQuery(userQuery)

    // Strict rule: If user did NOT ask about profile/experience/projects/education, do NOT generate code
    if (!detection.isProfileQuery) {
      return { isProfileQuery: false }
    }

    // Determine target platform & link
    let chosenLink: SocialLink | undefined

    if (detection.platformHint) {
      chosenLink = socialLinks.find((l) => l.platform.toLowerCase() === detection.platformHint)
    }

    if (!chosenLink) {
      if (detection.category === 'projects') {
        chosenLink =
          socialLinks.find((l) => l.platform === 'github') ||
          socialLinks.find((l) => l.platform === 'website') ||
          socialLinks[0]
      } else {
        chosenLink =
          socialLinks.find((l) => l.platform === 'linkedin') ||
          socialLinks.find((l) => l.platform === 'website') ||
          socialLinks[0]
      }
    }

    const platform = chosenLink?.platform || 'linkedin'
    const targetUrl = chosenLink?.url || `https://${platform}.com`

    const { code, narration, steps } = this.generateDynamicPlaywrightScript({
      userName,
      targetUrl,
      platform,
      category: detection.category,
      relevantAnswers: personalityData,
    })

    return {
      isProfileQuery: true,
      queryCategory: detection.category,
      targetPlatform: platform,
      targetUrl,
      playwrightCode: code,
      narrationText: narration,
      walkthroughSteps: steps,
    }
  },
}

