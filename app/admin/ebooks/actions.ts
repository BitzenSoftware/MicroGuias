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
