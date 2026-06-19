'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'

export function StatusPoller({
  pedidoId,
  statusInicial,
}: {
  pedidoId: string
  statusInicial: string
}) {
  const router = useRouter()
  const { limpar } = useCart()
  const [status, setStatus] = useState(statusInicial)
  const limpouRef = useRef(false)

  // Polling enquanto não estiver pago
  useEffect(() => {
    if (status === 'pago') return
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedido-status?id=${pedidoId}`)
        const data = await res.json()
        if (data.status && data.status !== status) setStatus(data.status)
      } catch {}
    }, 4000)
    return () => clearInterval(intervalo)
  }, [pedidoId, status])

  // Limpa carrinho ao confirmar
  useEffect(() => {
    if (status === 'pago' && !limpouRef.current) {
      limpouRef.current = true
      limpar()
      router.refresh()
    }
  }, [status, limpar, router])

  if (status === 'pago') {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h1>
        <p className="text-gray-500 mt-2">Seus ebooks já estão disponíveis.</p>
        <Link
          href="/minha-conta"
          className="inline-block mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Ver meus ebooks
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="h-12 w-12 mx-auto mb-5 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      <h1 className="text-xl font-bold text-gray-900">Confirmando seu pagamento…</h1>
      <p className="text-gray-500 mt-2">
        Se você pagou com PIX, a confirmação leva alguns segundos. Não feche esta página.
      </p>
      <p className="text-xs text-gray-400 mt-4">
        Já pagou e demora?{' '}
        <Link href="/minha-conta" className="text-indigo-600 hover:underline">
          Ver meus ebooks
        </Link>
      </p>
    </div>
  )
}
