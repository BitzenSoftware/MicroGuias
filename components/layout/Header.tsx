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
          <div className="flex items-center gap-5 sm:gap-7">
            <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
              📚 Micro Guias
            </Link>
            <Link
              href="/atividades"
              className="hidden sm:inline text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
            >
              🖍️ Atividades grátis
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && !isAdmin && (
              <Link
                href="/suporte"
                aria-label="Suporte"
                title="Fale conosco"
                className="relative"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 hover:bg-green-600 transition-colors shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path fill="white" d="M20 2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3v3l4-3h9a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                    <circle cx="9.5" cy="9.5" r="1.1" fill="#22c55e" />
                    <circle cx="14.5" cy="9.5" r="1.1" fill="#22c55e" />
                    <path d="M9 12.4a3 3 0 0 0 6 0" fill="none" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                {naoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
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
