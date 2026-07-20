// @ts-check
/**
 * Gerador da coleção "Atividades para Imprimir" (Micro Guias).
 *
 * - Fichas definidas como DADOS (array FICHAS), organizadas por faixa etária.
 * - Renderiza cada uma para public/atividades/<slug>.html (A4, pronta p/ impressão).
 * - Converte cada HTML em <slug>.pdf via Edge/Chrome headless (--print-to-pdf).
 * - Emite public/atividades/manifest.json (consumido pela página /atividades).
 *
 * Uso:  node scripts/atividades/build.mjs         (HTML + PDF + manifest)
 *       node scripts/atividades/build.mjs --no-pdf
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', '..', 'public', 'atividades')
const SEM_PDF = process.argv.includes('--no-pdf')
const FOOTER = 'Atividades para imprimir e aprender • uso pessoal e escolar'

// ===================================================================== utils
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function rng(seed) { // mulberry32 (determinístico p/ PDFs estáveis)
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function embaralhar(arr, seed) {
  const r = rng(seed); const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ===================================================================== doodles / ícones
const DOODLES = /* html */ `
<div class="doodles" aria-hidden="true">
  <svg viewBox="0 0 40 40" fill="none" stroke="#34343E" stroke-width="2.4" stroke-linecap="round"><circle cx="20" cy="20" r="8" fill="#FBB13C"/><path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3.5 3.5M28.5 28.5L32 32M32 8l-3.5 3.5M11.5 28.5L8 32"/></svg>
  <svg viewBox="0 0 40 40" fill="#FF6B6B" stroke="#34343E" stroke-width="2.4" stroke-linejoin="round"><path d="M20 5l4.5 9.2 10.1 1.5-7.3 7.1 1.7 10L20 28.2 10.9 33l1.7-10L5.3 15.7l10.1-1.5z"/></svg>
  <svg viewBox="0 0 40 40" fill="none" stroke="#34343E" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M27 6l7 7-18 18-9 2 2-9z" fill="#3FA9E0"/><path d="M24 9l7 7"/></svg>
</div>`

const ICONS = {
  comida: `<svg viewBox="0 0 28 28" fill="none" stroke="#34343E" stroke-width="2.2" stroke-linejoin="round"><path d="M4 12h20l-10 12z" fill="#FBB13C"/><circle cx="11" cy="16" r="1.3" fill="#34343E"/><circle cx="16" cy="15" r="1.3" fill="#34343E"/></svg>`,
  coracao: `<svg viewBox="0 0 28 28" fill="#FF6B6B" stroke="#34343E" stroke-width="2.2" stroke-linejoin="round"><path d="M14 24C6 18 3 13 3 9a5 5 0 019-3 5 5 0 019 3c0 4-3 9-11 15z"/></svg>`,
  bola: `<svg viewBox="0 0 28 28" fill="none" stroke="#34343E" stroke-width="2.2" stroke-linejoin="round"><rect x="4" y="9" width="20" height="12" rx="4" fill="#3FA9E0"/><circle cx="10" cy="15" r="1.6" fill="#fff"/><circle cx="18" cy="13" r="1.4" fill="#fff"/><circle cx="20" cy="17" r="1.4" fill="#fff"/></svg>`,
  animal: `<svg viewBox="0 0 28 28" fill="#2FB8A0" stroke="#34343E" stroke-width="2.2" stroke-linejoin="round"><path d="M8 7c-2 0-3 2-3 4 0 5 4 10 9 10s9-5 9-10c0-2-1-4-3-4-1 0-2 1-3 2-1-2-5-2-6 0-1-1-2-2-3-2z"/><circle cx="12" cy="13" r="1.2" fill="#34343E"/><circle cx="17" cy="13" r="1.2" fill="#34343E"/></svg>`,
}

// ===================================================================== formas
function shapeMarkup(nome) {
  switch (nome) {
    case 'circle': return `<circle cx="50" cy="50" r="40"/>`
    case 'square': return `<rect x="12" y="12" width="76" height="76" rx="6"/>`
    case 'triangle': return `<path d="M50 10 L90 86 L10 86 Z"/>`
    case 'star': return `<path d="M50 8 61 38 93 38 67 58 77 90 50 70 23 90 33 58 7 38 39 38 Z"/>`
    case 'heart': return `<path d="M50 86C18 62 12 40 26 28 38 18 50 30 50 30 50 30 62 18 74 28 88 40 82 62 50 86Z"/>`
    case 'diamond': return `<path d="M50 8 88 50 50 92 12 50 Z"/>`
    default: return `<circle cx="50" cy="50" r="40"/>`
  }
}

// ===================================================================== traçados (SVG "d")
const TW = 540
function genStraight(y) { return `M8 ${y} H${TW - 8}` }
function genWave(y, amp = 15, step = 56) { let d = `M8 ${y} `; for (let x = 8; x < TW; x += step) d += `q ${step / 2} ${-amp} ${step} 0 `; return d }
function genHill(y, amp = 22, step = 40) { let d = `M8 ${y} `; for (let x = 8; x < TW; x += step) d += `q ${step / 2} ${-amp} ${step} 0 `; return d }
function genZig(y, amp = 20, step = 30) { let d = `M8 ${y} `; let up = true; for (let x = 8; x < TW; x += step) { d += `L ${x + step} ${up ? y - amp : y + amp} `; up = !up } return d }
function genLoop(y, r = 16, step = 34) { let d = `M8 ${y} `; for (let x = 8; x < TW; x += step) d += `c ${r / 2} ${-r * 2} ${r * 1.5} ${-r * 2} ${r} 0 s ${r / 2} ${r} ${step - r} 0 `; return d }
const TRACE_GEN = { straight: genStraight, wave: genWave, hill: genHill, zigzag: genZig, loop: genLoop }
const DOT_COLORS = ['#2FB8A0', '#FF6B6B', '#3FA9E0', '#FBB13C']

// ===================================================================== ligue os pontos
const DTD_POINTS = {
  estrela: [[120, 20], [167, 165], [44, 75], [196, 75], [73, 165]], // pentagrama 1-2-3-4-5
  casinha: [[60, 180], [180, 180], [180, 100], [120, 50], [60, 100]],
  peixe: [[40, 105], [130, 45], [150, 80], [205, 55], [205, 150], [150, 125], [130, 160]],
}

// ===================================================================== labirinto
function gerarMaze(cols, rows, seed) {
  const r = rng(seed)
  const cells = Array.from({ length: cols * rows }, () => ({ n: true, e: true, s: true, w: true, v: false }))
  const idx = (x, y) => y * cols + x
  const stack = [[0, 0]]; cells[0].v = true
  while (stack.length) {
    const [x, y] = stack[stack.length - 1]; const nb = []
    if (y > 0 && !cells[idx(x, y - 1)].v) nb.push(['n', x, y - 1])
    if (x < cols - 1 && !cells[idx(x + 1, y)].v) nb.push(['e', x + 1, y])
    if (y < rows - 1 && !cells[idx(x, y + 1)].v) nb.push(['s', x, y + 1])
    if (x > 0 && !cells[idx(x - 1, y)].v) nb.push(['w', x - 1, y])
    if (!nb.length) { stack.pop(); continue }
    const [dir, nx, ny] = nb[Math.floor(r() * nb.length)]
    const c = cells[idx(x, y)], d = cells[idx(nx, ny)]
    if (dir === 'n') { c.n = false; d.s = false }
    if (dir === 'e') { c.e = false; d.w = false }
    if (dir === 's') { c.s = false; d.n = false }
    if (dir === 'w') { c.w = false; d.e = false }
    d.v = true; stack.push([nx, ny])
  }
  return cells
}
function mazeSvg(cols, rows, seed, cs = 26) {
  const cells = gerarMaze(cols, rows, seed)
  const idx = (x, y) => y * cols + x
  const W = cols * cs, H = rows * cs
  let d = ''
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const c = cells[idx(x, y)], px = x * cs, py = y * cs
    if (c.n) d += `M${px} ${py}h${cs}`
    if (c.w && !(x === 0 && y === 0)) d += `M${px} ${py}v${cs}` // entrada: abre oeste de (0,0)
  }
  for (let y = 0; y < rows; y++) if (!(y === rows - 1)) d += `M${W} ${y * cs}v${cs}` // saída: abre leste da última
  for (let x = 0; x < cols; x++) d += `M${x * cs} ${H}h${cs}`
  const half = cs / 2
  return `<svg viewBox="-4 -4 ${W + 8} ${H + 8}" fill="none" stroke="#34343E" stroke-width="2.6" stroke-linecap="square">
    <path d="${d}"/>
    <circle cx="${-half}" cy="${half}" r="5" fill="#2FB8A0" stroke="none"/>
    <circle cx="${W + half}" cy="${H - half}" r="5" fill="#FF6B6B" stroke="none"/>
  </svg>`
}

// ===================================================================== carinhas
const FACES = [
  ['Feliz', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M16 29c3 4 13 4 16 0" fill="none"/>`],
  ['Animado', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M15 25c3-4 15-4 18 0" fill="none"/><path d="M9 16l7 3M39 16l-7 3"/>`],
  ['Calmo', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M16 28h16" fill="none"/>`],
  ['Triste', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M16 31c3-4 13-4 16 0" fill="none"/>`],
  ['Bravo', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="21" r="1.6" fill="#34343E"/><circle cx="31" cy="21" r="1.6" fill="#34343E"/><path d="M16 31c3-4 13-4 16 0" fill="none"/><path d="M13 15l6 3M35 15l-6 3"/>`],
]

// ===================================================================== helpers de cartão
const tagHtml = (tag, cor) => `<span class="tag t-${cor}">${esc(tag)}</span>`
const hintHtml = (h) => (h ? `<p class="hint">${esc(h)}</p>` : '')
const lines = (n = 1) => `<div class="lines">${Array.from({ length: n }, () => '<div class="ln"></div>').join('')}</div>`

const BUILDERS = {
  draw: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}
    <div class="draw ${c.tall ? 'tall' : ''}">✏️ desenhe aqui</div></section>`,

  lines: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}${lines(c.n || 2)}</section>`,

  note: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}<p class="notetext">${esc(c.text)}</p></section>`,

  faces: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Faça um círculo na carinha que combina com você.')}
    <div class="faces">${FACES.map(([nome, svg]) => `<div class="face"><svg viewBox="0 0 48 48" fill="#FFF3D6" stroke="#34343E" stroke-width="2.4" stroke-linecap="round">${svg}</svg>${nome}</div>`).join('')}</div></section>`,

  favs: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}
    <div class="favs">${c.items.map((it) => `<div class="fav">${ICONS[it.icon] || ''}<div class="col"><span>${esc(it.label)}</span><div class="rule"></div></div></div>`).join('')}</div></section>`,

  checks: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}
    <div class="checks">${c.items.map((t) => `<label class="chk"><span class="box"></span> ${esc(t)}</label>`).join('')}</div>
    ${c.extraLabel ? `<p class="hint" style="margin-top:12px">${esc(c.extraLabel)}</p>${lines(1)}` : ''}</section>`,

  traceLines: (c) => {
    const kinds = c.rows || ['wave', 'zigzag', 'loop']
    const gap = 120 / (kinds.length + 1)
    const paths = kinds.map((k, i) => {
      const y = gap * (i + 1); const d = (TRACE_GEN[k] || genWave)(y)
      return `<circle cx="8" cy="${y}" r="5" fill="${DOT_COLORS[i % DOT_COLORS.length]}" stroke="none"/><path d="${d}"/>`
    }).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Cubra o pontilhado com o lápis, sem tirar a mão. 🖍️')}
      <div class="trace"><svg viewBox="0 0 ${TW} 120" fill="none" stroke="#9AA0B2" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9">${paths}</svg></div></section>`
  },

  cut: (c) => {
    const kinds = c.rows || ['straight', 'wave', 'zigzag']
    const gap = 120 / (kinds.length + 1)
    const paths = kinds.map((k, i) => {
      const y = gap * (i + 1); const d = (TRACE_GEN[k] || genStraight)(y)
      return `<text x="2" y="${y + 5}" font-size="16">✂</text><path d="${d}"/>`
    }).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Recorte com a tesoura em cima da linha. ✂️')}
      <div class="trace"><svg viewBox="0 0 ${TW} 120" fill="none" stroke="#34343E" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="8 7">${paths}</svg></div></section>`
  },

  traceChars: (c) => {
    const per = c.per || 6
    const rows = c.chars.map((ch) => `<div class="trow">${Array.from({ length: per }, () => `<span class="ghost">${esc(ch)}</span>`).join('')}</div>`).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Passe o lápis por cima. Depois escreva sozinho!')}
      <div class="tset">${rows}</div></section>`
  },

  gridChars: (c) => {
    const cells = c.chars.map((ch) => `<div class="gcell"><span class="ghost">${esc(ch)}</span></div>`).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Cubra cada letrinha com o lápis.')}
      <div class="gchars">${cells}</div></section>`
  },

  shapes: (c) => {
    const reps = c.rep || 3
    const items = c.shapes.flatMap((s) => Array.from({ length: reps }, () => s))
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Cubra o contorno de cada forma.')}
      <div class="shapes">${items.map((s) => `<svg class="shp" viewBox="0 0 100 100" fill="none" stroke="#C7CCDA" stroke-width="3.5" stroke-dasharray="2 9" stroke-linejoin="round">${shapeMarkup(s)}</svg>`).join('')}</div></section>`
  },

  count: (c) => {
    const obj = shapeMarkup(c.shape || 'star')
    const rows = c.counts.map((n) =>
      `<div class="crow"><div class="objs">${Array.from({ length: n }, () => `<svg class="obj" viewBox="0 0 100 100" fill="none" stroke="#34343E" stroke-width="4" stroke-linejoin="round">${obj}</svg>`).join('')}</div><span class="eq">=</span><span class="cbox"></span></div>`
    ).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Conte as figuras e escreva o número no quadrinho.')}
      <div class="countset">${rows}</div></section>`
  },

  pattern: (c) => {
    const rows = c.rows.map((seq) =>
      `<div class="patrow">${seq.map((s) => s === '?'
        ? `<span class="pblank">?</span>`
        : `<span class="pcell"><svg viewBox="0 0 100 100" fill="#fff" stroke="#34343E" stroke-width="4" stroke-linejoin="round">${shapeMarkup(s)}</svg></span>`).join('')}</div>`
    ).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Descubra e desenhe as próximas formas do padrão.')}
      <div class="patset">${rows}</div></section>`
  },

  dotToDot: (c) => {
    const pts = DTD_POINTS[c.shape] || DTD_POINTS.estrela
    const dots = pts.map(([x, y], i) =>
      `<circle class="dot" cx="${x}" cy="${y}" r="9"/><text class="num" x="${x + 12}" y="${y - 8}">${i + 1}</text>`
    ).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || `Ligue os pontos de 1 até ${pts.length} e descubra o desenho. Depois pinte!`)}
      <div class="dtd"><svg viewBox="0 0 240 210">${dots}</svg></div></section>`
  },

  match: (c) => {
    const lefts = c.pairs.map((p) => p[0])
    const rights = embaralhar(c.pairs.map((p) => p[1]), c.seed || 7)
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Ligue cada item ao seu par com uma linha.')}
      <div class="matchbox">
        <div class="mcol left">${lefts.map((x) => `<div class="mitem">${x}<span class="mdot"></span></div>`).join('')}</div>
        <div class="mcol right">${rights.map((x) => `<div class="mitem"><span class="mdot"></span>${x}</div>`).join('')}</div>
      </div></section>`
  },

  math: (c) => {
    const probs = c.problems.map(([a, op, b]) => `<div class="mprob"><span>${a} ${op} ${b} =</span><span class="mbox"></span></div>`).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Resolva e escreva o resultado no quadrinho.')}
      <div class="mathset">${probs}</div></section>`
  },

  maze: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Comece na bolinha verde e chegue na vermelha, sem cruzar as paredes.')}
    <div class="maze">${mazeSvg(c.cols || 10, c.rows || 10, c.seed || 1, c.cs || 26)}</div></section>`,
}

// ===================================================================== página
function badgeIdade(idade) { return idade ? `<span class="agebadge">${esc(idade)}</span>` : '' }
function idRow(fields) {
  const cls = fields.length === 3 ? 'id id-3' : 'id id-2'
  return `<div class="${cls}">${fields.map((f) => `<div class="field"><span>${esc(f)}</span><div class="rule"></div></div>`).join('')}</div>`
}
function renderFicha(f) {
  const cards = f.cards.map((c) => BUILDERS[c.type](c)).join('\n')
  return /* html */ `<title>${esc(f.title)} — Ficha de Atividades</title>
<style>${CSS}</style>
<div class="bar noprint">
  <p><b>${esc(f.title)}</b> — clique em <b>Imprimir / Salvar PDF</b> e escolha “Salvar como PDF”. Sai em A4 certinho.</p>
  <button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button>
</div>
<div class="stage"><div class="sheet">
  <header class="head">${DOODLES}
    <h1>${esc(f.title)}</h1>
    <p>${esc(f.subtitle)} ${badgeIdade(f.idade)}</p>
  </header>
  ${f.id ? idRow(f.id) : ''}
  <div class="grid">
${cards}
  </div>
  <footer>
    <span class="brand"><svg width="16" height="16" viewBox="0 0 24 24" fill="#4F46E5"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 12h8M12 8v8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg><b>Micro Guias</b></span>
    <span>${FOOTER}</span>
  </footer>
</div></div>`
}

// ===================================================================== CSS
const CSS = `
:root{--brand:#4F46E5;--coral:#FF6B6B;--sun:#FBB13C;--mint:#2FB8A0;--sky:#3FA9E0;--ink:#34343E;--muted:#8A8D9B;--line:#C7CCDA;--paper:#fff;--frame:#ECE9F6;--frame-ink:#4a4761}
@media (prefers-color-scheme:dark){:root{--frame:#191922;--frame-ink:#b8b4cf}}
:root[data-theme="light"]{--frame:#ECE9F6;--frame-ink:#4a4761}
:root[data-theme="dark"]{--frame:#191922;--frame-ink:#b8b4cf}
*{box-sizing:border-box}
body{margin:0;background:var(--frame);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);padding:22px 12px 48px}
.bar{max-width:210mm;margin:0 auto 16px;display:flex;gap:10px;align-items:center;justify-content:space-between;color:var(--frame-ink)}
.bar p{margin:0;font-size:13px;line-height:1.4}.bar b{color:inherit}
.btn{font:inherit;font-weight:700;font-size:14px;cursor:pointer;background:var(--brand);color:#fff;border:none;border-radius:999px;padding:11px 20px;white-space:nowrap;box-shadow:0 4px 14px rgba(79,70,229,.35)}
.btn:hover{filter:brightness(1.06)}.btn:focus-visible{outline:3px solid var(--sun);outline-offset:2px}
.stage{overflow-x:auto}
.sheet{width:210mm;min-height:297mm;margin:0 auto;background:var(--paper);padding:12mm 11mm 10mm;box-shadow:0 10px 40px rgba(30,20,60,.22);font-family:"Comic Sans MS","Comic Neue","Chalkboard SE","Segoe Print",system-ui,sans-serif;color:var(--ink)}
.head{border:3px solid var(--ink);border-radius:22px;padding:12px 18px 14px;position:relative;overflow:hidden;margin-bottom:10px;background:radial-gradient(120px 60px at 92% -10px,rgba(251,177,60,.20),transparent 70%),radial-gradient(140px 70px at 6% 120%,rgba(63,169,224,.18),transparent 70%)}
.head h1{margin:2px 0;font-size:38px;line-height:.98;letter-spacing:.5px;text-transform:uppercase;text-wrap:balance;-webkit-text-stroke:1.2px var(--ink);color:var(--sun);text-shadow:2.5px 2.5px 0 var(--ink)}
.head p{margin:0;font-size:15px;color:var(--muted);font-weight:700}
.agebadge{display:inline-block;margin-left:6px;background:var(--brand);color:#fff;font-family:system-ui,sans-serif;font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px;vertical-align:middle}
.head .doodles{position:absolute;top:10px;right:14px;display:flex;gap:8px}.head .doodles svg{width:34px;height:34px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.card{border:2.6px solid var(--ink);border-radius:18px;padding:15px 13px 12px;position:relative;background:#fff;break-inside:avoid}
.card.wide{grid-column:1/-1}
.tag{position:absolute;top:-11px;left:14px;padding:3px 12px;border-radius:999px;font-family:system-ui,sans-serif;font-weight:800;font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:#fff;border:2px solid var(--ink)}
.t-brand{background:var(--brand)}.t-coral{background:var(--coral)}.t-sun{background:var(--sun)}.t-mint{background:var(--mint)}.t-sky{background:var(--sky)}
.hint{font-size:11.5px;color:var(--muted);margin:0 0 8px;font-weight:700}
.notetext{font-size:14px;margin:4px 0 0;line-height:1.5}
.lines{display:flex;flex-direction:column;gap:15px;margin-top:4px}.lines .ln{border-bottom:2px solid var(--line);height:0}
.id{display:grid;gap:10px;margin-bottom:12px}.id-3{grid-template-columns:1.6fr 1fr 1fr}.id-2{grid-template-columns:1fr 1fr}
.field{font-size:13px;font-weight:700}.field span{display:block;font-family:system-ui,sans-serif;font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--brand);margin-bottom:13px}.field .rule{border-bottom:2px solid var(--line)}
.draw{border:2.5px dashed var(--line);border-radius:14px;min-height:118px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;text-align:center;padding:8px}.draw.tall{min-height:150px}
.faces{display:flex;justify-content:space-between;gap:6px;margin-top:6px}
.face{text-align:center;font-family:system-ui,sans-serif;font-size:10.5px;color:var(--muted);font-weight:700}.face svg{width:46px;height:46px;display:block;margin:0 auto 3px}
.favs{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;margin-top:6px}
.fav{display:flex;align-items:flex-end;gap:8px}.fav svg{width:26px;height:26px;flex:none;margin-bottom:2px}.fav .col{flex:1}
.fav .col span{display:block;font-family:system-ui,sans-serif;font-size:9.5px;letter-spacing:.4px;text-transform:uppercase;color:var(--muted);margin-bottom:11px}.fav .col .rule{border-bottom:2px solid var(--line)}
.checks{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;margin-top:6px;font-size:13px}
.chk{display:flex;align-items:center;gap:8px}.chk .box{width:18px;height:18px;border:2.4px solid var(--ink);border-radius:5px;flex:none}
.trace{margin-top:4px}.trace svg{width:100%;height:auto;display:block}
.tset{display:flex;flex-direction:column;gap:14px;margin-top:6px}
.trow{display:flex;align-items:flex-end;justify-content:space-around;gap:10px;border-bottom:2px solid var(--line);padding-bottom:4px}
.ghost{font-family:"Comic Sans MS","Comic Neue",system-ui,sans-serif;font-size:50px;line-height:.9;color:transparent;-webkit-text-stroke:2.2px var(--line)}
.gchars{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:6px}
.gcell{border:2px solid var(--line);border-radius:10px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}.gcell .ghost{font-size:32px}
.shapes{display:flex;justify-content:space-around;align-items:center;flex-wrap:wrap;gap:12px;margin-top:8px}.shp{width:86px;height:86px}
.countset{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.crow{display:flex;align-items:center;gap:10px;border-bottom:2px solid var(--line);padding-bottom:8px}
.crow .objs{display:flex;gap:6px;flex:1;flex-wrap:wrap}.crow .obj{width:26px;height:26px}
.crow .eq{font-size:22px;font-weight:800}.crow .cbox{width:42px;height:34px;border:2.4px solid var(--ink);border-radius:8px;flex:none}
.patset{display:flex;flex-direction:column;gap:14px;margin-top:8px}
.patrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pcell{width:48px;height:48px;display:flex;align-items:center;justify-content:center}.pcell svg{width:44px;height:44px}
.pblank{width:48px;height:48px;border:2.4px dashed var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:22px;font-weight:800}
.dtd{margin-top:8px;display:flex;justify-content:center}.dtd svg{width:100%;max-width:320px;height:auto}
.dtd .dot{fill:#fff;stroke:var(--ink);stroke-width:2}.dtd .num{font-family:system-ui,sans-serif;font-size:13px;font-weight:800;fill:var(--ink)}
.matchbox{display:flex;justify-content:space-between;gap:30px;margin-top:10px}
.mcol{display:flex;flex-direction:column;gap:16px;font-size:19px;font-weight:700}.mcol.left{align-items:flex-start}.mcol.right{align-items:flex-end}
.mitem{display:flex;align-items:center;gap:10px}.mdot{width:12px;height:12px;border-radius:50%;background:var(--ink);flex:none}
.mathset{display:grid;grid-template-columns:1fr 1fr;gap:14px 24px;margin-top:8px;font-size:22px;font-weight:700}
.mprob{display:flex;align-items:center;gap:8px}.mbox{width:46px;height:34px;border:2.4px solid var(--ink);border-radius:8px}
.maze{margin-top:8px;display:flex;justify-content:center}.maze svg{width:100%;height:auto}
footer{margin-top:12px;display:flex;align-items:center;justify-content:space-between;font-family:system-ui,sans-serif;font-size:11px;color:var(--muted);font-weight:700}
footer .brand{display:flex;align-items:center;gap:7px;color:var(--brand)}footer .brand b{font-size:13px}
@page{size:A4;margin:0}
@media print{body{background:#fff;padding:0}.noprint{display:none!important}.stage{overflow:visible}.sheet{box-shadow:none;margin:0;width:210mm}}
`

// ===================================================================== DADOS DAS FICHAS
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const B_23 = '2–3 anos', B_45 = '4–5 anos', B_67 = '6–7 anos', B_8 = '8+ anos'

const FICHAS = [
  // ---------------------------------------------------------------- 2–3 anos
  {
    slug: 'primeiros-riscos', title: 'Primeiros Riscos', subtitle: 'Segure o lápis e siga os caminhos', idade: B_23,
    foco: 'Primeiros traços', emoji: '✏️', cor: 'from-teal-400 to-emerald-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'traceLines', tag: 'Caminhos retos', cor: 'mint', wide: true, rows: ['straight', 'straight', 'straight'] },
      { type: 'traceLines', tag: 'Morrinhos', cor: 'sky', wide: true, rows: ['hill', 'hill'] },
      { type: 'traceLines', tag: 'Ondinhas', cor: 'coral', wide: true, rows: ['wave', 'wave'] },
    ],
  },
  {
    slug: 'formas-grandes', title: 'Formas Grandes', subtitle: 'Cubra o contorno das formas gigantes', idade: B_23,
    foco: 'Formas & traçado', emoji: '⭐', cor: 'from-amber-400 to-orange-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'shapes', tag: 'Círculo e quadrado', cor: 'sun', wide: true, rep: 3, shapes: ['circle', 'square'] },
      { type: 'shapes', tag: 'Triângulo e coração', cor: 'coral', wide: true, rep: 3, shapes: ['triangle', 'heart'] },
      { type: 'shapes', tag: 'Estrela', cor: 'brand', wide: true, rep: 3, shapes: ['star'] },
    ],
  },
  {
    slug: 'linhas-de-recorte', title: 'Linhas de Recorte', subtitle: 'Treine a tesoura seguindo as linhas', idade: B_23,
    foco: 'Coordenação & tesoura', emoji: '✂️', cor: 'from-rose-400 to-red-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'cut', tag: 'Linhas retas', cor: 'coral', wide: true, rows: ['straight', 'straight', 'straight'] },
      { type: 'cut', tag: 'Linhas onduladas', cor: 'sky', wide: true, rows: ['wave', 'wave'] },
      { type: 'draw', tag: 'Cole aqui o que recortou', cor: 'mint', wide: true, hint: 'Cole os pedacinhos neste quadro.' },
    ],
  },

  // ---------------------------------------------------------------- 4–5 anos
  {
    slug: 'tudo-sobre-mim', title: 'Tudo Sobre Mim', subtitle: 'Meu caderno de atividades', idade: B_45,
    foco: 'Identidade & escrita', emoji: '🙂', cor: 'from-indigo-500 to-indigo-600', id: ['Meu nome é', 'Tenho (anos)', 'Data'],
    cards: [
      { type: 'draw', tag: 'Meu autorretrato', cor: 'brand', hint: 'Desenhe você sorrindo!', tall: true },
      { type: 'draw', tag: 'Minha família', cor: 'mint', hint: 'Quem mora com você?', tall: true },
      { type: 'faces', tag: 'Como eu estou hoje?', cor: 'coral', wide: true },
      { type: 'favs', tag: 'Minhas coisas favoritas', cor: 'sun', items: [
        { icon: 'comida', label: 'Comida' }, { icon: 'coracao', label: 'Cor preferida' },
        { icon: 'bola', label: 'Brincadeira' }, { icon: 'animal', label: 'Animal' }] },
      { type: 'checks', tag: 'Eu já consigo!', cor: 'sky', hint: 'Marque o que você já faz sozinho.',
        items: ['Escovar os dentes', 'Guardar os brinquedos', 'Me vestir', 'Calçar o tênis'], extraLabel: 'Uma coisa nova que aprendi:' },
      { type: 'traceLines', tag: 'Vamos traçar!', cor: 'mint', wide: true, rows: ['wave', 'zigzag', 'loop'] },
    ],
  },
  {
    slug: 'vamos-tracar', title: 'Vamos Traçar!', subtitle: 'Siga os caminhos pontilhados', idade: B_45,
    foco: 'Coordenação motora', emoji: '〰️', cor: 'from-sky-500 to-blue-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'traceLines', tag: 'Ondas do mar', cor: 'sky', wide: true, rows: ['wave', 'wave', 'wave'] },
      { type: 'traceLines', tag: 'Montanhas', cor: 'mint', wide: true, rows: ['hill', 'hill', 'hill'] },
      { type: 'traceLines', tag: 'Zigue-zague', cor: 'coral', wide: true, rows: ['zigzag', 'zigzag', 'zigzag'] },
      { type: 'traceLines', tag: 'Laços e voltinhas', cor: 'brand', wide: true, rows: ['loop', 'loop', 'loop'] },
    ],
  },
  {
    slug: 'tracando-vogais', title: 'Traçando as Vogais', subtitle: 'Cubra as vogais e aprenda os sons', idade: B_45,
    foco: 'Vogais & traçado', emoji: '🅰️', cor: 'from-violet-500 to-purple-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'traceChars', tag: 'Vogais maiúsculas', cor: 'brand', wide: true, per: 7, chars: ['A', 'E', 'I', 'O', 'U'] },
      { type: 'traceChars', tag: 'Vogais minúsculas', cor: 'coral', wide: true, per: 7, chars: ['a', 'e', 'i', 'o', 'u'] },
    ],
  },
  {
    slug: 'contando-ate-5', title: 'Contando até 5', subtitle: 'Conte as figuras e escreva o número', idade: B_45,
    foco: 'Números & contagem', emoji: '🔢', cor: 'from-emerald-500 to-teal-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'count', tag: 'Quantas estrelas?', cor: 'sun', wide: true, shape: 'star', counts: [1, 2, 3, 4, 5] },
      { type: 'count', tag: 'Quantos corações?', cor: 'coral', wide: true, shape: 'heart', counts: [3, 5, 2, 4] },
    ],
  },
  {
    slug: 'continue-o-padrao', title: 'Continue o Padrão', subtitle: 'Descubra qual forma vem depois', idade: B_45,
    foco: 'Lógica & atenção', emoji: '🔷', cor: 'from-sky-500 to-cyan-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'pattern', tag: 'Sequência 1', cor: 'sky', wide: true, rows: [['circle', 'square', 'circle', 'square', '?', '?']] },
      { type: 'pattern', tag: 'Sequência 2', cor: 'mint', wide: true, rows: [['star', 'star', 'heart', 'star', 'star', '?']] },
      { type: 'pattern', tag: 'Sequência 3', cor: 'coral', wide: true, rows: [['triangle', 'circle', 'diamond', 'triangle', 'circle', '?']] },
    ],
  },
  {
    slug: 'ligue-os-pontos-estrela', title: 'Ligue os Pontos', subtitle: 'De 1 a 5 aparece uma estrela!', idade: B_45,
    foco: 'Números & traçado', emoji: '⭐', cor: 'from-amber-400 to-yellow-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'dotToDot', tag: 'Descubra o desenho', cor: 'sun', wide: true, shape: 'estrela' },
      { type: 'draw', tag: 'Agora pinte e decore', cor: 'coral', wide: true, hint: 'Deixe a estrela bem colorida!' },
    ],
  },
  {
    slug: 'minhas-emocoes', title: 'Minhas Emoções', subtitle: 'Conhecer o que a gente sente', idade: B_45,
    foco: 'Socioemocional', emoji: '💛', cor: 'from-amber-400 to-orange-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'faces', tag: 'Como eu me sinto hoje?', cor: 'coral', wide: true },
      { type: 'draw', tag: 'Meu rosto feliz', cor: 'sun', hint: 'Desenhe seu sorriso!', tall: true },
      { type: 'draw', tag: 'O que me deixa bravo', cor: 'sky', hint: 'Desenhe ou represente.', tall: true },
      { type: 'lines', tag: 'Hoje eu me sinto assim porque...', cor: 'brand', wide: true, n: 2 },
      { type: 'checks', tag: 'Quando fico bravo, eu posso...', cor: 'mint', wide: true,
        items: ['Respirar fundo 3 vezes', 'Pedir um abraço', 'Beber água', 'Contar até dez'] },
    ],
  },
  {
    slug: 'minha-rotina', title: 'Minha Rotina do Dia', subtitle: 'Marque cada passo do seu dia', idade: B_45,
    foco: 'Autonomia', emoji: '⏰', cor: 'from-violet-500 to-purple-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'checks', tag: 'De manhã', cor: 'sun', items: ['Acordar', 'Escovar os dentes', 'Tomar café', 'Me vestir'] },
      { type: 'checks', tag: 'De tarde', cor: 'sky', items: ['Almoçar', 'Estudar/Brincar', 'Descansar', 'Lanchar'] },
      { type: 'checks', tag: 'À noite', cor: 'brand', wide: true, items: ['Jantar', 'Tomar banho', 'Escovar os dentes', 'Dormir cedo'] },
      { type: 'draw', tag: 'A melhor parte do meu dia', cor: 'coral', wide: true, hint: 'Desenhe o seu momento favorito.' },
      { type: 'lines', tag: 'Amanhã eu quero...', cor: 'mint', wide: true, n: 1 },
    ],
  },

  // ---------------------------------------------------------------- 6–7 anos
  {
    slug: 'tracando-numeros', title: 'Traçando os Números', subtitle: 'Cubra e escreva • 1 a 10', idade: B_67,
    foco: 'Números & traçado', emoji: '✏️', cor: 'from-rose-500 to-red-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'traceChars', tag: 'Números 1 a 5', cor: 'brand', wide: true, per: 7, chars: ['1', '2', '3', '4', '5'] },
      { type: 'traceChars', tag: 'Números 6 a 10', cor: 'coral', wide: true, per: 7, chars: ['6', '7', '8', '9', '10'] },
    ],
  },
  {
    slug: 'tracando-alfabeto', title: 'Traçando o Alfabeto', subtitle: 'Cubra cada letra • A a Z', idade: B_67,
    foco: 'Letras & traçado', emoji: '🔤', cor: 'from-emerald-500 to-teal-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'gridChars', tag: 'Letras maiúsculas', cor: 'sky', wide: true, chars: ABC },
      { type: 'traceChars', tag: 'Escreva o seu nome', cor: 'sun', wide: true, per: 10, chars: [' '] },
    ],
  },
  {
    slug: 'tracando-palavras', title: 'Traçando Palavras', subtitle: 'Cubra as palavrinhas e leia em voz alta', idade: B_67,
    foco: 'Leitura & escrita', emoji: '📝', cor: 'from-indigo-500 to-blue-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'traceChars', tag: 'Família', cor: 'brand', wide: true, per: 3, chars: ['MAMÃE', 'PAPAI', 'VOVÓ'] },
      { type: 'traceChars', tag: 'Do dia a dia', cor: 'coral', wide: true, per: 3, chars: ['CASA', 'BOLA', 'AMOR'] },
    ],
  },
  {
    slug: 'ligue-numero-quantidade', title: 'Ligue Número e Quantidade', subtitle: 'Cada número tem a sua quantidade', idade: B_67,
    foco: 'Numeracia & lógica', emoji: '🔗', cor: 'from-sky-500 to-cyan-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'match', tag: 'Ligue os pares', cor: 'sky', wide: true, seed: 3,
        pairs: [['1', '●'], ['2', '● ●'], ['3', '● ● ●'], ['4', '● ● ● ●'], ['5', '● ● ● ● ●']] },
      { type: 'match', tag: 'Mais um desafio', cor: 'coral', wide: true, seed: 9,
        pairs: [['6', '● ● ● ● ● ●'], ['7', '● ● ● ● ● ● ●'], ['8', '● ● ● ● ● ● ● ●']] },
    ],
  },
  {
    slug: 'ligue-os-pontos-casinha', title: 'Ligue os Pontos: Casinha', subtitle: 'De 1 a 5 aparece uma casinha', idade: B_67,
    foco: 'Números & traçado', emoji: '🏠', cor: 'from-amber-400 to-orange-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'dotToDot', tag: 'Descubra o desenho', cor: 'sun', wide: true, shape: 'casinha' },
      { type: 'draw', tag: 'Desenhe quem mora nela', cor: 'mint', wide: true, hint: 'Complete a cena da casinha.' },
    ],
  },
  {
    slug: 'labirinto-do-bichinho', title: 'Labirinto do Bichinho', subtitle: 'Ajude a chegar do início ao fim', idade: B_67,
    foco: 'Traçado & foco', emoji: '🐭', cor: 'from-teal-400 to-emerald-500', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'maze', tag: 'Encontre o caminho', cor: 'mint', wide: true, cols: 11, rows: 11, seed: 42, cs: 30 },
    ],
  },
  {
    slug: 'primeiras-continhas', title: 'Primeiras Continhas', subtitle: 'Somar é fácil e divertido • até 10', idade: B_67,
    foco: 'Somar & raciocínio', emoji: '➕', cor: 'from-rose-500 to-pink-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'math', tag: 'Some os números', cor: 'coral', wide: true, problems: [
        [1, '+', 1], [2, '+', 1], [2, '+', 2], [3, '+', 1], [3, '+', 2], [4, '+', 1],
        [4, '+', 3], [5, '+', 2], [5, '+', 5], [6, '+', 2], [3, '+', 3], [7, '+', 1]] },
    ],
  },
  {
    slug: 'meu-nome-minhas-letras', title: 'Meu Nome e Minhas Letras', subtitle: 'Treine a escrita do seu nome', idade: B_67,
    foco: 'Escrita & identidade', emoji: '🖊️', cor: 'from-violet-500 to-purple-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'lines', tag: 'Escreva seu nome completo', cor: 'brand', wide: true, n: 3 },
      { type: 'gridChars', tag: 'As letras do meu nome', cor: 'sky', wide: true, chars: ABC.slice(0, 12) },
      { type: 'draw', tag: 'A inicial do meu nome, decorada', cor: 'coral', wide: true, hint: 'Desenhe a primeira letra bem enfeitada.' },
    ],
  },
  {
    slug: 'ligue-os-pontos-peixe', title: 'Ligue os Pontos: Peixinho', subtitle: 'De 1 a 7 nasce um peixe', idade: B_67,
    foco: 'Números & traçado', emoji: '🐠', cor: 'from-sky-500 to-blue-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'dotToDot', tag: 'Descubra o desenho', cor: 'sky', wide: true, shape: 'peixe' },
      { type: 'draw', tag: 'Desenhe o fundo do mar', cor: 'mint', wide: true, hint: 'Coloque algas, bolhas e amigos do peixe.' },
    ],
  },

  {
    slug: 'ligue-os-opostos', title: 'Ligue os Opostos', subtitle: 'Cada palavra tem o seu contrário', idade: B_67,
    foco: 'Vocabulário & lógica', emoji: '↔️', cor: 'from-fuchsia-500 to-pink-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'match', tag: 'Ligue os contrários', cor: 'coral', wide: true, seed: 5,
        pairs: [['Grande', 'Pequeno'], ['Dia', 'Noite'], ['Quente', 'Frio'], ['Cheio', 'Vazio'], ['Alto', 'Baixo']] },
      { type: 'match', tag: 'Mais opostos', cor: 'sky', wide: true, seed: 11,
        pairs: [['Feliz', 'Triste'], ['Rápido', 'Devagar'], ['Aberto', 'Fechado'], ['Limpo', 'Sujo']] },
    ],
  },

  // ---------------------------------------------------------------- 8+ anos
  {
    slug: 'labirinto-desafio', title: 'Labirinto Desafio', subtitle: 'Um labirinto maior para mentes espertas', idade: B_8,
    foco: 'Foco & planejamento', emoji: '🧩', cor: 'from-indigo-600 to-violet-700', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'maze', tag: 'Do verde ao vermelho', cor: 'brand', wide: true, cols: 16, rows: 16, seed: 77, cs: 22 },
    ],
  },
  {
    slug: 'continhas-de-subtracao', title: 'Continhas de Subtração', subtitle: 'Tire e descubra quanto sobra', idade: B_8,
    foco: 'Subtrair & raciocínio', emoji: '➖', cor: 'from-rose-500 to-red-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'math', tag: 'Subtraia os números', cor: 'coral', wide: true, problems: [
        [5, '−', 2], [7, '−', 3], [9, '−', 4], [8, '−', 5], [10, '−', 6], [6, '−', 1],
        [12, '−', 4], [11, '−', 5], [10, '−', 10], [14, '−', 7], [13, '−', 8], [15, '−', 9]] },
    ],
  },
  {
    slug: 'tabuada-do-2-e-5', title: 'Tabuada do 2 e do 5', subtitle: 'Multiplicar brincando', idade: B_8,
    foco: 'Multiplicação', emoji: '✖️', cor: 'from-emerald-500 to-green-600', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'math', tag: 'Tabuada do 2', cor: 'mint', wide: true, problems: Array.from({ length: 6 }, (_, i) => [2, '×', i + 1]).concat(Array.from({ length: 4 }, (_, i) => [2, '×', i + 7])) },
      { type: 'math', tag: 'Tabuada do 5', cor: 'sky', wide: true, problems: Array.from({ length: 6 }, (_, i) => [5, '×', i + 1]).concat(Array.from({ length: 4 }, (_, i) => [5, '×', i + 7])) },
    ],
  },
  {
    slug: 'contas-de-somar-ate-20', title: 'Somar até 20', subtitle: 'Um desafio de somas maiores', idade: B_8,
    foco: 'Somar & cálculo', emoji: '🧮', cor: 'from-sky-600 to-blue-700', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'math', tag: 'Some com atenção', cor: 'brand', wide: true, problems: [
        [8, '+', 5], [7, '+', 6], [9, '+', 8], [11, '+', 4], [12, '+', 7], [10, '+', 9],
        [13, '+', 5], [6, '+', 9], [14, '+', 6], [8, '+', 8], [15, '+', 4], [9, '+', 9]] },
    ],
  },
  {
    slug: 'labirinto-mestre', title: 'Labirinto Mestre', subtitle: 'O maior desafio da coleção', idade: B_8,
    foco: 'Foco & persistência', emoji: '🏆', cor: 'from-purple-600 to-fuchsia-700', id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'maze', tag: 'Chegue até o troféu', cor: 'brand', wide: true, cols: 19, rows: 19, seed: 123, cs: 19 },
    ],
  },
]

// ===================================================================== execução
async function acharBrowser() {
  const cand = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ]
  for (const p of cand) { try { await fs.access(p); return p } catch {} }
  return null
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const gerados = []
  for (const f of FICHAS) {
    await fs.writeFile(path.join(OUT_DIR, `${f.slug}.html`), renderFicha(f), 'utf8')
    gerados.push(f)
    console.log('HTML  ✔', `${f.slug}.html`)
  }

  // manifest para a página /atividades
  const manifest = FICHAS.map((f) => ({
    slug: f.slug, title: f.title, subtitle: f.subtitle, idade: f.idade,
    foco: f.foco, emoji: f.emoji, cor: f.cor,
  }))
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
  console.log('MANIFEST ✔ manifest.json')

  if (SEM_PDF) return listar(gerados)
  const browser = await acharBrowser()
  if (!browser) { console.warn('\n⚠  Edge/Chrome não encontrado — PDFs não gerados.'); return listar(gerados) }
  console.log(`\nGerando PDFs com: ${path.basename(browser)}`)
  for (const f of gerados) {
    const pdfPath = path.join(OUT_DIR, `${f.slug}.pdf`)
    const url = pathToFileURL(path.join(OUT_DIR, `${f.slug}.html`)).href
    try {
      await execFileP(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, url], { timeout: 90000 })
      console.log('PDF   ✔', `${f.slug}.pdf`)
    } catch (e) { console.warn('PDF   ✘', `${f.slug}.pdf`, '—', e.shortMessage || e.message) }
  }
  listar(gerados)
}
function listar(gerados) {
  console.log(`\n✔ ${gerados.length} ficha(s) em public/atividades/`)
}
main().catch((e) => { console.error(e); process.exit(1) })
