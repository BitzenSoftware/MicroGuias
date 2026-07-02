'use client'

import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Worker do pdf.js servido por CDN (evita configurar bundler)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export function PdfReader({
  ebookId,
  amostra = false,
  paywall,
  moduloId,
}: {
  ebookId: string
  amostra?: boolean
  paywall?: React.ReactNode
  moduloId?: string
}) {
  const areaRef = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [area, setArea] = useState({ w: 700, h: 900 })
  const [ratio, setRatio] = useState(0.77) // largura/altura da página (estimativa inicial)

  // Em amostra há um "slide" extra no fim: o paywall
  const totalSlides = numPages + (amostra ? 1 : 0)
  const noPaywall = amostra && numPages > 0 && pagina > numPages

  // Resolve a fonte do PDF a cada troca de ebook
  useEffect(() => {
    setErro(null)
    setNumPages(0)
    setPagina(1)

    if (amostra) {
      // carimbo de tempo evita servir uma amostra antiga do cache do navegador
      setUrl(`/api/amostra/${ebookId}?t=${Date.now()}`)
      return
    }

    // Módulo de curso ou ebook completo — valida a posse e devolve URL assinada
    const endpoint = moduloId ? `/api/ler-modulo/${moduloId}` : `/api/ler/${ebookId}`
    let ativo = true
    setUrl(null)
    fetch(endpoint)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Falha ao abrir')
        if (ativo) setUrl(data.url)
      })
      .catch((e) => ativo && setErro(e.message))
    return () => { ativo = false }
  }, [ebookId, amostra, moduloId])

  // Mede a área disponível (largura e altura)
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const medir = () => setArea({ w: el.clientWidth, h: el.clientHeight })
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Setas do teclado navegam os slides
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setPagina((p) => Math.min(p + 1, totalSlides))
      if (e.key === 'ArrowLeft') setPagina((p) => Math.max(p - 1, 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [totalSlides])

  const anterior = () => setPagina((p) => Math.max(p - 1, 1))
  const proxima = () => setPagina((p) => Math.min(p + 1, totalSlides))

  // Enquadra a página inteira: limita pela largura E pela altura disponíveis
  const pad = 32
  const larguraPagina = Math.max(
    280,
    Math.min(area.w - pad, (area.h - pad) * ratio)
  )

  return (
    <div className="h-full flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      {amostra && (
        <div className="bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-medium text-center py-2 px-4">
          🔓 Você está lendo uma amostra grátis das primeiras páginas
        </div>
      )}

      {/* Área da página (preenche o espaço, centralizada) */}
      <div
        ref={areaRef}
        className="flex-1 min-h-0 overflow-auto bg-gray-100 select-none flex items-center justify-center p-4"
      >
        {erro && (
          <div className="text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-gray-600">{erro}</p>
          </div>
        )}

        {!erro && !url && (
          <div className="text-center text-gray-400">
            <p className="text-3xl mb-2 animate-pulse">📖</p>
            <p className="text-sm">Abrindo ebook…</p>
          </div>
        )}

        {/* Slide de paywall (fim da amostra) */}
        {noPaywall && <div className="w-full max-w-md">{paywall}</div>}

        {url && !noPaywall && (
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setErro('Não foi possível carregar o PDF.')}
            loading={
              <div className="text-center text-gray-400 py-10">
                <p className="text-3xl mb-2 animate-pulse">📖</p>
                <p className="text-sm">Carregando…</p>
              </div>
            }
          >
            <div className="shadow-lg rounded-md overflow-hidden bg-white">
              <Page
                pageNumber={Math.min(pagina, numPages || 1)}
                width={larguraPagina}
                onLoadSuccess={(page) => {
                  if (page.originalWidth && page.originalHeight) {
                    setRatio(page.originalWidth / page.originalHeight)
                  }
                }}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          </Document>
        )}
      </div>

      {/* Barra de navegação */}
      {url && numPages > 0 && (
        <div className="flex items-center justify-center gap-4 border-t border-gray-100 bg-white py-3 px-4">
          <button
            type="button"
            onClick={anterior}
            disabled={pagina <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            ‹ Anterior
          </button>

          <span className="text-sm text-gray-500 tabular-nums min-w-28 text-center">
            {noPaywall ? 'Fim da amostra' : `Página ${pagina} de ${numPages}`}
            {amostra && !noPaywall ? ' (amostra)' : ''}
          </span>

          <button
            type="button"
            onClick={proxima}
            disabled={pagina >= totalSlides}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {amostra && pagina === numPages ? '🔒 Continuar' : 'Próxima ›'}
          </button>
        </div>
      )}
    </div>
  )
}
