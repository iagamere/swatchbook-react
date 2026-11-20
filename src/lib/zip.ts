import type { Comp } from '../data'
const T = (() => { const t: number[] = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc = (b: Uint8Array) => { let c = -1; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0 }
export type F = [string, string]
export function zipFiles(files: F[]): Blob {
  const en = new TextEncoder(), parts: BlobPart[] = [], cd: BlobPart[] = []; let off = 0
  for (const [n, d] of files) {
    const nb = en.encode(n), db = en.encode(d), cr = crc(db), h = new DataView(new ArrayBuffer(30))
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true); h.setUint32(14, cr, true); h.setUint32(18, db.length, true); h.setUint32(22, db.length, true); h.setUint16(26, nb.length, true)
    parts.push(new Uint8Array(h.buffer), nb, db)
    const c = new DataView(new ArrayBuffer(46))
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true); c.setUint32(16, cr, true); c.setUint32(20, db.length, true); c.setUint32(24, db.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true)
    cd.push(new Uint8Array(c.buffer), nb); off += 30 + nb.length + db.length
  }
  const sz = cd.reduce((a, x: any) => a + x.length, 0), e = new DataView(new ArrayBuffer(22))
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, sz, true); e.setUint32(16, off, true)
  return new Blob([...parts, ...cd, new Uint8Array(e.buffer)], { type: 'application/zip' })
}
export const readme = (c: Comp) => `# ${c.name}\n\n${c.desc}\n\n- Category: ${c.cat}\n- Styles: ${c.styles.join(', ')}\n- Technology: ${c.fw}\n- Author: ${c.author}\n- License: ${c.license}\n- Source: ${c.src}\n`
export function compFiles(cs: Comp[], extra: F[] = []): F[] {
  const f: F[] = []
  for (const c of cs) {
    const p = `components/${c.id}/`
    f.push([p + 'index.html', `<!DOCTYPE html>\n<html><head><meta charset="utf-8"><link rel="stylesheet" href="style.css"></head><body>\n${c.html}\n${c.js ? '<script src="script.js"></script>\n' : ''}</body></html>`], [p + 'style.css', c.css])
    if (c.js) f.push([p + 'script.js', c.js])
    f.push([p + 'README.md', readme(c)])
  }
  f.push(['manifest.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), components: cs.map(c => ({ id: c.id, name: c.name, technology: c.fw, author: c.author, source: c.src, license: c.license })) }, null, 2)], ...extra)
  return f
}
export function save(name: string, blob: Blob) {
  const u = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000)
}
// Reads only the useful text files of a project ZIP (stored or deflate).
export async function readZip(file: File): Promise<{ name: string; content: string }[]> {
  const buf = await file.arrayBuffer(), dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder()
  let e = buf.byteLength - 22
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--
  if (e < 0) throw new Error('Not a valid ZIP file')
  let p = dv.getUint32(e + 16, true); const n = dv.getUint16(e + 10, true), out: { name: string; content: string }[] = []
  const want = /(^|\/)(package\.json|tsconfig\.json|(tailwind|vite|next|svelte|angular)\.config\.\w+|[^/]+\.(css|scss|html))$/
  for (let i = 0; i < n && out.length < 40; i++) {
    const m = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), us = dv.getUint32(p + 24, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lh = dv.getUint32(p + 42, true)
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + el + cl
    if (!want.test(name) || /node_modules|dist\/|build\//.test(name) || us > 300000) continue
    const s = lh + 30 + dv.getUint16(lh + 26, true) + dv.getUint16(lh + 28, true), raw = u8.subarray(s, s + cs)
    try {
      if (m === 0) out.push({ name, content: dec.decode(raw) })
      else if (m === 8) out.push({ name, content: await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text() })
    } catch {}
  }
  return out
}
