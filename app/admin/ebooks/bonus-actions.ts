'use server'

import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import type { EbookBonus } from '@/lib/types'

export async function listarBonus(ebookId: string): Promise<EbookBonus[]> {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('loja_ebook_bonus')
    .select('*')
    .eq('ebook_id', ebookId)
    .order('criado_em', { ascending: true })
  return (data ?? []) as EbookBonus[]
}

export async function adicionarBonus(
  ebookId: string,
  nome: string,
  arquivoPath: string,
  capaUrl?: string | null
) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  if (!nome.trim() || !arquivoPath) throw new Error('Dados do bônus incompletos.')

  const supabase = createServiceClient()
  const { error } = await supabase.from('loja_ebook_bonus').insert({
    ebook_id: ebookId,
    nome: nome.trim(),
    arquivo_path: arquivoPath,
    capa_url: capaUrl || null,
  })
  if (error) throw new Error(error.message)
}

export async function removerBonus(bonusId: string) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')

  const supabase = createServiceClient()
  const { data: bonus } = await supabase
    .from('loja_ebook_bonus')
    .select('arquivo_path')
    .eq('id', bonusId)
    .single()

  if (bonus?.arquivo_path) {
    await supabase.storage.from('pdfs').remove([bonus.arquivo_path])
  }
  const { error } = await supabase.from('loja_ebook_bonus').delete().eq('id', bonusId)
  if (error) throw new Error(error.message)
}
