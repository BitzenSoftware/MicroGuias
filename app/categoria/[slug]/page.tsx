import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CategoryFilter } from '@/components/store/CategoryFilter'
import { EbookCard } from '@/components/store/EbookCard'
import type { Ebook } from '@/lib/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('loja_categorias')
    .select('nome')
    .eq('slug', slug)
    .single()

  return { title: data?.nome ?? 'Categoria' }
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const [{ data: categorias }, { data: categoria }] = await Promise.all([
    supabase
      .from('loja_categorias')
      .select('id, nome, slug, icone_emoji, ordem')
      .order('ordem'),
    supabase
      .from('loja_categorias')
      .select('*')
      .eq('slug', slug)
      .single(),
  ])

  if (!categoria) return notFound()

  const { data: ebooks } = await supabase
    .from('loja_ebooks')
    .select('*, loja_categorias(id, nome, slug, icone_emoji, ordem)')
    .eq('publicado', true)
    .not('pdf_url', 'is', null)
    .eq('categoria_id', categoria.id)
    .order('criado_em', { ascending: false })

  // Só mostra no filtro categorias que têm ebook publicado com PDF
  const { data: publicados } = await supabase
    .from('loja_ebooks')
    .select('categoria_id')
    .eq('publicado', true)
    .not('pdf_url', 'is', null)
  const idsComEbook = new Set((publicados ?? []).map((e) => e.categoria_id))
  const categoriasVisiveis = (categorias ?? []).filter((c) => idsComEbook.has(c.id))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {categoria.icone_emoji} {categoria.nome}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {ebooks?.length ?? 0} ebook{(ebooks?.length ?? 0) !== 1 ? 's' : ''} disponível{(ebooks?.length ?? 0) !== 1 ? 'is' : ''}
        </p>
      </div>

      <CategoryFilter categorias={categoriasVisiveis} categoriaAtiva={slug} />

      {ebooks && ebooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
          {ebooks.map((ebook) => (
            <EbookCard key={ebook.id} ebook={ebook as Ebook} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">{categoria.icone_emoji}</p>
          <p className="text-lg">Nenhum ebook nesta categoria ainda.</p>
        </div>
      )}
    </div>
  )
}
