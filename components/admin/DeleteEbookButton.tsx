'use client'

import { useState, useTransition } from 'react'
import { excluirEbook } from '@/app/admin/ebooks/actions'

export function DeleteEbookButton({ id, titulo }: { id: string; titulo: string }) {
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function confirmar() {
    setErro(null)
    startTransition(async () => {
      try {
        await excluirEbook(id)
        setAberto(false)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao excluir')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setErro(null); setAberto(true) }}
        className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
      >
        Excluir
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="text-3xl mb-3">🗑️</div>
            <h2 className="text-lg font-bold text-gray-900">Excluir ebook?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tem certeza que quer excluir <strong className="text-gray-700">{titulo}</strong>?
              O PDF e a capa também serão apagados. Esta ação não pode ser desfeita.
            </p>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
                {erro}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={pending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={pending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {pending ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
