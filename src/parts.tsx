import { useEffect, useState } from 'react'
import type { Comp } from './data'
import type { A } from './store'
import { zipFiles, compFiles, save } from './lib/zip'

export const pdoc = (c: Comp, bg = 'transparent', js = false) =>
  `<!DOCTYPE html><meta charset=utf-8><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:${bg}}${c.css}</style>${c.html}${js && c.js ? '<script>' + c.js + '<\/script>' : ''}`

export const copy = async (t: string, A: A) => {
  try { await navigator.clipboard.writeText(t); A.toast('Copied') } catch { A.toast('Copy blocked: select the text and copy it manually') }
}

export function Card({ c, A }: { c: Comp; A: A }) {
  const f = A.fav.includes(c.id)
  return (
    <article className="card">
      <div className="pv"><iframe sandbox="" title={c.name + ' preview'} loading="lazy" srcDoc={pdoc(c)} /></div>
      <div className="meta">
        <div className="row"><h3 style={{ flex: 1 }}>{c.name}</h3>
          <input type="checkbox" checked={A.sel.includes(c.id)} onChange={() => A.toggleSel(c.id)} aria-label={'Select ' + c.name} /></div>
        <div className="sub">{c.cat} · {c.fw}</div>
        <div className="row">{c.styles.slice(0, 3).map(s => <span className="tag" key={s}>{s}</span>)}</div>
        <div className="row">
          <button onClick={() => A.setOpen(c.id)}>Preview</button>
          <button aria-pressed={f} aria-label="Favorite" onClick={() => A.toggleFav(c.id)}>{f ? '★' : '☆'}</button>
          <button onClick={() => save(c.id + '.zip', zipFiles(compFiles([c])))}>Download</button>
        </div>
      </div>
    </article>
  )
}

export function Detail({ c, A }: { c: Comp; A: A }) {
  const [bg, setBg] = useState('transparent')
  const tabs = (['html', 'css', 'js'] as const).filter(k => c[k])
  const [tab, setTab] = useState<'html' | 'css' | 'js'>('html')
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && A.setOpen(null); addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [])
  return (
    <div className="ov" onClick={() => A.setOpen(null)}>
      <div className="dlg" role="dialog" aria-modal="true" aria-label={c.name} onClick={e => e.stopPropagation()}>
        <div className="row"><h2 style={{ flex: 1, margin: 0 }}>{c.name}</h2><button autoFocus onClick={() => A.setOpen(null)}>Close</button></div>
        <p className="sub">{c.desc} {c.cat} · {c.styles.join(', ')} · {c.license} · {c.author}</p>
        <div className="row"><span className="sub">Background</span>
          {([['transparent', 'Auto'], ['#ffffff', 'Light'], ['#0f172a', 'Dark']] as const).map(([v, l]) => <button key={v} className={bg === v ? 'on' : ''} onClick={() => setBg(v)}>{l}</button>)}</div>
        <div className="big" style={{ margin: '8px 0' }}><iframe sandbox="allow-scripts" title="Live preview" srcDoc={pdoc(c, bg, true)} /></div>
        <div className="row">{tabs.map(k => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{k.toUpperCase()}</button>)}
          <span className="sub">Original source only. Nothing here is converted or generated.</span></div>
        <pre>{c[tab]}</pre>
        <div className="row">
          <button className="pri" onClick={() => copy(c[tab], A)}>Copy code</button>
          <button onClick={() => save(c.id + '.zip', zipFiles(compFiles([c])))}>Download ZIP</button>
          <button onClick={() => save(c.id + '.' + tab, new Blob([c[tab]], { type: 'text/plain' }))}>Download .{tab}</button>
        </div>
      </div>
    </div>
  )
}
