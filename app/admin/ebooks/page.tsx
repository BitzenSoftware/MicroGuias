import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPreco } from '@/lib/utils'
import type { Ebook } from '@/lib/types'
import { TogglePublicado } from '@/components/admin/TogglePublicado'
import { DeleteEbookButton } from '@/components/admin/DeleteEbookButton'
import { ReprocessarCapaButton } from '@/components/admin/ReprocessarCapaButton'

export default async function AdminEbooksPage() {
  // service-role: admin enxerga publicados E rascunhos (ignora RLS de publicado)
  const supabase = createServiceClient()
  const { data: ebooks } = await supabase
    .from('loja_ebooks')
    .select('*, loja_categorias(id, nome, slug, icone_emoji, ordem)')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ebooks</h1>
        <Link
          href="/admin/ebooks/novo"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          ✨ Novo ebook
        </Link>
      </div>

      {ebooks && ebooks.length > 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
          {ebooks.map((e) => {
            const ebook = e as Ebook
            return (
              <div key={ebook.id} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-12 flex-shrink-0 rounded-md overflow-hidden bg-indigo-50">
                  {ebook.capa_url ? (
                    <Image src={ebook.capa_url} alt={ebook.titulo} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xl">📖</div>
                  )}
                </div>

                <Link href={`/admin/ebooks/${ebook.id}`} className="flex-1 min-w-0 group">
                  <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{ebook.titulo}</p>
                  <p className="text-sm text-gray-400">
                    {ebook.loja_categorias?.nome ?? 'Sem categoria'} · {formatPreco(ebook.preco_centavos)}
                  </p>
                </Link>

                <TogglePublicado id={ebook.id} publicado={ebook.publicado} />

                {ebook.pdf_url && (
                  <span className="text-xs text-gray-300" title="PDF gerado">📄</span>
                )}

                {ebook.capa_url && <ReprocessarCapaButton id={ebook.id} />}

                <Link href={`/admin/ebooks/${ebook.id}`}
                  className="text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                  Editar
                </Link>

                <DeleteEbookButton id={ebook.id} titulo={ebook.titulo} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-gray-500">Nenhum ebook criado ainda.</p>
          <Link href="/admin/ebooks/novo" className="inline-block mt-4 text-indigo-600 font-medium hover:underline">
            Criar o primeiro →
          </Link>
        </div>
      )}
    </div>
  )
}
