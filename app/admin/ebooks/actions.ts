'use server'

import { revalidatePath } from 'next/cache'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function togglePublicado(id: string, publicado: boolean) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('loja_ebooks')
    .update({ publicado })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/ebooks')
  revalidatePath('/')
}

export async function excluirEbook(id: string) {
  const admin = await getAdmin()
  if (!admin) throw new Error('Não autorizado')

  const supabase = createServiceClient()

  // Pega os caminhos dos arquivos antes de apagar
  const { data: ebook } = await supabase
    .from('loja_ebooks')
    .select('pdf_url, capa_url')
    .eq('id', id)
    .single()

  // Apaga o registro (se já houver pedidos, a FK bloqueia)
  const { error } = await supabase.from('loja_ebooks').delete().eq('id', id)
  if (error) {
    throw new Error(
      'Não dá para excluir: este ebook já tem pedidos associados. Despublique-o em vez de excluir.'
    )
  }

  // Remove os arquivos do Storage (best-effort)
  if (ebook?.pdf_url) {
    await supabase.storage.from('pdfs').remove([ebook.pdf_url])
  }
  if (ebook?.capa_url) {
    const caminho = ebook.capa_url.split('/capas/')[1]
    if (caminho) await supabase.storage.from('capas').remove([caminho])
  }

  revalidatePath('/admin/ebooks')
  revalidatePath('/')
}
