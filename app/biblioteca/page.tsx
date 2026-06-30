import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Leitor, type EbookBiblioteca } from '@/components/biblioteca/Leitor'

export const metadata = { title: 'Biblioteca' }

export default async function BibliotecaPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login?next=/biblioteca')

  const supabase = createServiceClient()

  const { data: perfil } = await supabase
    .from('loja_perfis')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = perfil?.role === 'admin'

  let ebooks: EbookBiblioteca[] = []

  if (isAdmin) {
    // Admin lê todos os ebooks que têm PDF
    const { data } = await supabase
      .from('loja_ebooks')
      .select('id, titulo, capa_url, pdf_url')
      .not('pdf_url', 'is', null)
      .order('titulo')
    ebooks = (data ?? []).map((e) => ({ id: e.id, titulo: e.titulo, capa_url: e.capa_url, temPdf: true }))
  } else {
    // Cliente vê TUDO que comprou (pedido pago) — mesmo sem PDF ainda,
    // pra nunca "sumir" um item pago. Sem PDF aparece como "em preparação".
    const { data } = await supabase
      .from('loja_pedido_itens')
      .select('loja_ebooks!inner(id, titulo, capa_url, pdf_url), loja_pedidos!inner(user_id, status)')
      .eq('loja_pedidos.user_id', user.id)
      .eq('loja_pedidos.status', 'pago')

    const vistos = new Set<string>()
    for (const row of data ?? []) {
      const e = row.loja_ebooks as unknown as { id: string; titulo: string; capa_url: string | null; pdf_url: string | null }
      if (!e || vistos.has(e.id)) continue
      vistos.add(e.id)
      ebooks.push({ id: e.id, titulo: e.titulo, capa_url: e.capa_url, temPdf: !!e.pdf_url })
    }
    ebooks.sort((a, b) => a.titulo.localeCompare(b.titulo))
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca</h1>
        <p className="text-sm text-gray-400">
          {isAdmin ? 'Leitura de todos os ebooks do catálogo' : 'Leia online os ebooks que você comprou'}
        </p>
      </div>

      {ebooks.length > 0 ? (
        <Leitor ebooks={ebooks} />
      ) : (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500">
            {isAdmin ? 'Nenhum ebook com PDF ainda.' : 'Você ainda não comprou nenhum ebook.'}
          </p>
          <Link href="/" className="inline-block mt-4 text-indigo-600 font-medium hover:underline">
            Explorar catálogo →
          </Link>
        </div>
      )}
    </div>
  )
}
