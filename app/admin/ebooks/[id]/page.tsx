import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { EbookEditForm } from '@/components/admin/EbookEditForm'
import { BonusManager } from '@/components/admin/BonusManager'
import type { Categoria, Ebook, EbookBonus } from '@/lib/types'

export default async function EditarEbookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: ebook }, { data: categorias }, { data: bonus }] = await Promise.all([
    supabase.from('loja_ebooks').select('*').eq('id', id).single(),
    supabase.from('loja_categorias').select('id, nome, slug, icone_emoji, ordem').order('ordem'),
    supabase.from('loja_ebook_bonus').select('*').eq('ebook_id', id).order('criado_em'),
  ])

  if (!ebook) return notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Editar ebook</h1>
        <p className="text-sm text-gray-400">Atualize os dados, troque a capa ou anexe bônus.</p>
      </div>
      <EbookEditForm ebook={ebook as Ebook} categorias={(categorias ?? []) as Categoria[]} />
      <BonusManager ebookId={id} bonusIniciais={(bonus ?? []) as EbookBonus[]} />
    </div>
  )
}
