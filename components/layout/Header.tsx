import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'
import { CartButton } from '@/components/cart/CartButton'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const nome = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Utilizador'
  const email = user?.email ?? ''

  let isAdmin = false
  if (user) {
    const { data: perfil } = await supabase
      .from('loja_perfis')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = perfil?.role === 'admin'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
            📚 Micro Guias
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu nome={nome} email={email} avatarUrl={avatarUrl} isAdmin={isAdmin} />
            ) : (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Entrar
              </Link>
            )}

            <CartButton />
          </div>
        </div>
      </div>
    </header>
  )
}
