'use client'

import { useState, useTransition } from 'react'
import { togglePublicado } from '@/app/admin/ebooks/actions'

export function TogglePublicado({ id, publicado }: { id: string; publicado: boolean }) {
  const [estado, setEstado] = useState(publicado)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const novo = !estado
    setEstado(novo) // otimista
    startTransition(async () => {
      try {
        await togglePublicado(id, novo)
      } catch {
        setEstado(!novo) // reverte
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
        estado
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${estado ? 'bg-green-500' : 'bg-gray-400'}`} />
      {estado ? 'Publicado' : 'Rascunho'}
    </button>
  )
}
