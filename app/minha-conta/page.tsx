import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MinhaContaLista, type ItemComprado } from '@/components/store/MinhaContaLista'

export const metadata = { title: 'Minha conta' }

export default async function MinhaContaPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login?next=/minha-conta')

  const supabase = createServiceClient()
  const { data: pedidos } = await supabase
    .from('loja_pedidos')
    .select(`
      id, criado_em,
      loja_pedido_itens (
        id,
        loja_ebooks ( id, titulo, slug, capa_url, loja_categorias ( id, nome, slug, icone_emoji ) )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pago')
    .order('criado_em', { ascending: false })

  // Achata e deduplica por ebook
  const vistos = new Set<string>()
  const itens: ItemComprado[] = []
  for (const pedido of pedidos ?? []) {
    for (const item of (pedido.loja_pedido_itens ?? []) as Record<string, unknown>[]) {
      const ebook = item.loja_ebooks as {
        id: string; titulo: string; slug: string; capa_url: string | null
        loja_categorias: { id: string; nome: string; slug: string; icone_emoji: string } | null
      } | null
      if (!ebook || vistos.has(ebook.id)) continue
      vistos.add(ebook.id)
      itens.push({
        id: ebook.id,
        titulo: ebook.titulo,
        slug: ebook.slug,
        capa_url: ebook.capa_url,
        categoria: ebook.loja_categorias,
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Minha conta</h1>
      <p className="text-sm text-gray-400 mb-6">Seus ebooks comprados</p>

      {itens.length > 0 ? (
        <MinhaContaLista itens={itens} />
      ) : (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500">Você ainda não comprou nenhum ebook.</p>
          <Link href="/" className="inline-block mt-4 text-indigo-600 font-medium hover:underline">
            Explorar catálogo →
          </Link>
        </div>
      )}
    </div>
  )
}
