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
    // Admin lê todos os ebooks com PDF ou cursos
    const { data } = await supabase
      .from('loja_ebooks')
      .select('id, titulo, capa_url, pdf_url, is_curso')
      .or('pdf_url.not.is.null,is_curso.eq.true')
      .order('titulo')
    ebooks = (data ?? []).map((e) => ({ id: e.id, titulo: e.titulo, capa_url: e.capa_url, temPdf: !!e.pdf_url, isCurso: !!e.is_curso, bonus: [], modulos: [] }))
  } else {
    // Cliente vê TUDO que comprou (pedido pago) — mesmo sem conteúdo ainda,
    // pra nunca "sumir" um item pago. Sem conteúdo aparece como "em preparação".
    const { data } = await supabase
      .from('loja_pedido_itens')
      .select('loja_ebooks!inner(id, titulo, capa_url, pdf_url, is_curso), loja_pedidos!inner(user_id, status)')
      .eq('loja_pedidos.user_id', user.id)
      .eq('loja_pedidos.status', 'pago')

    const vistos = new Set<string>()
    for (const row of data ?? []) {
      const e = row.loja_ebooks as unknown as { id: string; titulo: string; capa_url: string | null; pdf_url: string | null; is_curso: boolean | null }
      if (!e || vistos.has(e.id)) continue
      vistos.add(e.id)
      ebooks.push({ id: e.id, titulo: e.titulo, capa_url: e.capa_url, temPdf: !!e.pdf_url, isCurso: !!e.is_curso, bonus: [], modulos: [] })
    }
    ebooks.sort((a, b) => a.titulo.localeCompare(b.titulo))
  }

  // Anexa bônus (baixáveis) e módulos (de cursos) de cada ebook
  if (ebooks.length > 0) {
    const ids = ebooks.map((e) => e.id)
    const [{ data: bonusData }, { data: modData }] = await Promise.all([
      supabase.from('loja_ebook_bonus').select('id, nome, ebook_id').in('ebook_id', ids).order('criado_em'),
      supabase.from('loja_ebook_modulos').select('id, titulo, ebook_id, ordem').in('ebook_id', ids).order('ordem'),
    ])

    const bonusPorEbook = new Map<string, { id: string; nome: string }[]>()
    for (const b of bonusData ?? []) {
      const l = bonusPorEbook.get(b.ebook_id) ?? []
      l.push({ id: b.id, nome: b.nome })
      bonusPorEbook.set(b.ebook_id, l)
    }
    const modPorEbook = new Map<string, { id: string; titulo: string }[]>()
    for (const m of modData ?? []) {
      const l = modPorEbook.get(m.ebook_id) ?? []
      l.push({ id: m.id, titulo: m.titulo })
      modPorEbook.set(m.ebook_id, l)
    }
    ebooks = ebooks.map((e) => ({
      ...e,
      bonus: bonusPorEbook.get(e.id) ?? [],
      modulos: modPorEbook.get(e.id) ?? [],
    }))
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
