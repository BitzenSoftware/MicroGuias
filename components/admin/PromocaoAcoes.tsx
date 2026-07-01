'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePromocaoAtiva, excluirPromocao } from '@/app/admin/promocoes/actions'

export function PromocaoAcoes({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmar, setConfirmar] = useState(false)

  function toggle() {
    startTransition(async () => {
      await togglePromocaoAtiva(id, !ativo)
      router.refresh()
    })
  }

  function excluir() {
    startTransition(async () => {
      await excluirPromocao(id)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggle} disabled={pending}
        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
          ativo ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={ativo ? 'Ativo — clique para ocultar' : 'Inativo — clique para ativar'}>
        {ativo ? '● Ativo' : '○ Inativo'}
      </button>

      {confirmar ? (
        <span className="flex items-center gap-1">
          <button type="button" onClick={excluir} disabled={pending}
            className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded cursor-pointer disabled:opacity-50">
            Excluir
          </button>
          <button type="button" onClick={() => setConfirmar(false)}
            className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">
            Cancelar
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirmar(true)}
          className="text-gray-300 hover:text-red-500 transition-colors p-1.5 cursor-pointer"
          title={`Excluir "${nome}"`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      )}
    </div>
  )
}
