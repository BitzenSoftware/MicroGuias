'use client'

import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Worker do pdf.js servido por CDN (evita configurar bundler)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export function PdfReader({ ebookId }: { ebookId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [largura, setLargura] = useState(700)

  // Busca a URL assinada de leitura a cada troca de ebook
  useEffect(() => {
    let ativo = true
    setUrl(null)
    setErro(null)
    setNumPages(0)
    fetch(`/api/ler/${ebookId}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Falha ao abrir')
        if (ativo) setUrl(data.url)
      })
      .catch((e) => ativo && setErro(e.message))
    return () => { ativo = false }
  }, [ebookId])

  // Largura responsiva das páginas
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const medir = () => setLargura(Math.min(el.clientWidth - 32, 900))
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="h-full overflow-y-auto bg-gray-100 select-none flex flex-col items-center py-6 px-4"
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
              <p className="text-sm">Carregando páginas…</p>
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} className="mb-4 shadow-md rounded-md overflow-hidden bg-white">
              <Page
                pageNumber={i + 1}
                width={largura}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      )}
    </div>
  )
}
