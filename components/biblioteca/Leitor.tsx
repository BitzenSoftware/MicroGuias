'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// Leitor só no cliente (pdf.js usa APIs de browser)
const PdfReader = dynamic(
  () => import('./PdfReader').then((m) => m.PdfReader),
  { ssr: false }
)

export type EbookBiblioteca = {
  id: string
  titulo: string
  capa_url: string | null
}

export function Leitor({ ebooks }: { ebooks: EbookBiblioteca[] }) {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<EbookBiblioteca | null>(ebooks[0] ?? null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return ebooks
    return ebooks.filter((e) => e.titulo.toLowerCase().includes(q))
  }, [busca, ebooks])

  return (
    <div className="flex h-[calc(100vh-9rem)] border border-gray-200 rounded-2xl overflow-hidden bg-white">
      {/* Coluna esquerda: lista + busca */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-3 border-b border-gray-100">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="🔍 Buscar ebook…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtrados.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 px-3">
              Nenhum ebook encontrado.
            </p>
          ) : (
            filtrados.map((e) => {
              const ativo = selecionado?.id === e.id
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelecionado(e)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    ativo ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="relative h-14 w-10 flex-shrink-0 rounded overflow-hidden bg-white border border-gray-100">
                    {e.capa_url ? (
                      <Image src={e.capa_url} alt={e.titulo} fill className="object-contain p-0.5" sizes="40px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-lg">📖</div>
                    )}
                  </div>
                  <span className={`text-sm leading-snug line-clamp-3 ${ativo ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                    {e.titulo}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Coluna direita: leitor */}
      <section className="flex-1 min-w-0">
        {selecionado ? (
          <PdfReader key={selecionado.id} ebookId={selecionado.id} />
        ) : (
          <div className="h-full flex items-center justify-center text-center text-gray-400">
            <div>
              <p className="text-4xl mb-3">📚</p>
              <p>Selecione um ebook à esquerda para começar a ler.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
