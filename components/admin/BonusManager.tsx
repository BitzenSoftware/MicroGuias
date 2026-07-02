'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { adicionarBonus, removerBonus, atualizarCapaBonus } from '@/app/admin/ebooks/bonus-actions'
import type { EbookBonus } from '@/lib/types'

export function BonusManager({
  ebookId,
  bonusIniciais,
}: {
  ebookId: string
  bonusIniciais: EbookBonus[]
}) {
  const [bonus, setBonus] = useState<EbookBonus[]>(bonusIniciais)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [capa, setCapa] = useState<File | null>(null)
  const [nome, setNome] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const [capaEnviando, setCapaEnviando] = useState<string | null>(null)
  const capaRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function enviarCapaExistente(bonusId: string, file: File) {
    setErro(null)
    setCapaEnviando(bonusId)
    try {
      const capaExt = file.name.split('.').pop() || 'jpg'
      const r = await fetch('/api/admin/bonus-capa-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ebookId, capaExt }),
      })
      const u = await r.json()
      if (!r.ok) throw new Error(u.error || 'Falha ao preparar upload')

      const supabase = createClient()
      const up = await supabase.storage.from('capas').uploadToSignedUrl(u.path, u.token, file)
      if (up.error) throw new Error('Falha ao enviar a capa: ' + up.error.message)

      await atualizarCapaBonus(bonusId, u.capaUrl)
      setBonus((prev) => prev.map((b) => (b.id === bonusId ? { ...b, capa_url: u.capaUrl } : b)))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar a capa')
    } finally {
      setCapaEnviando(null)
    }
  }

  function escolher(f: File | null) {
    setArquivo(f)
    if (f && !nome) setNome(f.name.replace(/\.[^.]+$/, ''))
  }

  async function anexar() {
    setErro(null)
    if (!arquivo) { setErro('Escolha um arquivo.'); return }
    if (!nome.trim()) { setErro('Dê um nome ao bônus.'); return }

    setEnviando(true)
    try {
      // 1) URL(s) assinada(s)
      const capaExt = capa ? capa.name.split('.').pop() || 'jpg' : undefined
      const r = await fetch('/api/admin/bonus-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ebookId, nomeArquivo: arquivo.name, temCapa: !!capa, capaExt }),
      })
      const u = await r.json()
      if (!r.ok) throw new Error(u.error || 'Falha ao preparar upload')

      const supabase = createClient()

      // 2) Upload do arquivo do bônus
      const up = await supabase.storage.from('pdfs').uploadToSignedUrl(u.path, u.token, arquivo)
      if (up.error) throw new Error('Falha ao enviar o arquivo: ' + up.error.message)

      // 3) Upload da capa (opcional)
      let capaUrl: string | null = null
      if (capa && u.capa) {
        const upc = await supabase.storage.from('capas').uploadToSignedUrl(u.capa.path, u.capa.token, capa)
        if (upc.error) throw new Error('Falha ao enviar a capa: ' + upc.error.message)
        capaUrl = u.capaUrl
      }

      // 4) Registra no banco
      await adicionarBonus(ebookId, nome, u.path, capaUrl)

      // 5) Atualiza a lista localmente
      setBonus((prev) => [
        ...prev,
        { id: crypto.randomUUID(), ebook_id: ebookId, nome: nome.trim(), arquivo_path: u.path, capa_url: capaUrl, criado_em: new Date().toISOString() },
      ])
      setArquivo(null)
      setCapa(null)
      setNome('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao anexar bônus')
    } finally {
      setEnviando(false)
    }
  }

  async function remover(id: string) {
    setRemovendo(id)
    try {
      await removerBonus(id)
      setBonus((prev) => prev.filter((b) => b.id !== id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover')
    } finally {
      setRemovendo(null)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">🎁 Bônus do ebook</h2>
        <p className="text-xs text-gray-400">
          Arquivos extras (PDF, planilha…) que o cliente que comprou pode <strong>baixar</strong>.
        </p>
      </div>

      {/* Lista */}
      {bonus.length > 0 ? (
        <ul className="space-y-2">
          {bonus.map((b) => (
            <li key={b.id} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
              <div className="relative h-12 w-9 flex-shrink-0 rounded overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                {b.capa_url ? (
                  <Image src={b.capa_url} alt={b.nome} fill className="object-contain p-0.5" sizes="36px" />
                ) : (
                  <span className="text-lg">📎</span>
                )}
              </div>
              <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{b.nome}</span>

              <input
                type="file"
                accept="image/*"
                title="Capa do bônus"
                ref={(el) => { capaRefs.current[b.id] = el }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) enviarCapaExistente(b.id, f)
                  e.target.value = ''
                }}
                className="hidden"
              />
              <button type="button" onClick={() => capaRefs.current[b.id]?.click()} disabled={capaEnviando === b.id}
                className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded cursor-pointer disabled:opacity-50">
                {capaEnviando === b.id ? 'Enviando…' : b.capa_url ? 'Trocar capa' : '+ Capa'}
              </button>

              <button type="button" onClick={() => remover(b.id)} disabled={removendo === b.id}
                className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded cursor-pointer disabled:opacity-50">
                {removendo === b.id ? 'Removendo…' : 'Remover'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400">Nenhum bônus anexado ainda.</p>
      )}

      {/* Anexar novo */}
      <div className="border-t border-gray-50 pt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Arquivo</label>
            <input type="file" title="Arquivo do bônus" onChange={(e) => escolher(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome exibido</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Prompt Book do Contador Pro"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Capa do bônus (opcional)</label>
            <input type="file" title="Capa do bônus" accept="image/*" onChange={(e) => setCapa(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100" />
            {capa && <p className="text-xs text-green-600 mt-1">{capa.name}</p>}
          </div>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}

        <button type="button" onClick={anexar} disabled={enviando || !arquivo}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
          {enviando ? 'Anexando…' : '+ Anexar bônus'}
        </button>
      </div>
    </div>
  )
}
