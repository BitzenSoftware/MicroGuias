'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Categoria, Ebook } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

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
  const [descricaoLonga, setDescricaoLonga] = useState(ebook.descricao_longa ?? '')
  const [capa, setCapa] = useState<File | null>(null)
  const [pdf, setPdf] = useState<File | null>(null)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setErro(null)
    if (!categoriaId) { setErro('Selecione uma categoria.'); return }
    const precoCentavos = Math.round(parseFloat(preco.replace(',', '.')) * 100)
    if (!precoCentavos || precoCentavos <= 0) { setErro('Informe um preço válido.'); return }

    setSalvando(true)
    try {
      let capaUrl: string | null = null
      let pdfPath: string | null = null

      // Se houver arquivos novos, envia direto ao Storage (reusa o slug)
      if (capa || pdf) {
        const capaExt = capa ? capa.name.split('.').pop() || 'jpg' : undefined
        const r = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: ebook.slug, capaExt, temCapa: !!capa, temPdf: !!pdf }),
        })
        const u = await r.json()
        if (!r.ok) throw new Error(u.error || 'Falha ao preparar upload')

        const supabase = createClient()

        if (pdf && u.pdf) {
          const up = await supabase.storage.from('pdfs').uploadToSignedUrl(u.pdf.path, u.pdf.token, pdf)
          if (up.error) throw new Error('Falha ao enviar o PDF: ' + up.error.message)
          pdfPath = u.pdf.path
        }
        if (capa && u.capa) {
          const up = await supabase.storage.from('capas').uploadToSignedUrl(u.capa.path, u.capa.token, capa)
          if (up.error) throw new Error('Falha ao enviar a capa: ' + up.error.message)
          capaUrl = u.capaUrl
        }
      }

      const res = await fetch('/api/admin/atualizar-ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ebook.id,
          titulo,
          categoria_id: categoriaId,
          preco_centavos: precoCentavos,
          descricao_curta: descricaoCurta,
          descricao_longa: descricaoLonga,
          capa_url: capaUrl,
          pdf_path: pdfPath,
        }),
      })
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
            <input type="file" title="Capa do ebook" accept="image/*" onChange={(e) => setCapa(e.target.files?.[0] ?? null)}
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
            <select title="Categoria" className={inputCls} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
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

        <div>
          <label className={labelCls}>Descrição completa</label>
          <textarea className={`${inputCls} min-h-24`} value={descricaoLonga} onChange={(e) => setDescricaoLonga(e.target.value)} placeholder="Texto que aparece na página do produto" />
        </div>

        <div className="pt-2 border-t border-gray-50">
          <label className={labelCls}>Substituir arquivo do ebook (PDF)</label>
          <input type="file" title="Arquivo PDF do ebook" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100" />
          {pdf
            ? <p className="text-xs text-green-600 mt-1">Novo PDF: {pdf.name}</p>
            : <p className="text-xs text-gray-400 mt-1">Deixe vazio para manter o PDF atual.</p>}
        </div>
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
