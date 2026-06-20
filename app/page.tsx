import { createClient } from '@/lib/supabase/server'
import { CategoryFilter } from '@/components/store/CategoryFilter'
import { EbookCard } from '@/components/store/EbookCard'
import type { Ebook } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: categorias }, { data: ebooks }] = await Promise.all([
    supabase
      .from('loja_categorias')
      .select('id, nome, slug, icone_emoji, ordem')
      .order('ordem'),
    supabase
      .from('loja_ebooks')
      .select('*, loja_categorias(id, nome, slug, icone_emoji, ordem)')
      .eq('publicado', true)
      .order('criado_em', { ascending: false }),
  ])

  // Só mostra categorias que têm pelo menos um ebook publicado
  const idsComEbook = new Set((ebooks ?? []).map((e) => e.categoria_id))
  const categoriasVisiveis = (categorias ?? []).filter((c) => idsComEbook.has(c.id))

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center py-14">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
          Conhecimento que transforma
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
          Ebooks práticos e acessíveis para evoluir em qualquer área da sua vida.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full text-sm font-medium">
          🎁 Compre 2 ou mais ebooks e ganhe <strong>10% de desconto</strong>
        </div>
      </div>

      {/* Filtro de categorias */}
      <CategoryFilter categorias={categoriasVisiveis} />

      {/* Grade de ebooks */}
      {ebooks && ebooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
          {ebooks.map((ebook) => (
            <EbookCard key={ebook.id} ebook={ebook as Ebook} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-lg">Nenhum ebook disponível ainda.</p>
          <p className="text-sm mt-1">Volte em breve!</p>
        </div>
      )}
    </div>
  )
}
