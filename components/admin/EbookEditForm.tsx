'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Categoria, Ebook } from '@/lib/types'

export function EbookEditForm({
  ebook,
  categorias,
}: {
  ebook: Ebook
  categorias: Categoria[]
}) {
  const router = useRouter()

  const [titulo, setTitulo] = useState(ebook.titulo)
  const [categoriaId, setCategoriaId] = useState(ebook.categoria_id ?? '')
  const [preco, setPreco] = useState((ebook.preco_centavos / 100).toFixed(2).replace('.', ','))
  const [descricaoCurta, setDescricaoCurta] = useState(ebook.descricao_curta ?? '')
  const [capa, setCapa] = useState<File | null>(null)
  const [regenerarPdf, setRegenerarPdf] = useState(false)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const temConteudo = !!ebook.conteudo

  async function salvar() {
    setErro(null)
    if (!categoriaId) { setErro('Selecione uma categoria.'); return }
    const precoCentavos = Math.round(parseFloat(preco.replace(',', '.')) * 100)
    if (!precoCentavos || precoCentavos <= 0) { setErro('Informe um preço válido.'); return }

    setSalvando(true)
    try {
      const form = new FormData()
      form.append('id', ebook.id)
      form.append('titulo', titulo)
      form.append('categoria_id', categoriaId)
      form.append('preco_centavos', String(precoCentavos))
      form.append('descricao_curta', descricaoCurta)
      form.append('regenerar_pdf', String(regenerarPdf))
      if (capa) form.append('capa', capa)

      const res = await fetch('/api/admin/atualizar-ebook', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')

      router.push('/admin/ebooks')
      router.refresh()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex gap-5">
          {/* Capa atual */}
          <div className="relative h-32 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-indigo-50">
            {ebook.capa_url ? (
              <Image src={ebook.capa_url} alt={ebook.titulo} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-3xl">📖</div>
            )}
          </div>
          <div className="flex-1">
            <label className={labelCls}>{ebook.capa_url ? 'Trocar capa' : 'Adicionar capa'}</label>
            <input type="file" accept="image/*" onChange={(e) => setCapa(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100" />
            {capa && <p className="text-xs text-green-600 mt-2">Nova capa: {capa.name}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Título *</label>
          <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Categoria *</label>
            <select className={inputCls} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Selecione…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.icone_emoji} {c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Preço (R$) *</label>
            <input className={inputCls} value={preco} onChange={(e) => setPreco(e.target.value)} inputMode="decimal" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Descrição curta</label>
          <input className={inputCls} value={descricaoCurta} onChange={(e) => setDescricaoCurta(e.target.value)} />
        </div>

        {temConteudo && (
          <label className="flex items-center gap-2 text-sm text-gray-600 pt-2">
            <input type="checkbox" checked={regenerarPdf} onChange={(e) => setRegenerarPdf(e.target.checked)} />
            Regenerar o PDF com o novo título
          </label>
        )}
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/admin/ebooks')}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
          Cancelar
        </button>
        <button type="button" onClick={salvar} disabled={salvando}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
