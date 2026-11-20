import { useEffect, useRef, useState } from 'react'
import { CATS, STY, C } from './data'
import { useApp, usePersist } from './store'
import { Card, Detail } from './parts'
import { Collections, ThemeView, AiView } from './views'
import { zipFiles, compFiles, save } from './lib/zip'

const NAV: [string, string][] = [['explore', 'Explore'], ['collections', 'Collections'], ['theme', 'Theme builder'], ['ai', 'Add with AI']]

export default function App() {
  const A = useApp()
  const [view, setView] = useState('explore'), [q, setQ] = useState(''), [cat, setCat] = useState('All')
  const [styles, setStyles] = useState<string[]>([]), [sort, setSort] = useState('popular'), [list, setList] = useState(false), [favOnly, setFavOnly] = useState(false)
  const [mode, setMode] = usePersist('mode', 'auto'), [target, setTarget] = useState('')
  const imp = useRef<HTMLInputElement>(null), search = useRef<HTMLInputElement>(null)
  useEffect(() => { if (mode === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = mode }, [mode])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); search.current?.focus() } }; addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [])

  const ql = q.toLowerCase()
  const res = A.all.filter(c => (cat === 'All' || c.cat === cat) && styles.every(s => c.styles.includes(s)) && (!favOnly || A.fav.includes(c.id)) &&
    (!ql || [c.name, c.cat, c.fw, ...c.tags, ...c.styles].join(' ').toLowerCase().includes(ql)))
    .sort((x, y) => sort === 'popular' ? y.pop - x.pop : sort === 'new' ? y.date.localeCompare(x.date) : x.name.localeCompare(y.name))
  const home = !q && cat === 'All' && !styles.length && !favOnly
  const recent = A.recent.map(A.get).filter(Boolean).slice(0, 4)
  const selItems = A.sel.map(A.get).filter(Boolean)
  const names = Object.keys(A.cols)

  const addTo = () => {
    const n = target || names[0] || 'My collection'
    A.setCols({ ...A.cols, [n]: [...new Set([...(A.cols[n] || []), ...A.sel])] }); A.toast('Added to “' + n + '”')
  }
  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const h = await f.text()
    const css = [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n')
    const js = [...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
    const body = h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '').replace(/[\s\S]*<body[^>]*>|<\/body>[\s\S]*/gi, '').trim()
    if (!body) return A.toast('No HTML body found in that file')
    const n = f.name.replace(/\.\w+$/, ''), c = C('user-' + Date.now(), n, 'Other UI Elements', ['Modern'], ['imported'], body, css, js)
    c.author = 'Imported by you'; c.license = 'Unknown'; c.src = 'Local file ' + f.name; c.desc = 'Imported from a local file; license unknown.'
    A.setUser([...A.user, c]); A.toast('Imported “' + n + '”'); e.target.value = ''
  }

  return (
    <>
      <header>
        <h1>Swatchbook</h1>
        <nav>{NAV.map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}</nav>
        <input ref={search} id="q" type="search" value={q} placeholder="Search (press /)" aria-label="Search" onChange={e => { setQ(e.target.value); setView('explore') }} />
        <button onClick={() => setMode(mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto')}>Theme: {mode}</button>
      </header>
      <main>
        {view === 'explore' && <>
          {home && recent.length > 0 && <><h2>Recently viewed</h2><div className="grid">{recent.map(c => <Card key={c.id} c={c} A={A} />)}</div><br /></>}
          <div className="chips" role="group" aria-label="Category">{CATS.map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
          <div className="chips" role="group" aria-label="Style">{STY.map(s => <button key={s} className={styles.includes(s) ? 'on' : ''} onClick={() => setStyles(styles.includes(s) ? styles.filter(x => x !== s) : [...styles, s])}>{s}</button>)}</div>
          <div className="bar">
            <span className="sub">{res.length} components</span>
            <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort"><option value="popular">Most popular</option><option value="new">Recently added</option><option value="name">Name</option></select>
            <button className={favOnly ? 'on' : ''} onClick={() => setFavOnly(!favOnly)}>Favorites</button>
            <button onClick={() => setList(!list)}>{list ? 'Grid view' : 'List view'}</button>
            <button onClick={() => imp.current?.click()}>Import HTML file</button>
            <input ref={imp} type="file" accept=".html,.htm" hidden onChange={onImport} />
          </div>
          {res.length ? <div className={'grid' + (list ? ' list' : '')}>{res.map(c => <Card key={c.id} c={c} A={A} />)}</div>
            : <div className="empty"><h3>No components match</h3><p>Remove a style filter or try another search term.</p><button onClick={() => { setQ(''); setCat('All'); setStyles([]); setFavOnly(false) }}>Clear filters</button></div>}
          <div id="tray">
            <b>{A.sel.length} selected</b>
            <button disabled={!A.sel.length} onClick={() => save('swatchbook-selection.zip', zipFiles(compFiles(selItems)))}>Download ZIP</button>
            <select value={target} onChange={e => setTarget(e.target.value)} aria-label="Collection">{names.length ? names.map(n => <option key={n}>{n}</option>) : <option value="">My collection (new)</option>}</select>
            <button disabled={!A.sel.length} onClick={addTo}>Add to collection</button>
            <button className="pri" disabled={!A.sel.length} onClick={() => setView('ai')}>Add to my project with AI</button>
            <button disabled={!A.sel.length} onClick={() => A.setSel([])}>Clear</button>
          </div>
        </>}
        {view === 'collections' && <Collections A={A} />}
        {view === 'theme' && <ThemeView A={A} />}
        {view === 'ai' && <AiView A={A} />}
      </main>
      {A.open && A.get(A.open) && <Detail c={A.get(A.open)!} A={A} />}
      {A.msg && <div id="toast" role="status">{A.msg}</div>}
    </>
  )
}
