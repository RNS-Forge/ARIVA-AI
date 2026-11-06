# Agent.md

Fixed rules for every project. Read this file fully before you write any code.

These rules apply to all work: new features, fixes, changes to old code, and docs. If a project has its own rules, follow both. If they clash, the project rule wins for that project only.

---

## 0. Hard Rules (Never Break)

1. No emoji anywhere in the project. This covers UI text, code, comments, logs, commit messages, docs, README files, and file names. Use SVG icons from one icon set instead.
2. Use only simple, common English. Short sentences. Plain words.
3. Ship production-ready code only. No placeholders, no dummy data, no half-done work.
4. The code must run without errors. Never say "done" before you have run it.
5. Never copy another website. Study it, learn from it, then build something better.
6. Get clear context before you work. Never guess about a project you have not read.

---

## 1. How to Work

### Before you start
- Read the project first: README, folder structure, package files, config files, and the files you will change.
- Know what the project does, who uses it, and why this task is needed.
- Find the patterns already in use (naming, folders, styling, state, API calls). Follow them.
- Plan the logic in a few lines before you code. Know the inputs, the outputs, and the edge cases.
- If something is unclear and it blocks the work, ask one short, clear question. If it does not block the work, pick the best option and say what you chose.

### While you work
- Give the task your full skill and full focus. Do not do the minimum.
- Reuse existing components, hooks, and helpers before you create new ones.
- Keep each function small and focused on one job.
- Have a clear idea of how the whole thing fits together, then build it step by step.
- Do not leave TODO notes, dead code, or commented-out code in the final result.

### Before you finish
- Run the type check, lint, build, and tests. Fix every error and warning.
- Run the app. Test the main flow and the edge cases.
- Read your own changes once, line by line, as if you were a reviewer.
- Check the Definition of Done list at the end of this file.

---

## 2. Language and Communication

- Use simple common English everywhere: replies, UI text, code comments, docs, and commit messages.
- Write short sentences. Use plain words. Avoid fancy or hard words.
- UI text says exactly what will happen. Use "Save changes", not "Submit". Keep the same name for the same action across the whole product.
- Error messages say what went wrong and how to fix it. They do not blame the user and they are never vague.
- Empty screens tell the user what to do next.
- Comments explain why, not what.
- Commit messages are short and plain. Example: "Add login form validation".
- When you reply, be brief and direct: what you changed, which files, how to run or test it, and any open point.

---

## 3. Code Quality

### Production ready
- Write every line as if it will go live today.
- No console.log leftovers, no test data, no hardcoded secrets or URLs. Use environment variables and config files.
- No broken imports, no unused variables, no ignored warnings.

### Error free
- Handle empty values, null values, bad input, slow networks, and failed API calls.
- Validate input at the edges: forms, API requests, and file uploads.
- Never hide an error. Show a clear message to the user and log useful details for the developer.
- Test on the real flow. If you could not test something, say so clearly.

### Feasible and reliable
- Pick the simplest solution that fully solves the problem. Do not over-build.
- Use proven, well-maintained libraries. Add a new package only when it clearly saves time.
- Use timeouts and retries for network calls where it makes sense.
- Use safe defaults. Make sure one failure does not break the whole page or service.

### Reusable
- Build small components and functions with clear inputs.
- One source of truth for each piece of data, style, or setting. No copy and paste.
- Put colors, spacing, fonts, and motion values in design tokens (CSS variables or a theme file).
- Use clear folder names and one job per file. Use types (TypeScript or type hints) when the language supports them.

### Fast, with minimum waiting time
- Load only what the page needs. Split code by route. Lazy load heavy parts and images below the fold.
- Compress and resize images. Use modern formats like WebP or AVIF.
- Use caching, debounce, and pagination where they help.
- Show a skeleton or a clear loading state, never a blank wait.
- Keep bundles small. Measure before you tune.

### Security basics
- Check auth on the server, not only in the UI.
- Clean all user input. Use safe database queries.
- Never put secrets in client code or in the repo.

---

## 4. UI Design

The goal: a professional, rich, clean UI that looks like it was made by a good design team, not by a template and not by AI.

### Start with a short design plan
Before you write UI code, write a small plan:
- Colors: 4 to 6 named values.
- Type: the fonts and the role of each.
- Layout: the main idea for the page structure.
- Main idea: what makes this design different from the usual one.

Then check the plan. If any part looks like the default you would use for any website, change it. Choose things that fit this project's subject and users.

### Look and feel
- Professional and rich: strong layout grid, good spacing, clear type scale, real depth through light, layers, and detail.
- Pick fonts with care, not the same default font for every project. Use one or two families. If two, make them clearly different.
- Keep lines of text under 80 characters wide.
- Use a calm, limited color palette with one strong brand color. Keep contrast readable (WCAG AA at minimum).
- Use real, specific content. No lorem ipsum. No filler lines.
- Use one icon style across the product. SVG only. No emoji.
- Give each section its own layout idea. Do not repeat the same card grid again and again.
- Spend your boldness in one place. Let one part of the page be the memorable moment. Keep the rest quiet and clean.
- Every page gets the same high quality. No page is left plain or half-made.

### Do not look AI-made
Avoid these common signs of a generated site:
- Purple-to-blue gradients, glowing blobs, and gradient text on every heading.
- The same hero every time: big centered headline, two buttons, three feature cards.
- Many identical rounded cards with the same soft shadow.
- Too many frosted glass effects, neon glows, and floating shapes.
- Empty marketing words like "seamless", "revolutionary", "unlock the power", "next-gen".
- One word in a headline in a different color or italic just for style.
- All-caps small labels above every heading. Numbered markers (01, 02, 03) when the content is not a real sequence.
- Default component library look with no changes made.
- Layouts that are perfectly even and have no point of view.

### Use references the right way
- Look at top professional websites and products for ideas: layout, spacing, type, and motion.
- Learn why they work. Then create your own version that is better and fits this project.
- Never copy their layout, text, colors, or images.

### Component states
Every component needs all its states: default, hover, focus, active, disabled, loading, empty, error, and success.

### Responsive and accessible
- Build mobile first. Test at 360, 768, 1024, and 1440 pixels wide.
- Use semantic HTML, keyboard support, visible focus rings, alt text for images, and proper labels for forms.

---

## 5. Animation

Animation is part of the product, not an extra. Use it on the whole website. It must feel smooth, professional, and have a purpose.

### What to animate
- Components: buttons, links, cards, inputs, menus, modals, drawers, tabs, accordions, toasts, and loaders all have clear motion on hover, focus, press, open, and close.
- Page load: one well planned entry sequence for the first screen.
- Scroll based: reveal on scroll, scroll-linked movement, sticky sections that change as you scroll, progress bars, number counters, and gentle parallax where it fits.
- Screen based: smooth page and route transitions, layout changes, and motion that adapts to the screen size. Keep it lighter on mobile.
- Data and state: charts, lists, and status changes animate so the user can see what changed.

### How to make it innovative, not generic
- Do not use the same fade-and-slide-up on every section. Choose the motion that fits the content: reveal, mask, stagger, draw, morph, or scroll-linked scene.
- Make motion explain things: show direction, order, cause, and result.
- Plan the motion for the whole site first. Use the same timing and easing everywhere so it feels like one product.

### Rules for smooth motion
- Animate transform and opacity first. Avoid animating width, height, top, or left.
- Keep it at 60 frames per second. Test on a slow device.
- Typical timing: 150 to 250 ms for small actions, 400 to 700 ms for section reveals. Use soft ease-out curves.
- Use a good tool for the stack: CSS and IntersectionObserver for simple work, Framer Motion or GSAP with ScrollTrigger for rich work.
- Respect `prefers-reduced-motion`. Give a calm version for users who ask for it.
- Motion must never block the user. No long animations before content or actions are available.
- Clean up listeners and timelines when a component is removed.

---

## 6. Definition of Done

Check every item before you say the work is complete.

- [ ] No emoji anywhere in the changes.
- [ ] Simple, common English in all text and comments.
- [ ] Build, lint, type check, and tests pass with no errors.
- [ ] Browser console has no errors or warnings.
- [ ] Main flow and edge cases tested (empty, long text, bad input, slow network, small screen).
- [ ] UI is professional, clean, and does not look AI-made or copied.
- [ ] Components have animation, and scroll or screen animation is in place where it fits.
- [ ] Motion is smooth and reduced motion is respected.
- [ ] Works on mobile, tablet, and desktop.
- [ ] Code is reusable, has no dead code, no dummy data, and no secrets.
- [ ] Loading, empty, and error states are handled.
- [ ] Final reply is short and says what changed and how to run it.