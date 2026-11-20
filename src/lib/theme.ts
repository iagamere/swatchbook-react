export const theme0 = { p: '#6366f1', s: '#8b5cf6', bg: '#0f172a', tx: '#e2e8f0', r: 12, sh: 1, font: 'system-ui', sp: 8, anim: 1 }
export type Theme = typeof theme0
export const tcss = (t: Theme) => `:root {
  --primary-color: ${t.p};
  --secondary-color: ${t.s};
  --background-color: ${t.bg};
  --surface-color: color-mix(in srgb, ${t.bg} 85%, white);
  --text-color: ${t.tx};
  --border-radius: ${t.r}px;
  --shadow: ${t.sh ? '0 8px 24px rgb(0 0 0 / .3)' : 'none'};
  --font-family: ${t.font};
  --space: ${t.sp}px;
  --transition: ${t.anim ? '.25s ease' : '0s'};
}`
export const themeDoc = (t: Theme) => `<style>${tcss(t)}body{margin:0;display:grid;place-items:center;height:100vh;background:var(--background-color);color:var(--text-color);font-family:var(--font-family)}.c{background:var(--surface-color);padding:calc(var(--space)*2);border-radius:var(--border-radius);box-shadow:var(--shadow);display:grid;gap:var(--space);width:200px}button{background:var(--primary-color);color:#fff;border:0;padding:var(--space) calc(var(--space)*2);border-radius:var(--border-radius);transition:var(--transition);font:inherit}button:hover{background:var(--secondary-color)}input{padding:var(--space);border-radius:var(--border-radius);border:1px solid var(--secondary-color);background:transparent;color:inherit}</style><div class=c><b>Preview card</b><input placeholder=Input><button>Primary action</button></div>`
