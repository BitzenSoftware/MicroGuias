import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'
import { CartButton } from '@/components/cart/CartButton'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const nome = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Utilizador'
  const email = user?.email ?? ''

  let isAdmin = false
  let naoLidas = 0
  if (user) {
    const { data: perfil } = await supabase
      .from('loja_perfis')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = perfil?.role === 'admin'

    // Respostas do suporte ainda não lidas (só para clientes)
    if (!isAdmin) {
      const service = createServiceClient()
      const { data: conversa } = await service
        .from('loja_conversas')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (conversa) {
        const { count } = await service
          .from('loja_mensagens')
          .select('id', { count: 'exact', head: true })
          .eq('conversa_id', conversa.id)
          .eq('de_admin', true)
          .eq('lida', false)
        naoLidas = count ?? 0
      }
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
            📚 Micro Guias
          </Link>

          <div className="flex items-center gap-4">
            {user && !isAdmin && (
              <Link
                href="/suporte"
                aria-label="Suporte"
                title="Fale conosco"
                className="relative text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                {naoLidas > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                    {naoLidas}
                  </span>
                )}
              </Link>
            )}

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
