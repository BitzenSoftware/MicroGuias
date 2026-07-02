import { createClient } from '@/lib/supabase/server'
import { CategoryFilter } from '@/components/store/CategoryFilter'
import { EbookCard } from '@/components/store/EbookCard'
import { ComboCard } from '@/components/store/ComboCard'
import { listarPromocoesAtivas } from '@/lib/promocoes'
import type { Ebook } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const promocoes = await listarPromocoesAtivas(supabase)

  const [{ data: categorias }, { data: ebooks }] = await Promise.all([
    supabase
      .from('loja_categorias')
      .select('id, nome, slug, icone_emoji, ordem')
      .order('ordem'),
    supabase
      .from('loja_ebooks')
      .select('*, loja_categorias(id, nome, slug, icone_emoji, ordem)')
      .eq('publicado', true)
      .not('pdf_url', 'is', null)
      .order('criado_em', { ascending: false }),
  ])

  // Só mostra categorias que têm pelo menos um ebook publicado
  const idsComEbook = new Set((ebooks ?? []).map((e) => e.categoria_id))
  const categoriasVisiveis = (categorias ?? []).filter((c) => idsComEbook.has(c.id))

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 py-16 sm:py-20 text-center text-white">
        {/* Blobs decorativos */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />

        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm ring-1 ring-white/20">
            ✨ Guias práticos · entrega imediata
          </span>

          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Conhecimento que{' '}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-white bg-clip-text text-transparent">
              transforma
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Ebooks práticos e acessíveis para evoluir em qualquer área da sua vida.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#catalogo"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-colors"
            >
              Explorar catálogo →
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl border border-green-300/40 bg-green-400/15 px-4 py-3 text-sm font-semibold text-white">
              🎁 2+ ebooks = <span className="text-amber-200">10% OFF</span>
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-indigo-100/90">
            <span className="inline-flex items-center gap-1.5">✅ Entrega imediata</span>
            <span className="inline-flex items-center gap-1.5">🔒 Pagamento via PIX</span>
            <span className="inline-flex items-center gap-1.5">📖 Leitura online</span>
          </div>
        </div>
      </section>

      {/* Combos / Promoções */}
      {promocoes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">🔥 Combos & Ofertas</h2>
            <span className="text-sm text-gray-400">leve mais, pague menos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {promocoes.map((promo) => (
              <ComboCard key={promo.id} promo={promo} />
            ))}
          </div>
        </div>
      )}

      {/* Filtro de categorias */}
      <div id="catalogo" className="scroll-mt-24">
        <CategoryFilter categorias={categoriasVisiveis} />
      </div>

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
