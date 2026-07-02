import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatPreco } from '@/lib/utils'
import { AddToCartButton } from '@/components/store/AddToCartButton'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('loja_ebooks')
    .select('titulo, descricao_curta, capa_url')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Ebook não encontrado' }

  return {
    title: data.titulo,
    description: data.descricao_curta ?? undefined,
    openGraph: {
      images: data.capa_url ? [data.capa_url] : [],
    },
  }
}

export default async function EbookPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: ebook } = await supabase
    .from('loja_ebooks')
    .select('*, loja_categorias(id, nome, slug, icone_emoji)')
    .eq('slug', slug)
    .eq('publicado', true)
    .not('pdf_url', 'is', null)
    .single()

  if (!ebook) return notFound()

  const { data: bonus } = await supabase
    .from('loja_ebook_bonus')
    .select('id, nome, capa_url')
    .eq('ebook_id', ebook.id)
    .order('criado_em')

  const categoria = ebook.loja_categorias as {
    id: string; nome: string; slug: string; icone_emoji: string
  } | null

  const itemCarrinho = {
    id: ebook.id,
    titulo: ebook.titulo,
    slug: ebook.slug,
    preco_centavos: ebook.preco_centavos,
    capa_url: ebook.capa_url,
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Capa */}
        <div className="relative aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          {ebook.capa_url ? (
            <Image
              src={ebook.capa_url}
              alt={ebook.titulo}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl">📖</span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex flex-col space-y-6">
          {categoria && (
            <Link
              href={`/categoria/${categoria.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline w-fit"
            >
              {categoria.icone_emoji} {categoria.nome}
            </Link>
          )}

          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {ebook.titulo}
          </h1>

          {ebook.descricao_longa && (
            <p className="text-gray-500 leading-relaxed">
              {ebook.descricao_longa}
            </p>
          )}

          {/* Bloco de compra */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-600">
                {formatPreco(ebook.preco_centavos)}
              </span>
              <span className="text-sm text-gray-400">à vista via PIX</span>
            </div>

            <p className="text-sm text-green-600 font-medium">
              💡 Leve 2+ ebooks e ganhe 10% de desconto no total
            </p>

            {bonus && bonus.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-amber-800 mb-2">🎁 Inclui {bonus.length} bônus para baixar:</p>
                <div className="flex flex-wrap gap-3">
                  {bonus.map((b) => (
                    <div key={b.id} className="w-20 text-center">
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white border border-amber-200 shadow-sm">
                        {b.capa_url ? (
                          <Image src={b.capa_url} alt={b.nome} fill className="object-contain p-0.5" sizes="80px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl">📎</div>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-amber-800 leading-tight line-clamp-2">{b.nome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <AddToCartButton item={itemCarrinho} />
              <AddToCartButton item={itemCarrinho} comprarAgora />
              <Link
                href={`/amostra/${ebook.slug}`}
                className="w-full text-center text-indigo-600 font-medium py-2 hover:underline"
              >
                📖 Ler amostra grátis
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>✅ Entrega imediata por email</span>
            <span>🔒 Pagamento seguro via PIX</span>
            <span>📥 Download em PDF</span>
          </div>
        </div>
      </div>
    </div>
  )
}
