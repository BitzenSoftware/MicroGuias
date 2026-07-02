import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { carregarPromocao } from '@/lib/promocoes'
import { formatPreco } from '@/lib/utils'
import { ComprarComboButton } from '@/components/store/ComprarComboButton'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const promo = await carregarPromocao(supabase, slug)
  return { title: promo ? promo.nome : 'Combo' }
}

export default async function PromocaoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const promo = await carregarPromocao(supabase, slug)
  if (!promo) return notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Esquerda: capas + preço */}
        <div className="space-y-5">
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            🔥 Combo especial
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {promo.ebooks.map((e) => (
              <div key={e.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm">
                {e.capa_url ? (
                  <Image src={e.capa_url} alt={e.titulo} fill className="object-contain p-0.5" sizes="96px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">📖</div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-700">{formatPreco(promo.preco_centavos)}</span>
              {promo.economia > 0 && (
                <span className="text-lg text-gray-400 line-through">{formatPreco(promo.subtotal)}</span>
              )}
            </div>
            {promo.economia > 0 && (
              <p className="text-sm text-green-700 font-medium">
                💚 Você economiza {formatPreco(promo.economia)} levando os {promo.ebooks.length} juntos
              </p>
            )}
            <ComprarComboButton promocaoId={promo.id} slug={promo.slug} disponivel={promo.disponivel} />
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span>✅ Todos liberam na hora</span>
              <span>🔒 Pagamento via Mercado Pago</span>
              <span>📖 Leitura online</span>
            </div>
          </div>
        </div>

        {/* Direita: descrição + lista */}
        <div className="space-y-5">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">{promo.nome}</h1>
          {promo.descricao && <p className="text-gray-500 leading-relaxed">{promo.descricao}</p>}

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">O que está incluído ({promo.ebooks.length}):</p>
            <ul className="space-y-2">
              {promo.ebooks.map((e) => (
                <li key={e.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-2.5">
                  <div className="relative h-12 w-9 flex-shrink-0 rounded overflow-hidden bg-white border border-gray-100">
                    {e.capa_url ? (
                      <Image src={e.capa_url} alt={e.titulo} fill className="object-contain p-0.5" sizes="36px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm">📖</div>
                    )}
                  </div>
                  <Link href={`/ebook/${e.slug}`} className="text-sm text-gray-800 hover:text-indigo-600 line-clamp-2">
                    {e.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/" className="inline-block text-sm text-indigo-600 hover:underline">← Voltar para a loja</Link>
        </div>
      </div>
    </div>
  )
}
