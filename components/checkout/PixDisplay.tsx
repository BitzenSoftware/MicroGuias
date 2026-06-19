'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { formatPreco } from '@/lib/utils'

export function PixDisplay({
  pedidoId,
  statusInicial,
  totalCentavos,
  qrCodeBase64,
  copiaCola,
}: {
  pedidoId: string
  statusInicial: string
  totalCentavos: number
  qrCodeBase64: string | null
  copiaCola: string | null
}) {
  const router = useRouter()
  const { limpar } = useCart()
  const [status, setStatus] = useState(statusInicial)
  const [copiado, setCopiado] = useState(false)
  const limpouRef = useRef(false)

  const qrSrc = qrCodeBase64
    ? qrCodeBase64.startsWith('data:')
      ? qrCodeBase64
      : `data:image/png;base64,${qrCodeBase64}`
    : null

  // Polling do status
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

  // Quando pago: limpa carrinho e redireciona
  useEffect(() => {
    if (status === 'pago' && !limpouRef.current) {
      limpouRef.current = true
      limpar()
      const t = setTimeout(() => {
        router.push('/minha-conta')
        router.refresh()
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [status, limpar, router])

  function copiar() {
    if (!copiaCola) return
    navigator.clipboard.writeText(copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (status === 'pago') {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h1>
        <p className="text-gray-500 mt-2">Seus ebooks já estão disponíveis para download.</p>
        <p className="text-sm text-gray-400 mt-4">Redirecionando para sua conta…</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pague com PIX</h1>
        <p className="text-gray-500 mt-1">
          Total: <span className="font-bold text-indigo-600">{formatPreco(totalCentavos)}</span>
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        {/* QR Code */}
        {qrSrc ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR Code PIX" className="w-56 h-56 rounded-lg border border-gray-100" />
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400">QR Code indisponível</p>
        )}

        {/* Copia e cola */}
        {copiaCola && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">PIX copia e cola</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={copiaCola}
                title="Código PIX copia e cola"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50 truncate"
              />
              <button
                type="button"
                onClick={copiar}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 border-t border-gray-100 pt-4">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Aguardando pagamento…
        </div>
        <p className="text-center text-xs text-gray-400">
          A confirmação é automática. Não feche esta página após pagar.
        </p>
      </div>
    </div>
  )
}
