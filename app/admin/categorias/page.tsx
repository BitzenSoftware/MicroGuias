import { createServiceClient } from '@/lib/supabase/server'
import { CategoriasManager } from '@/components/admin/CategoriasManager'
import type { Categoria } from '@/lib/types'

export default async function AdminCategoriasPage() {
  const supabase = createServiceClient()
  const { data: categorias } = await supabase
    .from('loja_categorias')
    .select('id, nome, slug, icone_emoji, ordem, ativa')
    .order('ordem')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Categorias</h1>
      <p className="text-sm text-gray-400 mb-6">
        Crie, edite, reordene e ative/desative as categorias da loja.
      </p>
      <CategoriasManager categorias={(categorias ?? []) as Categoria[]} />
    </div>
  )
}
