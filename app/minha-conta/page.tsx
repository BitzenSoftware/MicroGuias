import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ItemCompra = {
  titulo: string
  slug: string
  capa_url: string | null
  token: string | null
  expirado: boolean
}

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
        loja_ebooks ( titulo, slug, capa_url ),
        loja_downloads ( token, expira_em )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pago')
    .order('criado_em', { ascending: false })

  // Achata em lista de ebooks comprados
  const itens: ItemCompra[] = []
  for (const pedido of pedidos ?? []) {
    for (const item of (pedido.loja_pedido_itens ?? []) as Record<string, unknown>[]) {
      const ebook = item.loja_ebooks as { titulo: string; slug: string; capa_url: string | null } | null
      const download = (item.loja_downloads as { token: string; expira_em: string }[] | null)?.[0]
      if (!ebook) continue
      const expirado = download ? new Date(download.expira_em) < new Date() : true
      itens.push({
        titulo: ebook.titulo,
        slug: ebook.slug,
        capa_url: ebook.capa_url,
        token: download?.token ?? null,
        expirado,
      })
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Minha conta</h1>
      <p className="text-sm text-gray-400 mb-6">Seus ebooks comprados</p>

      {itens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {itens.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4">
              <div className="relative h-24 w-18 flex-shrink-0 rounded-lg overflow-hidden bg-indigo-50" style={{ width: '4.5rem' }}>
                {item.capa_url ? (
                  <Image src={item.capa_url} alt={item.titulo} fill className="object-cover" sizes="72px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">📖</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 line-clamp-2">{item.titulo}</p>
                {item.token && !item.expirado ? (
                  <a
                    href={`/api/download/${item.token}`}
                    className="inline-block mt-2 bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    📥 Baixar PDF
                  </a>
                ) : (
                  <p className="text-xs text-amber-600 mt-2">
                    {item.expirado ? 'Link de download expirado' : 'Indisponível'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
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
