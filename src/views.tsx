import { useState } from 'react'
import type { A } from './store'
import { Card, copy } from './parts'
import { zipFiles, compFiles, save, readZip } from './lib/zip'
import { tcss, themeDoc, Theme } from './lib/theme'
import { analyze, buildPrompt, MODES, PF } from './lib/prompt'

export function Collections({ A }: { A: A }) {
  const [name, setName] = useState('')
  const names = Object.keys(A.cols)
  const create = () => {
    const n = name.trim()
    if (!n) return A.toast('Enter a collection name')
    if (A.cols[n]) return A.toast('That name already exists')
    A.setCols({ ...A.cols, [n]: [] }); setName('')
  }
  return (
    <>
      <h2>Collections</h2>
      <div className="row"><input value={name} onChange={e => setName(e.target.value)} placeholder="New collection name" aria-label="Collection name" /><button className="pri" onClick={create}>Create</button></div>
      {!names.length && <div className="empty" style={{ marginTop: 16 }}>No collections yet. Select components in Explore, then use “Add to collection”.</div>}
      {names.map(k => {
        const items = A.cols[k].map(A.get).filter(Boolean)
        return (
          <section key={k}>
            <h3 style={{ marginTop: 18 }}>{k} <span className="sub">{items.length} items</span></h3>
            <div className="row" style={{ margin: '6px 0' }}>
              <button onClick={() => { A.setSel([...new Set([...A.sel, ...A.cols[k]])]); A.toast('Selected ' + items.length) }}>Select all</button>
              <button disabled={!items.length} onClick={() => save(k.replace(/\W+/g, '-') + '.zip', zipFiles(compFiles(items)))}>Export ZIP</button>
              <button onClick={() => { const { [k]: _, ...rest } = A.cols; A.setCols(rest) }}>Delete</button>
            </div>
            {items.length ? <div className="grid">{items.map(c => (
              <div key={c.id}><Card c={c} A={A} /><button style={{ marginTop: 4 }} onClick={() => A.setCols({ ...A.cols, [k]: A.cols[k].filter(x => x !== c.id) })}>Remove from {k}</button></div>
            ))}</div> : <div className="empty">Empty collection</div>}
          </section>
        )
      })}
    </>
  )
}

export function ThemeView({ A }: { A: A }) {
  const t = A.theme, set = (k: keyof Theme, v: any) => A.setTheme({ ...t, [k]: v })
  const col = (k: keyof Theme, l: string) => <label>{l}<input type="color" value={t[k] as string} onChange={e => set(k, e.target.value)} /></label>
  const rng = (k: keyof Theme, l: string, min: number, max: number) => <label>{l} ({t[k]}px)<input type="range" min={min} max={max} value={t[k] as number} onChange={e => set(k, +e.target.value)} /></label>
  const items = A.sel.map(A.get).filter(Boolean)
  const files: [string, string][] = [['theme/tokens.css', tcss(t) + '\n'], ['theme/tokens.json', JSON.stringify(t, null, 2)]]
  return (
    <>
      <h2>Theme builder</h2>
      <div className="two">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignContent: 'start' }}>
          {col('p', 'Primary')}{col('s', 'Secondary')}{col('bg', 'Background')}{col('tx', 'Text')}
          {rng('r', 'Radius', 0, 32)}{rng('sp', 'Spacing', 4, 20)}
          <label>Typography<select value={t.font} onChange={e => set('font', e.target.value)}><option>system-ui</option><option>Georgia, serif</option><option>ui-monospace, monospace</option></select></label>
          <label>Shadows<select value={t.sh} onChange={e => set('sh', +e.target.value)}><option value={1}>On</option><option value={0}>Off</option></select></label>
          <label>Animation<select value={t.anim} onChange={e => set('anim', +e.target.value)}><option value={1}>On</option><option value={0}>Off</option></select></label>
        </div>
        <div>
          <div className="big"><iframe sandbox="" title="Theme preview" srcDoc={themeDoc(t)} /></div>
          <pre>{tcss(t)}</pre>
          <div className="row"><button className="pri" onClick={() => save('theme-package.zip', zipFiles(compFiles(items, files)))}>Export theme package</button><button onClick={() => copy(tcss(t), A)}>Copy CSS</button></div>
        </div>
      </div>
      <p className="sub">{items.length} selected components are included in the export beside the theme tokens.</p>
    </>
  )
}

export function AiView({ A }: { A: A }) {
  const [mode, setMode] = useState(MODES[1]), [desc, setDesc] = useState(''), [files, setFiles] = useState<PF[]>([]), [busy, setBusy] = useState(false)
  const items = A.sel.map(A.get).filter(Boolean), a = analyze(files), p = items.length ? buildPrompt(items, mode, desc, a) : ''
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusy(true); const out: PF[] = []
    try {
      for (const f of Array.from(e.target.files || [])) {
        if (/\.zip$/i.test(f.name)) out.push(...await readZip(f))
        else if (f.size < 300000) out.push({ name: f.name, content: await f.text() })
      }
      A.toast(out.length ? `Analyzed ${out.length} file(s) locally` : 'No readable project files found')
    } catch (err: any) { A.toast('Could not read: ' + err.message) }
    setFiles(out); setBusy(false)
  }
  const pkg = () => save('integration-package.zip', zipFiles(compFiles(items, [['CLAUDE_PROMPT.md', p], ['INTEGRATION.md', '# Integration\n\n1. Open Claude and attach this ZIP and your project.\n2. Paste CLAUDE_PROMPT.md.\n3. Review the changes before merging.\n']])))
  return (
    <>
      <h2>Add to my project with AI</h2>
      {!items.length && <div className="empty">Select components in Explore first.</div>}
      <div className="two">
        <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <label>Integration method<select value={mode} onChange={e => setMode(e.target.value)}>{MODES.map(m => <option key={m}>{m}</option>)}</select></label>
          <label>Project ZIP or key files (package.json, CSS, config)<input type="file" multiple onChange={onFiles} /></label>
          <p className="sub">{busy ? 'Reading…' : 'Everything is read in your browser. Nothing is uploaded.'}</p>
          <label>Project description (optional)<textarea value={desc} onChange={e => setDesc(e.target.value)} /></label>
        </div>
        <div>
          <h3>Analysis</h3>
          <p className="sub">Framework: {a.fw}<br />Styling: {a.css}<br />Tokens: {a.tokens.join(', ') || 'none detected'}<br />Files read: {files.length}</p>
          <h3>Claude prompt</h3><pre>{p}</pre>
          <div className="row">
            <button className="pri" disabled={!p} onClick={() => copy(p, A)}>Copy prompt</button>
            <button disabled={!p} onClick={pkg}>Download package ZIP</button>
            <button disabled={!p} onClick={async () => { await copy(p, A); window.open('https://claude.ai/new', '_blank', 'noopener') }}>Open Claude</button>
          </div>
          <p className="sub">This app cannot send files to Claude. Download the ZIP, open Claude, attach it with your project, and paste the prompt.</p>
        </div>
      </div>
    </>
  )
}
