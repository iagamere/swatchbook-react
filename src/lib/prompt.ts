import type { Comp } from '../data'
export type PF = { name: string; content: string }
export const MODES = ['Add a single component', 'Add multiple components', 'Apply a visual theme', 'Build a complete UI style package']
export function analyze(f: PF[]) {
  const t = f.map(x => x.content).join('\n'), n = f.map(x => x.name).join(' ')
  let fw = f.length ? 'Plain HTML/CSS/JS (no framework detected)' : 'Unknown'
  if (/"next"/.test(t)) fw = 'Next.js'; else if (/"react"/.test(t)) fw = 'React'; else if (/"vue"/.test(t)) fw = 'Vue'; else if (/"svelte"/.test(t)) fw = 'Svelte'; else if (/"@angular/.test(t)) fw = 'Angular'
  let css = 'Plain CSS'
  if (/tailwind/.test(t + n)) css = 'Tailwind CSS'; else if (/\.scss/.test(n)) css = 'Sass/SCSS'; else if (/styled-components|@emotion/.test(t)) css = 'CSS-in-JS'
  const tokens = [...new Set(t.match(/--[a-z0-9-]+(?=\s*:)/gi) || [])].slice(0, 20)
  return { fw, css, tokens, names: f.map(x => x.name) }
}
export function buildPrompt(cs: Comp[], mode: string, desc: string, a: ReturnType<typeof analyze>) {
  return `You are integrating UI components from the Swatchbook library into my existing project.
Integration mode: ${mode}

Project analysis (from files I supplied):
- Framework: ${a.fw}
- Styling: ${a.css}
- Design tokens found: ${a.tokens.join(', ') || 'none detected'}
- Files analyzed: ${a.names.slice(0, 20).join(', ') || 'none; inspect the project yourself'}
${desc ? '- My description: ' + desc + '\n' : ''}
Components (source in components/<id>/ of the attached package):
${cs.map(c => `- ${c.id}: ${c.name} (${c.cat}; ${c.fw}; license ${c.license}; ${c.author})`).join('\n')}

Please:
1. Read and understand the existing project before changing anything. Do not assume React or Tailwind.
2. Identify the correct locations for the new components and styles.
3. Adapt the components to the project's framework and conventions.
4. Preserve all existing functionality.
5. Match the existing design system and tokens where appropriate.
6. Avoid duplicate CSS and conflicting selectors (scope or rename classes).
7. Add dependencies only when strictly necessary.
8. Make every component responsive.
9. Preserve accessibility: labels, focus states, keyboard use, reduced motion.
10. Run or review the build/tests, fix errors, then summarize the changes.`
}
