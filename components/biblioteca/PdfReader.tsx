'use client'

import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Worker do pdf.js servido por CDN (evita configurar bundler)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export function PdfReader({ ebookId }: { ebookId: string }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [largura, setLargura] = useState(700)

  // Busca a URL assinada de leitura a cada troca de ebook
  useEffect(() => {
    let ativo = true
    setUrl(null)
    setErro(null)
    setNumPages(0)
    setPagina(1)
    fetch(`/api/ler/${ebookId}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Falha ao abrir')
        if (ativo) setUrl(data.url)
      })
      .catch((e) => ativo && setErro(e.message))
    return () => { ativo = false }
  }, [ebookId])

  // Página ocupa toda a largura disponível do lado direito
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const medir = () => setLargura(Math.max(320, el.clientWidth - 48))
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Setas do teclado navegam as páginas
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setPagina((p) => Math.min(p + 1, numPages))
      if (e.key === 'ArrowLeft') setPagina((p) => Math.max(p - 1, 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [numPages])

  const anterior = () => setPagina((p) => Math.max(p - 1, 1))
  const proxima = () => setPagina((p) => Math.min(p + 1, numPages))

  return (
    <div className="h-full flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      {/* Área da página (preenche o espaço) */}
      <div
        ref={areaRef}
        className="flex-1 min-h-0 overflow-auto bg-gray-100 select-none flex justify-center py-6 px-4"
      >
        {erro && (
          <div className="m-auto text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-gray-600">{erro}</p>
          </div>
        )}

        {!erro && !url && (
          <div className="m-auto text-center text-gray-400">
            <p className="text-3xl mb-2 animate-pulse">📖</p>
            <p className="text-sm">Abrindo ebook…</p>
          </div>
        )}

        {url && (
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setErro('Não foi possível carregar o PDF.')}
            loading={
              <div className="m-auto text-center text-gray-400 py-10">
                <p className="text-3xl mb-2 animate-pulse">📖</p>
                <p className="text-sm">Carregando…</p>
              </div>
            }
          >
            <div className="shadow-lg rounded-md overflow-hidden bg-white h-fit">
              <Page
                pageNumber={pagina}
                width={largura}
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

          <span className="text-sm text-gray-500 tabular-nums min-w-24 text-center">
            Página {pagina} de {numPages}
          </span>

          <button
            type="button"
            onClick={proxima}
            disabled={pagina >= numPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Próxima ›
          </button>
        </div>
      )}
    </div>
  )
}
