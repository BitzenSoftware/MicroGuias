'use server'

import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import type { EbookModulo } from '@/lib/types'

export async function adicionarModulo(ebookId: string, titulo: string, arquivoPath: string) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  if (!titulo.trim() || !arquivoPath) throw new Error('Dados do módulo incompletos.')

  const supabase = createServiceClient()

  // Próxima ordem = quantidade atual
  const { count } = await supabase
    .from('loja_ebook_modulos')
    .select('id', { count: 'exact', head: true })
    .eq('ebook_id', ebookId)

  const { error } = await supabase.from('loja_ebook_modulos').insert({
    ebook_id: ebookId,
    titulo: titulo.trim(),
    arquivo_path: arquivoPath,
    ordem: count ?? 0,
  })
  if (error) throw new Error(error.message)
}

export async function removerModulo(moduloId: string) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')

  const supabase = createServiceClient()
  const { data: modulo } = await supabase
    .from('loja_ebook_modulos')
    .select('arquivo_path')
    .eq('id', moduloId)
    .single()

  if (modulo?.arquivo_path) {
    await supabase.storage.from('pdfs').remove([modulo.arquivo_path])
  }
  const { error } = await supabase.from('loja_ebook_modulos').delete().eq('id', moduloId)
  if (error) throw new Error(error.message)
}

export async function listarModulos(ebookId: string): Promise<EbookModulo[]> {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('loja_ebook_modulos')
    .select('*')
    .eq('ebook_id', ebookId)
    .order('ordem', { ascending: true })
  return (data ?? []) as EbookModulo[]
}
