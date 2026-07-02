'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  nome: string
  email: string
  avatarUrl: string | null
  isAdmin?: boolean
}

export function UserMenu({ nome, email, avatarUrl, isAdmin }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [aberto, setAberto] = useState(false)

  async function handleSair() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 cursor-pointer"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={nome}
            width={36}
            height={36}
            className="rounded-full border-2 border-indigo-100"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
            {iniciais}
          </div>
        )}
      </button>

      {aberto && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setAberto(false)}
          />
          <div className="absolute right-0 top-11 z-40 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
            <div className="px-4 py-2 border-b border-gray-50">
              <p className="text-sm font-medium text-gray-900 truncate">{nome}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
            </div>
            <Link
              href="/"
              onClick={() => setAberto(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              🏠 Início
            </Link>
            <Link
              href="/biblioteca"
              onClick={() => setAberto(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              📖 Biblioteca
            </Link>
            <Link
              href="/minha-conta"
              onClick={() => setAberto(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              📚 Meus ebooks
            </Link>
            <Link
              href="/suporte"
              onClick={() => setAberto(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              💬 Suporte
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setAberto(false)}
                className="block px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                ⚙️ Painel Admin
              </Link>
            )}
            <button
              type="button"
              onClick={handleSair}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}
