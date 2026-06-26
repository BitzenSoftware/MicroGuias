'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReprocessarCapaButton({ id }: { id: string }) {
  const router = useRouter()
  const [estado, setEstado] = useState<'idle' | 'processando' | 'ok' | 'erro'>('idle')

  async function reenquadrar() {
    setEstado('processando')
    try {
      const fd = new FormData()
      fd.append('ebook_id', id)
      const res = await fetch('/api/admin/processar-capa', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      setEstado('ok')
      router.refresh()
    } catch {
      setEstado('erro')
    }
  }

  return (
    <button
      type="button"
      onClick={reenquadrar}
      disabled={estado === 'processando'}
      title="Reenquadrar a capa (fundo branco + 3:4)"
      className="text-sm font-medium text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
    >
      {estado === 'processando' ? 'Enquadrando…' : estado === 'ok' ? '✓ Pronto' : 'Reenquadrar'}
    </button>
  )
}
