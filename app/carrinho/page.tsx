'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { formatPreco } from '@/lib/utils'

export default function CarrinhoPage() {
  const router = useRouter()
  const { itens, remover, subtotal, desconto, total, temDesconto } = useCart()
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function finalizar() {
    setErro(null)
    setProcessando(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ebookIds: itens.map((i) => i.id) }),
      })

      if (res.status === 401) {
        router.push('/login?next=/carrinho')
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao iniciar o pagamento')

      router.push(`/pix/${data.pedidoId}`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao finalizar')
    } finally {
      setProcessando(false)
    }
  }

  if (itens.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-xl font-bold text-gray-900">Seu carrinho está vazio</h1>
        <p className="text-gray-400 mt-1">Explore o catálogo e adicione ebooks.</p>
        <Link href="/" className="inline-block mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
          Ver ebooks
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Seu carrinho</h1>

      <div className="space-y-3">
        {itens.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4">
            <div className="relative h-20 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-indigo-50">
              {item.capa_url ? (
                <Image src={item.capa_url} alt={item.titulo} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-2xl">📖</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/ebook/${item.slug}`} className="font-medium text-gray-900 hover:text-indigo-600 line-clamp-2">
                {item.titulo}
              </Link>
              <p className="text-indigo-600 font-semibold mt-1">{formatPreco(item.preco_centavos)}</p>
            </div>
            <button
              type="button"
              onClick={() => remover(item.id)}
              className="text-gray-300 hover:text-red-500 transition-colors p-2 cursor-pointer"
              title="Remover"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Resumo */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mt-6 space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal ({itens.length} {itens.length === 1 ? 'item' : 'itens'})</span>
          <span>{formatPreco(subtotal)}</span>
        </div>

        {temDesconto && (
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>Desconto (10% por 2+ ebooks)</span>
            <span>- {formatPreco(desconto)}</span>
          </div>
        )}

        {!temDesconto && (
          <p className="text-xs text-gray-400">
            💡 Adicione mais 1 ebook e ganhe 10% de desconto.
          </p>
        )}

        <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-100 pt-3">
          <span>Total</span>
          <span>{formatPreco(total)}</span>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
        )}

        <button
          type="button"
          onClick={finalizar}
          disabled={processando}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {processando ? 'Gerando PIX…' : 'Finalizar compra com PIX'}
        </button>
        <p className="text-center text-xs text-gray-400">🔒 Pagamento seguro via PIX · entrega imediata</p>
      </div>
    </div>
  )
}
