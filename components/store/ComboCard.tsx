import Image from 'next/image'
import Link from 'next/link'
import type { PromoComItens } from '@/lib/promocoes'
import { formatPreco } from '@/lib/utils'

export function ComboCard({ promo }: { promo: PromoComItens }) {
  const capas = promo.ebooks.slice(0, 5)

  return (
    <Link
      href={`/promocao/${promo.slug}`}
      className="group block rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          🔥 Combo
        </span>
        {promo.economia > 0 && (
          <span className="text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            Economize {formatPreco(promo.economia)}
          </span>
        )}
      </div>

      {/* Pilha de capas */}
      <div className="flex -space-x-4 mb-4">
        {capas.map((e) => (
          <div key={e.id} className="relative h-24 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm">
            {e.capa_url ? (
              <Image src={e.capa_url} alt={e.titulo} fill className="object-contain p-0.5" sizes="64px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xl">📖</div>
            )}
          </div>
        ))}
        {promo.ebooks.length > capas.length && (
          <div className="relative h-24 w-16 flex-shrink-0 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-sm font-bold text-amber-700">
            +{promo.ebooks.length - capas.length}
          </div>
        )}
      </div>

      <h3 className="font-bold text-gray-900 leading-snug group-hover:text-amber-700 transition-colors">
        {promo.nome}
      </h3>
      <p className="text-xs text-gray-500 mt-0.5">{promo.ebooks.length} ebooks nesta oferta</p>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xl font-bold text-green-700">{formatPreco(promo.preco_centavos)}</span>
        {promo.economia > 0 && (
          <span className="text-sm text-gray-400 line-through">{formatPreco(promo.subtotal)}</span>
        )}
      </div>
    </Link>
  )
}
