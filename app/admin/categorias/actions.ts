'use server'

import { revalidatePath } from 'next/cache'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

function revalidar() {
  revalidatePath('/admin/categorias')
  revalidatePath('/')
}

export async function criarCategoria(nome: string, icone: string, ordem: number) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  if (!nome.trim()) throw new Error('Informe o nome da categoria.')

  const supabase = createServiceClient()
  let slug = slugify(nome)

  // Garante slug único
  const { data: existe } = await supabase
    .from('loja_categorias')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existe) slug = `${slug}-${Date.now().toString(36)}`

  const { error } = await supabase.from('loja_categorias').insert({
    nome: nome.trim(),
    slug,
    icone_emoji: icone || '📚',
    ordem: ordem || 0,
    ativa: true,
  })
  if (error) throw new Error(error.message)
  revalidar()
}

export async function atualizarCategoria(
  id: string,
  nome: string,
  icone: string,
  ordem: number,
  ativa: boolean
) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  if (!nome.trim()) throw new Error('Informe o nome da categoria.')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('loja_categorias')
    .update({ nome: nome.trim(), icone_emoji: icone || '📚', ordem: ordem || 0, ativa })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidar()
}

export async function excluirCategoria(id: string) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')

  const supabase = createServiceClient()
  // ebooks da categoria ficam com categoria_id = null (FK on delete set null)
  const { error } = await supabase.from('loja_categorias').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidar()
}
