'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Categoria } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export function EbookForm({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter()

  const [titulo, setTitulo] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [preco, setPreco] = useState('')
  const [descricaoCurta, setDescricaoCurta] = useState('')
  const [descricaoLonga, setDescricaoLonga] = useState('')
  const [capa, setCapa] = useState<File | null>(null)
  const [pdf, setPdf] = useState<File | null>(null)

  const [publicando, setPublicando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function publicar() {
    setErro(null)
    if (!titulo.trim()) { setErro('Informe o título.'); return }
    if (!categoriaId) { setErro('Selecione uma categoria.'); return }
    const precoCentavos = Math.round(parseFloat(preco.replace(',', '.')) * 100)
    if (!precoCentavos || precoCentavos <= 0) { setErro('Informe um preço válido.'); return }
    if (!pdf) { setErro('Anexe o arquivo PDF do ebook.'); return }

    setPublicando(true)
    try {
      // 1) Pede URL de upload assinada só para o PDF (arquivo grande)
      const r = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, temCapa: false, temPdf: true }),
      })
      const u = await r.json()
      if (!r.ok) throw new Error(u.error || 'Falha ao preparar upload')

      // 2) Envia o PDF direto ao Storage (sem limite de 4,5 MB)
      const supabase = createClient()
      const upPdf = await supabase.storage
        .from('pdfs')
        .uploadToSignedUrl(u.pdf.path, u.pdf.token, pdf)
      if (upPdf.error) throw new Error('Falha ao enviar o PDF: ' + upPdf.error.message)

      // 3) Capa passa pelo processador (fundo branco + enquadrar em 3:4)
      let capaUrl: string | null = null
      if (capa) {
        const fd = new FormData()
        fd.append('capa', capa)
        fd.append('slug', u.slug)
        const rc = await fetch('/api/admin/processar-capa', { method: 'POST', body: fd })
        const dc = await rc.json()
        if (!rc.ok) throw new Error(dc.error || 'Falha ao processar a capa')
        capaUrl = dc.capaUrl
      }

      // 3) Cria o registro do ebook
      const res = await fetch('/api/admin/criar-ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          slug: u.slug,
          categoria_id: categoriaId,
          preco_centavos: precoCentavos,
          descricao_curta: descricaoCurta,
          descricao_longa: descricaoLonga,
          capa_url: capaUrl,
          pdf_path: u.pdf.path,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao publicar')

      router.push('/admin/ebooks')
      router.refresh()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setPublicando(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  const fileCls = 'text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100'

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div>
          <label className={labelCls}>Título *</label>
          <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Finanças Descomplicadas" />
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
            <input className={inputCls} value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="19,90" inputMode="decimal" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Descrição curta</label>
          <input className={inputCls} value={descricaoCurta} onChange={(e) => setDescricaoCurta(e.target.value)}
            placeholder="Uma linha que aparece no card da loja" />
        </div>

        <div>
          <label className={labelCls}>Descrição completa</label>
          <textarea className={`${inputCls} min-h-24`} value={descricaoLonga} onChange={(e) => setDescricaoLonga(e.target.value)}
            placeholder="Texto que aparece na página do produto" />
        </div>
      </div>

      {/* Arquivos */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">📎 Arquivos</h2>

        <div>
          <label className={labelCls}>Capa (imagem)</label>
          <input type="file" title="Capa do ebook" accept="image/*" onChange={(e) => setCapa(e.target.files?.[0] ?? null)} className={fileCls} />
          {capa && <p className="text-xs text-green-600 mt-1">✓ {capa.name}</p>}
        </div>

        <div>
          <label className={labelCls}>Arquivo do ebook (PDF) *</label>
          <input type="file" title="Arquivo PDF do ebook" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} className={fileCls} />
          {pdf && <p className="text-xs text-green-600 mt-1">✓ {pdf.name}</p>}
          <p className="text-xs text-gray-400 mt-1">Gere no Gamma, exporte como PDF e anexe aqui.</p>
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
        <button type="button" onClick={publicar} disabled={publicando}
          className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer">
          {publicando ? 'Publicando…' : 'Publicar ebook'}
        </button>
      </div>
    </div>
  )
}
