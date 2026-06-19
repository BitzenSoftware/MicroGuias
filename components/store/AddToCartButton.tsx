'use client'

import { useRouter } from 'next/navigation'
import { useCart, type CartItem } from '@/lib/cart'

export function AddToCartButton({
  item,
  comprarAgora = false,
}: {
  item: CartItem
  comprarAgora?: boolean
}) {
  const router = useRouter()
  const { adicionar, temNoCarrinho } = useCart()
  const noCarrinho = temNoCarrinho(item.id)

  function handleAdicionar() {
    adicionar(item)
  }

  function handleComprar() {
    adicionar(item)
    router.push('/carrinho')
  }

  if (comprarAgora) {
    return (
      <button
        type="button"
        onClick={handleComprar}
        className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-3 px-6 rounded-xl font-semibold hover:bg-indigo-50 transition-colors cursor-pointer"
      >
        Comprar Agora
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleAdicionar}
      disabled={noCarrinho}
      className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors cursor-pointer disabled:bg-green-600 disabled:cursor-default"
    >
      {noCarrinho ? '✓ No carrinho' : 'Adicionar ao Carrinho'}
    </button>
  )
}
