import Image from 'next/image'
import Link from 'next/link'
import type { Ebook } from '@/lib/types'
import { formatPreco } from '@/lib/utils'

export function EbookCard({ ebook }: { ebook: Ebook }) {
  const categoria = ebook.loja_categorias

  return (
    <div className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-indigo-100">
      <Link href={`/ebook/${ebook.slug}`} className="block">
        {/* Capa */}
        <div className="relative aspect-[3/4] bg-white">
          {ebook.capa_url ? (
            <Image
              src={ebook.capa_url}
              alt={ebook.titulo}
              fill
              className="object-contain p-1"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">📖</span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-4 pb-2">
          {categoria && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 mb-1.5">
              {categoria.icone_emoji} {categoria.nome}
            </span>
          )}

          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {ebook.titulo}
          </h3>

          {ebook.descricao_curta && (
            <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
              {ebook.descricao_curta}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-base font-bold text-indigo-600">
              {formatPreco(ebook.preco_centavos)}
            </span>
            <span className="text-xs text-indigo-500 font-medium group-hover:translate-x-0.5 transition-transform">
              Ver →
            </span>
          </div>
        </div>
      </Link>

      {/* Amostra grátis (link separado, fora do anchor principal) */}
      <Link
        href={`/amostra/${ebook.slug}`}
        className="mt-auto mx-4 mb-4 text-center text-xs font-medium text-indigo-600 border border-indigo-100 bg-indigo-50/50 rounded-lg py-2 hover:bg-indigo-50 transition-colors"
      >
        📖 Ler amostra grátis
      </Link>
    </div>
  )
}
