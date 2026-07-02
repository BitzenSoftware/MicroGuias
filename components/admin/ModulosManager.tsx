'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { adicionarModulo, removerModulo } from '@/app/admin/ebooks/modulo-actions'
import type { EbookModulo } from '@/lib/types'

export function ModulosManager({
  ebookId,
  modulosIniciais,
}: {
  ebookId: string
  modulosIniciais: EbookModulo[]
}) {
  const [modulos, setModulos] = useState<EbookModulo[]>(modulosIniciais)
  const [titulo, setTitulo] = useState('')
  const [pdf, setPdf] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<string | null>(null)

  function escolher(f: File | null) {
    setPdf(f)
    if (f && !titulo) setTitulo(f.name.replace(/\.[^.]+$/, ''))
  }

  async function anexar() {
    setErro(null)
    if (!pdf) { setErro('Escolha o PDF do módulo.'); return }
    if (!titulo.trim()) { setErro('Dê um título ao módulo.'); return }

    setEnviando(true)
    try {
      const r = await fetch('/api/admin/modulo-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ebookId, nomeArquivo: pdf.name }),
      })
      const u = await r.json()
      if (!r.ok) throw new Error(u.error || 'Falha ao preparar upload')

      const supabase = createClient()
      const up = await supabase.storage.from('pdfs').uploadToSignedUrl(u.path, u.token, pdf)
      if (up.error) throw new Error('Falha ao enviar o PDF: ' + up.error.message)

      await adicionarModulo(ebookId, titulo, u.path)

      setModulos((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ebook_id: ebookId, titulo: titulo.trim(), ordem: prev.length, arquivo_path: u.path, criado_em: new Date().toISOString() },
      ])
      setPdf(null)
      setTitulo('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar módulo')
    } finally {
      setEnviando(false)
    }
  }

  async function remover(id: string) {
    setRemovendo(id)
    try {
      await removerModulo(id)
      setModulos((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover')
    } finally {
      setRemovendo(null)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">🎓 Módulos do curso</h2>
        <p className="text-xs text-gray-400">Um PDF por módulo. O aluno lê online, na ordem, dentro da Biblioteca.</p>
      </div>

      {modulos.length > 0 ? (
        <ol className="space-y-2">
          {modulos.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">{i + 1}</span>
              <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{m.titulo}</span>
              <button type="button" onClick={() => remover(m.id)} disabled={removendo === m.id}
                className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded cursor-pointer disabled:opacity-50">
                {removendo === m.id ? 'Removendo…' : 'Remover'}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-gray-400">Nenhum módulo adicionado ainda.</p>
      )}

      <div className="border-t border-gray-50 pt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título do módulo</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Módulo 1 — Fundamentos"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">PDF do módulo</label>
            <input type="file" title="PDF do módulo" accept="application/pdf" onChange={(e) => escolher(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100" />
          </div>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}

        <button type="button" onClick={anexar} disabled={enviando || !pdf}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
          {enviando ? 'Enviando…' : '+ Adicionar módulo'}
        </button>
      </div>
    </div>
  )
}
