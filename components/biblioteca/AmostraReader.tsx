'use client'

import dynamic from 'next/dynamic'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import { formatPreco } from '@/lib/utils'
import type { CartItem } from '@/lib/cart'

const PdfReader = dynamic(
  () => import('./PdfReader').then((m) => m.PdfReader),
  { ssr: false }
)

export function AmostraReader({ item }: { item: CartItem }) {
  const paywall = (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-lg p-6 text-center space-y-4">
      <p className="text-4xl">🔒</p>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Gostou da amostra?</h3>
        <p className="text-sm text-gray-500 mt-1">
          Continue lendo <span className="font-medium text-gray-700">{item.titulo}</span> completo.
        </p>
      </div>
      <p className="text-3xl font-bold text-indigo-600">{formatPreco(item.preco_centavos)}</p>
      <div className="flex flex-col gap-2">
        <AddToCartButton item={item} comprarAgora />
        <AddToCartButton item={item} />
      </div>
      <p className="text-xs text-gray-400">Acesso imediato após o pagamento · leitura online</p>
    </div>
  )

  return (
    <div className="h-[calc(100vh-9rem)] border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <PdfReader ebookId={item.id} amostra paywall={paywall} />
    </div>
  )
}
