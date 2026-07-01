'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ComprarComboButton({
  promocaoId,
  slug,
  disponivel = true,
}: {
  promocaoId: string
  slug: string
  disponivel?: boolean
}) {
  const router = useRouter()
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function comprar() {
    setErro(null)
    setProcessando(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promocaoId }),
      })

      if (res.status === 401) {
        router.push(`/login?next=/promocao/${slug}`)
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao iniciar o pagamento')
      window.location.href = data.initPoint
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao comprar')
    } finally {
      setProcessando(false)
    }
  }

  if (!disponivel) {
    return (
      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-center">
        Combo temporariamente indisponível.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={comprar}
        disabled={processando}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 cursor-pointer"
      >
        {processando ? 'Redirecionando…' : '🔥 Comprar combo agora'}
      </button>
      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
      )}
    </div>
  )
}
