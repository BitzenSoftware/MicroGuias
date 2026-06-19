'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart'

export function CartButton() {
  const { itens } = useCart()

  return (
    <Link
      href="/carrinho"
      title="Carrinho"
      className="relative p-2 text-gray-400 hover:text-indigo-600 transition-colors"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
        {itens.length}
      </span>
    </Link>
  )
}
