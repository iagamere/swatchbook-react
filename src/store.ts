import { useState, useEffect } from 'react'
import { LIB, Comp } from './data'
import { theme0 } from './lib/theme'
export function usePersist<T>(k: string, init: T): [T, (v: T) => void] {
  const [v, s] = useState<T>(() => { try { const r = localStorage.getItem('swb2:' + k); return r ? JSON.parse(r) : init } catch { return init } })
  useEffect(() => { try { localStorage.setItem('swb2:' + k, JSON.stringify(v)) } catch {} }, [v])
  return [v, s]
}
export function useApp() {
  const [fav, setFav] = usePersist<string[]>('fav', [])
  const [cols, setCols] = usePersist<Record<string, string[]>>('cols', {})
  const [recent, setRecent] = usePersist<string[]>('recent', [])
  const [user, setUser] = usePersist<Comp[]>('user', [])
  const [theme, setTheme] = usePersist('theme', theme0)
  const [sel, setSel] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const all = [...LIB, ...user]
  const tg = (a: string[], set: (v: string[]) => void, id: string) => set(a.includes(id) ? a.filter(x => x !== id) : [...a, id])
  return {
    fav, toggleFav: (id: string) => tg(fav, setFav, id), cols, setCols, recent, user, setUser, theme, setTheme,
    sel, setSel, toggleSel: (id: string) => tg(sel, setSel, id), open, setOpen: (id: string | null) => { setOpen(id); if (id) setRecent([id, ...recent.filter(x => x !== id)].slice(0, 8)) },
    all, get: (id: string) => all.find(c => c.id === id), msg, toast: (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2400) },
  }
}
export type A = ReturnType<typeof useApp>
