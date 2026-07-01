'use server'

import { revalidatePath } from 'next/cache'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

function revalidar() {
  revalidatePath('/admin/promocoes')
  revalidatePath('/')
}

type DadosPromocao = {
  nome: string
  descricao: string
  preco_centavos: number
  ativo: boolean
  ebookIds: string[]
}

export async function salvarPromocao(dados: DadosPromocao, id?: string) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  if (!dados.nome.trim()) throw new Error('Informe o nome da promoção.')
  if (!dados.preco_centavos || dados.preco_centavos <= 0) throw new Error('Informe um preço válido.')
  if (!dados.ebookIds.length) throw new Error('Selecione pelo menos 1 ebook.')

  const supabase = createServiceClient()

  let promocaoId = id

  if (id) {
    const { error } = await supabase
      .from('loja_promocoes')
      .update({
        nome: dados.nome.trim(),
        descricao: dados.descricao.trim() || null,
        preco_centavos: dados.preco_centavos,
        ativo: dados.ativo,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    let slug = slugify(dados.nome)
    const { data: existe } = await supabase
      .from('loja_promocoes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (existe) slug = `${slug}-${Date.now().toString(36)}`

    const { data: nova, error } = await supabase
      .from('loja_promocoes')
      .insert({
        nome: dados.nome.trim(),
        slug,
        descricao: dados.descricao.trim() || null,
        preco_centavos: dados.preco_centavos,
        ativo: dados.ativo,
      })
      .select('id')
      .single()
    if (error || !nova) throw new Error(error?.message || 'Falha ao criar promoção')
    promocaoId = nova.id
  }

  // Recria os itens (simples e à prova de falha)
  await supabase.from('loja_promocao_itens').delete().eq('promocao_id', promocaoId!)
  const itens = dados.ebookIds.map((ebook_id) => ({ promocao_id: promocaoId!, ebook_id }))
  const { error: itErr } = await supabase.from('loja_promocao_itens').insert(itens)
  if (itErr) throw new Error(itErr.message)

  revalidar()
}

export async function togglePromocaoAtiva(id: string, ativo: boolean) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  const supabase = createServiceClient()
  const { error } = await supabase.from('loja_promocoes').update({ ativo }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidar()
}

export async function excluirPromocao(id: string) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  const supabase = createServiceClient()
  // itens caem por ON DELETE CASCADE
  const { error } = await supabase.from('loja_promocoes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidar()
}
