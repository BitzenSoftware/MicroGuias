import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const nome = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Utilizador'
  const email = user?.email ?? ''

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
            📚 Micro Guias
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu nome={nome} email={email} avatarUrl={avatarUrl} />
            ) : (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Entrar
              </Link>
            )}

            {/* Ícone do carrinho — funcional na Fase 3 */}
            <button
              type="button"
              title="Carrinho"
              className="relative p-2 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
