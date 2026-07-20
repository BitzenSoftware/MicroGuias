// @ts-check
/**
 * Monta o PDF de um livro para colorir a partir das imagens (line art) geradas.
 * Usa pdf-lib (já é dependência do projeto). Sem build/JSX.
 *
 * Uso:  node scripts/gerar_pdf_colorir.mjs
 *
 * Coloque as imagens em public/livros-colorir/animais-amigos/ com os nomes
 * definidos em PAGINAS abaixo (ver _COMO-USAR.md nessa pasta).
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(__dirname, '..', 'public', 'livros-colorir', 'animais-amigos')
const OUT = path.join(DIR, 'Animais-Amigos.pdf')

// A4 retrato, em pontos
const A4 = { w: 595.28, h: 841.89 }
const RODAPE = 'Micro Guias — Livros para Colorir'

// Ordem das páginas do livro (a capa é tratada à parte)
const PAGINAS = [
  { file: '01-gato.png', nome: 'Gatinho' },
  { file: '02-cachorro.png', nome: 'Cachorrinho' },
  { file: '03-coelho.png', nome: 'Coelho' },
  { file: '04-leao.png', nome: 'Leãozinho' },
  { file: '05-elefante.png', nome: 'Elefantinho' },
  { file: '06-peixe.png', nome: 'Peixinho' },
  { file: '07-tartaruga.png', nome: 'Tartaruga' },
  { file: '08-passarinho.png', nome: 'Passarinho' },
  { file: '09-abelha.png', nome: 'Abelhinha' },
  { file: '10-borboleta.png', nome: 'Borboleta' },
  { file: '11-pinguim.png', nome: 'Pinguim' },
  { file: '12-girafa.png', nome: 'Girafa' },
  { file: '13-sapo.png', nome: 'Sapinho' },
]

/** Lê um arquivo tentando .png e .jpg; retorna null se não existir. */
async function lerImagem(base) {
  const candidatos = /\.(png|jpe?g)$/i.test(base)
    ? [base, base.replace(/\.png$/i, '.jpg'), base.replace(/\.jpe?g$/i, '.png')]
    : [`${base}.png`, `${base}.jpg`, `${base}.jpeg`]
  for (const nome of candidatos) {
    try {
      return { bytes: await fs.readFile(path.join(DIR, nome)), nome }
    } catch {
      /* tenta o próximo */
    }
  }
  return null
}

/** Embute PNG ou JPG detectando pela assinatura do arquivo. */
async function embutir(pdf, bytes) {
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 // "\x89P"
  return isPng ? pdf.embedPng(bytes) : pdf.embedJpg(bytes)
}

async function main() {
  const pdf = await PDFDocument.create()
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  // ---- Capa (imagem ocupando a página inteira, preservando proporção) ----
  const capa = await lerImagem('capa')
  if (capa) {
    const img = await embutir(pdf, capa.bytes)
    const page = pdf.addPage([A4.w, A4.h])
    const escala = Math.max(A4.w / img.width, A4.h / img.height) // cobre a página
    const w = img.width * escala
    const h = img.height * escala
    page.drawImage(img, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h })
  } else {
    console.warn('⚠  capa.(png|jpg) não encontrada — pulando a capa.')
  }

  // ---- Páginas de colorir ----
  let incluidas = 0
  for (const p of PAGINAS) {
    const arq = await lerImagem(p.file)
    if (!arq) {
      console.warn(`⚠  faltando: ${p.file} — página "${p.nome}" pulada.`)
      continue
    }
    const img = await embutir(pdf, arq.bytes)
    const page = pdf.addPage([A4.w, A4.h])

    // Título no topo
    const tam = 28
    const larg = fontBold.widthOfTextAtSize(p.nome, tam)
    page.drawText(p.nome, {
      x: (A4.w - larg) / 2,
      y: A4.h - 72,
      size: tam,
      font: fontBold,
      color: rgb(0.12, 0.12, 0.12),
    })

    // Desenho, ajustado à área útil preservando proporção
    const margemX = 42
    const topo = A4.h - 100
    const base = 56
    const areaW = A4.w - margemX * 2
    const areaH = topo - base
    const escala = Math.min(areaW / img.width, areaH / img.height)
    const w = img.width * escala
    const h = img.height * escala
    page.drawImage(img, {
      x: (A4.w - w) / 2,
      y: base + (areaH - h) / 2,
      width: w,
      height: h,
    })

    // Rodapé
    const rod = 9
    const rodW = font.widthOfTextAtSize(RODAPE, rod)
    page.drawText(RODAPE, {
      x: (A4.w - rodW) / 2,
      y: 28,
      size: rod,
      font,
      color: rgb(0.6, 0.6, 0.6),
    })
    incluidas++
  }

  const bytes = await pdf.save()
  await fs.writeFile(OUT, bytes)
  console.log(`✔  PDF gerado: ${OUT}`)
  console.log(`   ${incluidas} página(s) de colorir${capa ? ' + capa' : ''}.`)
}

main().catch((e) => {
  console.error('Erro ao gerar o PDF:', e)
  process.exit(1)
})
