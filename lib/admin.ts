import { createClient } from '@/lib/supabase/server'

export type AdminUser = {
  id: string
  email: string
  nome: string | null
}

/**
 * Verifica se há sessão e se o utilizador é admin.
 * Retorna o utilizador ou null. Use em Server Components / API routes.
 */
export async function getAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('loja_perfis')
    .select('role, email, nome')
    .eq('id', user.id)
    .single()

  if (perfil?.role !== 'admin') return null

  return { id: user.id, email: perfil.email, nome: perfil.nome }
}
