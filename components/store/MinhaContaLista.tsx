'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type ItemComprado = {
  id: string
  titulo: string
  slug: string
  capa_url: string | null
  categoria: { id: string; nome: string; slug: string; icone_emoji: string } | null
}

export function MinhaContaLista({ itens }: { itens: ItemComprado[] }) {
  const [catAtiva, setCatAtiva] = useState<string>('all')

  // Categorias distintas presentes nas compras
  const categorias = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; icone_emoji: string }>()
    for (const it of itens) {
      if (it.categoria && !map.has(it.categoria.id)) {
        map.set(it.categoria.id, { id: it.categoria.id, nome: it.categoria.nome, icone_emoji: it.categoria.icone_emoji })
      }
    }
    return Array.from(map.values())
  }, [itens])

  const filtrados = useMemo(() => {
    if (catAtiva === 'all') return itens
    return itens.filter((it) => it.categoria?.id === catAtiva)
  }, [catAtiva, itens])

  const chip = (ativo: boolean) =>
    `flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
      ativo
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
    }`

  return (
    <div className="space-y-6">
      {/* Filtro de categorias */}
      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setCatAtiva('all')} className={chip(catAtiva === 'all')}>
            📚 Todos
          </button>
          {categorias.map((c) => (
            <button key={c.id} type="button" onClick={() => setCatAtiva(c.id)} className={chip(catAtiva === c.id)}>
              {c.icone_emoji} {c.nome}
            </button>
          ))}
        </div>
      )}

      {/* Grade de capas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
        {filtrados.map((item) => (
          <div key={item.id} className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100">
            <Link href="/biblioteca" className="block relative aspect-[3/4] bg-white">
              {item.capa_url ? (
                <Image src={item.capa_url} alt={item.titulo} fill className="object-contain p-1" sizes="(max-width: 640px) 50vw, 20vw" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-5xl">📖</div>
              )}
            </Link>
            <div className="p-3 flex flex-col flex-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{item.titulo}</h3>
              <Link
                href="/biblioteca"
                className="mt-auto pt-3 inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                📖 Ler na Biblioteca
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-gray-400 py-10">Nenhum ebook nesta categoria.</p>
      )}
    </div>
  )
}
