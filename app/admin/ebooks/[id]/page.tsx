import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { EbookEditForm } from '@/components/admin/EbookEditForm'
import type { Categoria, Ebook } from '@/lib/types'

export default async function EditarEbookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: ebook }, { data: categorias }] = await Promise.all([
    supabase.from('loja_ebooks').select('*').eq('id', id).single(),
    supabase.from('loja_categorias').select('id, nome, slug, icone_emoji, ordem').order('ordem'),
  ])

  if (!ebook) return notFound()

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Editar ebook</h1>
      <p className="text-sm text-gray-400 mb-6">Atualize os dados ou troque a capa.</p>
      <EbookEditForm ebook={ebook as Ebook} categorias={(categorias ?? []) as Categoria[]} />
    </div>
  )
}
