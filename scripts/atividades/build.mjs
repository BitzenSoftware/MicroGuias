// @ts-check
/**
 * Gerador da coleção "Atividades para Imprimir" (Micro Guias).
 *
 * - Define as fichas como DADOS (array FICHAS).
 * - Renderiza cada uma para public/atividades/<slug>.html (A4, pronta p/ impressão).
 * - Converte cada HTML em <slug>.pdf usando o Edge/Chrome headless (--print-to-pdf),
 *   sem dependências novas. Use "--no-pdf" para pular essa etapa.
 *
 * Uso:  node scripts/atividades/build.mjs
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

// ============================================================ paleta / doodles
const FOOTER = 'Atividades para imprimir e aprender • uso pessoal e escolar'

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
  livro: `<svg viewBox="0 0 28 28" fill="none" stroke="#34343E" stroke-width="2.2" stroke-linejoin="round"><path d="M14 7c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V6c-3-1-7-1-10 1z" fill="#FBB13C"/><path d="M14 7v15"/></svg>`,
  musica: `<svg viewBox="0 0 28 28" fill="none" stroke="#34343E" stroke-width="2.2" stroke-linejoin="round"><path d="M11 20V7l10-2v11" /><circle cx="8" cy="20" r="3" fill="#FF6B6B"/><circle cx="18" cy="16" r="3" fill="#FF6B6B"/></svg>`,
}

// ============================================================ carinhas (emoções)
const FACES = [
  ['Feliz', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M16 29c3 4 13 4 16 0" fill="none"/>`],
  ['Animado', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M15 25c3-4 15-4 18 0" fill="none"/><path d="M9 16l7 3M39 16l-7 3"/>`],
  ['Calmo', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M16 28h16" fill="none"/>`],
  ['Triste', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="20" r="1.6" fill="#34343E"/><circle cx="31" cy="20" r="1.6" fill="#34343E"/><path d="M16 31c3-4 13-4 16 0" fill="none"/>`],
  ['Bravo', `<circle cx="24" cy="24" r="20"/><circle cx="17" cy="21" r="1.6" fill="#34343E"/><circle cx="31" cy="21" r="1.6" fill="#34343E"/><path d="M16 31c3-4 13-4 16 0" fill="none"/><path d="M13 15l6 3M35 15l-6 3"/>`],
]

// ============================================================ traçados (SVG "d")
const W = 540
function genWave(y, amp = 15, step = 56) {
  let d = `M8 ${y} `
  for (let x = 8; x < W; x += step) d += `q ${step / 2} ${-amp} ${step} 0 `
  return d
}
function genHill(y, amp = 22, step = 40) {
  let d = `M8 ${y} `
  for (let x = 8; x < W; x += step) d += `q ${step / 2} ${-amp} ${step} 0 `
  return d
}
function genZig(y, amp = 20, step = 30) {
  let d = `M8 ${y} `
  let up = true
  for (let x = 8; x < W; x += step) { d += `L ${x + step} ${up ? y - amp : y + amp} `; up = !up }
  return d
}
function genLoop(y, r = 16, step = 34) {
  let d = `M8 ${y} `
  for (let x = 8; x < W; x += step) d += `c ${r / 2} ${-r * 2} ${r * 1.5} ${-r * 2} ${r} 0 s ${r / 2} ${r} ${step - r} 0 `
  return d
}
const TRACE_GEN = { wave: genWave, hill: genHill, zigzag: genZig, loop: genLoop }
const DOT_COLORS = ['#2FB8A0', '#FF6B6B', '#3FA9E0', '#FBB13C']

// ============================================================ helpers de cartão
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const tagHtml = (tag, cor) => `<span class="tag t-${cor}">${esc(tag)}</span>`
const hintHtml = (h) => (h ? `<p class="hint">${esc(h)}</p>` : '')

function lines(n = 1) {
  return `<div class="lines">${Array.from({ length: n }, () => '<div class="ln"></div>').join('')}</div>`
}

const BUILDERS = {
  draw: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}
    <div class="draw ${c.tall ? 'tall' : ''}">✏️ desenhe aqui</div></section>`,

  lines: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}
    ${lines(c.n || 2)}</section>`,

  faces: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Faça um círculo na carinha que combina com você.')}
    <div class="faces">${FACES.map(([nome, svg]) =>
      `<div class="face"><svg viewBox="0 0 48 48" fill="#FFF3D6" stroke="#34343E" stroke-width="2.4" stroke-linecap="round">${svg}</svg>${nome}</div>`
    ).join('')}</div></section>`,

  favs: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}
    <div class="favs">${c.items.map((it) =>
      `<div class="fav">${ICONS[it.icon] || ''}<div class="col"><span>${esc(it.label)}</span><div class="rule"></div></div></div>`
    ).join('')}</div></section>`,

  checks: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint)}
    <div class="checks">${c.items.map((t) => `<label class="chk"><span class="box"></span> ${esc(t)}</label>`).join('')}</div>
    ${c.extraLabel ? `<p class="hint" style="margin-top:12px">${esc(c.extraLabel)}</p>${lines(1)}` : ''}</section>`,

  traceLines: (c) => {
    const kinds = c.rows || ['wave', 'zigzag', 'loop']
    const gap = 120 / (kinds.length + 1)
    const paths = kinds.map((k, i) => {
      const y = gap * (i + 1)
      const d = (TRACE_GEN[k] || genWave)(y)
      const col = DOT_COLORS[i % DOT_COLORS.length]
      return `<circle cx="8" cy="${y}" r="5" fill="${col}" stroke="none"/><path d="${d}"/>`
    }).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Cubra o pontilhado com o lápis, sem tirar a mão. 🖍️')}
      <div class="trace"><svg viewBox="0 0 ${W} 120" fill="none" stroke="#9AA0B2" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9">${paths}</svg></div></section>`
  },

  // Linhas grandes p/ traçar caracteres (números, letras): cada char repetido em "fantasma".
  traceChars: (c) => {
    const per = c.per || 6
    const rows = c.chars.map((ch) =>
      `<div class="trow">${Array.from({ length: per }, () => `<span class="ghost">${esc(ch)}</span>`).join('')}</div>`
    ).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Passe o lápis por cima. Depois escreva sozinho!')}
      <div class="tset">${rows}</div></section>`
  },

  // Grade de caracteres p/ traçar (alfabeto compacto).
  gridChars: (c) => {
    const cells = c.chars.map((ch) => `<div class="gcell"><span class="ghost">${esc(ch)}</span></div>`).join('')
    return `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}${hintHtml(c.hint || 'Cubra cada letrinha com o lápis.')}
      <div class="gchars">${cells}</div></section>`
  },

  note: (c) => `<section class="card ${c.wide ? 'wide' : ''}">${tagHtml(c.tag, c.cor)}
    <p class="notetext">${esc(c.text)}</p></section>`,
}

// ============================================================ montagem da página
function idRow(fields) {
  const cls = fields.length === 3 ? 'id id-3' : 'id id-2'
  return `<div class="${cls}">${fields.map((f) =>
    `<div class="field"><span>${esc(f)}</span><div class="rule"></div></div>`).join('')}</div>`
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
    <p>${esc(f.subtitle)}</p>
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

// ============================================================ CSS (compartilhado)
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
.head h1{margin:2px 0;font-size:40px;line-height:.98;letter-spacing:.5px;text-transform:uppercase;text-wrap:balance;-webkit-text-stroke:1.2px var(--ink);color:var(--sun);text-shadow:2.5px 2.5px 0 var(--ink)}
.head p{margin:0;font-size:15px;color:var(--muted);font-weight:700}
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
footer{margin-top:12px;display:flex;align-items:center;justify-content:space-between;font-family:system-ui,sans-serif;font-size:11px;color:var(--muted);font-weight:700}
footer .brand{display:flex;align-items:center;gap:7px;color:var(--brand)}footer .brand b{font-size:13px}
@page{size:A4;margin:0}
@media print{body{background:#fff;padding:0}.noprint{display:none!important}.stage{overflow:visible}.sheet{box-shadow:none;margin:0;width:210mm}}
`

// ============================================================ DADOS DAS FICHAS
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const FICHAS = [
  {
    slug: 'tudo-sobre-mim', title: 'Tudo Sobre Mim', subtitle: 'Meu caderno de atividades • pinte, escreva e desenhe!',
    id: ['Meu nome é', 'Tenho (anos)', 'Data'],
    cards: [
      { type: 'draw', tag: 'Meu autorretrato', cor: 'brand', hint: 'Desenhe você sorrindo!', tall: true },
      { type: 'draw', tag: 'Minha família', cor: 'mint', hint: 'Quem mora com você?', tall: true },
      { type: 'faces', tag: 'Como eu estou hoje?', cor: 'coral', wide: true },
      { type: 'favs', tag: 'Minhas coisas favoritas', cor: 'sun', items: [
        { icon: 'comida', label: 'Comida' }, { icon: 'coracao', label: 'Cor preferida' },
        { icon: 'bola', label: 'Brincadeira' }, { icon: 'animal', label: 'Animal' } ] },
      { type: 'checks', tag: 'Eu já consigo!', cor: 'sky', hint: 'Marque o que você já faz sozinho.',
        items: ['Escovar os dentes', 'Guardar os brinquedos', 'Me vestir', 'Calçar o tênis'],
        extraLabel: 'Uma coisa nova que aprendi:' },
      { type: 'traceLines', tag: 'Vamos traçar!', cor: 'mint', wide: true, rows: ['wave', 'zigzag', 'loop'] },
      { type: 'lines', tag: 'Quando eu crescer, quero ser...', cor: 'coral', wide: true, n: 2 },
    ],
  },
  {
    slug: 'vamos-tracar', title: 'Vamos Traçar!', subtitle: 'Treine a mãozinha seguindo os caminhos pontilhados',
    id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'traceLines', tag: 'Ondas do mar', cor: 'sky', wide: true, rows: ['wave', 'wave', 'wave'] },
      { type: 'traceLines', tag: 'Montanhas', cor: 'mint', wide: true, rows: ['hill', 'hill', 'hill'] },
      { type: 'traceLines', tag: 'Zigue-zague', cor: 'coral', wide: true, rows: ['zigzag', 'zigzag', 'zigzag'] },
      { type: 'traceLines', tag: 'Laços e voltinhas', cor: 'brand', wide: true, rows: ['loop', 'loop', 'loop'] },
    ],
  },
  {
    slug: 'tracando-numeros', title: 'Traçando os Números', subtitle: 'Cubra os números e depois escreva sozinho • 1 a 10',
    id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'traceChars', tag: 'Números 1 a 5', cor: 'brand', wide: true, per: 7, chars: ['1', '2', '3', '4', '5'] },
      { type: 'traceChars', tag: 'Números 6 a 10', cor: 'coral', wide: true, per: 7, chars: ['6', '7', '8', '9', '10'] },
    ],
  },
  {
    slug: 'tracando-alfabeto', title: 'Traçando o Alfabeto', subtitle: 'Cubra cada letra com o lápis • A a Z',
    id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'gridChars', tag: 'Letras maiúsculas', cor: 'sky', wide: true, chars: ABC },
      { type: 'traceChars', tag: 'Escreva o seu nome', cor: 'sun', wide: true, per: 10, chars: [' '] },
    ],
  },
  {
    slug: 'minhas-emocoes', title: 'Minhas Emoções', subtitle: 'Conhecer o que a gente sente também é aprender',
    id: ['Meu nome é', 'Data'],
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
    slug: 'minha-rotina', title: 'Minha Rotina do Dia', subtitle: 'Marque cada passo do seu dia e ganhe autonomia',
    id: ['Meu nome é', 'Data'],
    cards: [
      { type: 'checks', tag: 'De manhã', cor: 'sun', items: ['Acordar', 'Escovar os dentes', 'Tomar café', 'Me vestir'] },
      { type: 'checks', tag: 'De tarde', cor: 'sky', items: ['Almoçar', 'Estudar/Brincar', 'Descansar', 'Lanchar'] },
      { type: 'checks', tag: 'À noite', cor: 'brand', wide: true, items: ['Jantar', 'Tomar banho', 'Escovar os dentes', 'Dormir cedo'] },
      { type: 'draw', tag: 'A melhor parte do meu dia', cor: 'coral', wide: true, hint: 'Desenhe o seu momento favorito.' },
      { type: 'lines', tag: 'Amanhã eu quero...', cor: 'mint', wide: true, n: 1 },
    ],
  },
]

// ============================================================ execução
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
    const html = renderFicha(f)
    const htmlPath = path.join(OUT_DIR, `${f.slug}.html`)
    await fs.writeFile(htmlPath, html, 'utf8')
    gerados.push({ ...f, htmlPath })
    console.log('HTML  ✔', `${f.slug}.html`)
  }

  if (SEM_PDF) { console.log('\n(pulei os PDFs: --no-pdf)'); return listar(gerados) }

  const browser = await acharBrowser()
  if (!browser) {
    console.warn('\n⚠  Edge/Chrome não encontrado — PDFs não gerados. Abra cada .html e "Salvar como PDF".')
    return listar(gerados)
  }
  console.log(`\nGerando PDFs com: ${path.basename(browser)}`)
  for (const f of gerados) {
    const pdfPath = path.join(OUT_DIR, `${f.slug}.pdf`)
    const url = pathToFileURL(f.htmlPath).href
    try {
      await execFileP(browser, [
        '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
        `--print-to-pdf=${pdfPath}`, url,
      ], { timeout: 90000 })
      console.log('PDF   ✔', `${f.slug}.pdf`)
    } catch (e) {
      console.warn('PDF   ✘', `${f.slug}.pdf`, '—', e.shortMessage || e.message)
    }
  }
  listar(gerados)
}

function listar(gerados) {
  console.log(`\n✔ ${gerados.length} ficha(s) em public/atividades/`)
  console.log('   Slugs:', gerados.map((f) => f.slug).join(', '))
}

main().catch((e) => { console.error(e); process.exit(1) })
