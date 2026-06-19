import { createClient } from '@/lib/supabase/server'
import { EbookForm } from '@/components/admin/EbookForm'
import type { Categoria } from '@/lib/types'

export default async function NovoEbookPage() {
  const supabase = await createClient()
  const { data: categorias } = await supabase
    .from('loja_categorias')
    .select('id, nome, slug, icone_emoji, ordem')
    .order('ordem')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Novo ebook</h1>
      <p className="text-sm text-gray-400 mb-6">
        Defina o tema, gere o conteúdo com IA e publique.
      </p>
      <EbookForm categorias={(categorias ?? []) as Categoria[]} />
    </div>
  )
}
