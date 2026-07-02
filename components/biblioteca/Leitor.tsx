'use client'

import { useEffect, useMemo, useState } from 'react'
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
  temPdf: boolean
  isCurso: boolean
  bonus: { id: string; nome: string }[]
  modulos: { id: string; titulo: string }[]
}

function PreparacaoAviso({ curso = false }: { curso?: boolean }) {
  return (
    <div className="h-full flex items-center justify-center text-center text-gray-500 p-8">
      <div className="max-w-sm">
        <p className="text-4xl mb-3">🛠️</p>
        <p className="font-semibold text-gray-700">Conteúdo em preparação</p>
        <p className="text-sm mt-1">
          {curso
            ? 'Os módulos deste curso ainda estão sendo publicados. Seu acesso já está garantido — em breve eles aparecerão aqui.'
            : 'Este ebook ainda está sendo finalizado. Seu acesso já está garantido — assim que o conteúdo for publicado, ele aparecerá aqui para leitura.'}
        </p>
      </div>
    </div>
  )
}

export function Leitor({ ebooks }: { ebooks: EbookBiblioteca[] }) {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<EbookBiblioteca | null>(ebooks[0] ?? null)
  const [moduloSel, setModuloSel] = useState<string | null>(null)

  // Ao trocar de ebook, seleciona o 1º módulo (se for curso)
  useEffect(() => {
    if (selecionado?.isCurso && selecionado.modulos.length > 0) {
      setModuloSel(selecionado.modulos[0].id)
    } else {
      setModuloSel(null)
    }
  }, [selecionado])

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
                  <span className="min-w-0">
                    <span className={`block text-sm leading-snug line-clamp-3 ${ativo ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                      {e.titulo}
                    </span>
                    {!e.temPdf && (
                      <span className="mt-0.5 inline-block text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                        em preparação
                      </span>
                    )}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Coluna direita: leitor + bônus */}
      <section className="flex-1 min-w-0 flex flex-col">
        {selecionado && selecionado.bonus.length > 0 && (
          <div className="border-b border-gray-100 bg-amber-50/70 px-4 py-2.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-amber-800">🎁 Bônus:</span>
            {selecionado.bonus.map((b) => (
              <a
                key={b.id}
                href={`/api/bonus/${b.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-white border border-amber-200 rounded-lg px-2.5 py-1 hover:bg-amber-100 transition-colors"
              >
                📥 {b.nome}
              </a>
            ))}
          </div>
        )}

        {/* Seletor de módulos (cursos) */}
        {selecionado?.isCurso && selecionado.modulos.length > 0 && (
          <div className="border-b border-gray-100 bg-indigo-50/60 px-4 py-2.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-indigo-700">🎓 Módulos:</span>
            {selecionado.modulos.map((m, i) => (
              <button key={m.id} type="button" onClick={() => setModuloSel(m.id)}
                className={`text-xs font-medium rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                  moduloSel === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}>
                {i + 1}. {m.titulo}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0">
        {selecionado ? (
          selecionado.isCurso ? (
            moduloSel ? (
              <PdfReader key={moduloSel} ebookId={selecionado.id} moduloId={moduloSel} />
            ) : (
              <PreparacaoAviso curso />
            )
          ) : selecionado.temPdf ? (
            <PdfReader key={selecionado.id} ebookId={selecionado.id} />
          ) : (
            <PreparacaoAviso />
          )
        ) : (
          <div className="h-full flex items-center justify-center text-center text-gray-400">
            <div>
              <p className="text-4xl mb-3">📚</p>
              <p>Selecione um ebook à esquerda para começar a ler.</p>
            </div>
          </div>
        )}
        </div>
      </section>
    </div>
  )
}
