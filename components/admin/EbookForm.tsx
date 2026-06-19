'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Categoria, EbookConteudo } from '@/lib/types'

export function EbookForm({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter()

  const [titulo, setTitulo] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [preco, setPreco] = useState('') // em reais, ex "19,90"
  const [descricaoCurta, setDescricaoCurta] = useState('')
  const [prompt, setPrompt] = useState('')
  const [nCapitulos, setNCapitulos] = useState(8)
  const [capa, setCapa] = useState<File | null>(null)

  const [conteudo, setConteudo] = useState<EbookConteudo | null>(null)
  const [gerando, setGerando] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function gerarConteudo() {
    setErro(null)
    if (!titulo.trim() || !prompt.trim()) {
      setErro('Preencha o título e as instruções para a IA.')
      return
    }
    setGerando(true)
    try {
      const res = await fetch('/api/admin/gerar-conteudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, prompt, nCapitulos }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar conteúdo')
      setConteudo(data.conteudo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar conteúdo')
    } finally {
      setGerando(false)
    }
  }

  async function publicar() {
    setErro(null)
    if (!conteudo) return
    if (!categoriaId) { setErro('Selecione uma categoria.'); return }
    const precoCentavos = Math.round(parseFloat(preco.replace(',', '.')) * 100)
    if (!precoCentavos || precoCentavos <= 0) { setErro('Informe um preço válido.'); return }

    setPublicando(true)
    try {
      const form = new FormData()
      form.append('titulo', titulo)
      form.append('categoria_id', categoriaId)
      form.append('preco_centavos', String(precoCentavos))
      form.append('descricao_curta', descricaoCurta)
      form.append('gemini_prompt', prompt)
      form.append('conteudo', JSON.stringify(conteudo))
      if (capa) form.append('capa', capa)

      const res = await fetch('/api/admin/criar-ebook', { method: 'POST', body: form })
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

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div>
          <label className={labelCls}>Título *</label>
          <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Guia de Alimentação Low Carb para Iniciantes" />
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
            <input className={inputCls} value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="19,90" inputMode="decimal" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Descrição curta</label>
          <input className={inputCls} value={descricaoCurta} onChange={(e) => setDescricaoCurta(e.target.value)}
            placeholder="Uma linha que aparece no card da loja" />
        </div>

        <div>
          <label className={labelCls}>Capa (imagem)</label>
          <input type="file" accept="image/*" onChange={(e) => setCapa(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100" />
        </div>
      </div>

      {/* Geração IA */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">✨ Conteúdo com IA</h2>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">Capítulos:</label>
            <input type="number" min={3} max={15} value={nCapitulos}
              onChange={(e) => setNCapitulos(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Instruções para a IA *</label>
          <textarea className={`${inputCls} min-h-24`} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Escreva para iniciantes brasileiros, linguagem simples, inclua dicas práticas e exemplos de cardápio." />
        </div>

        <button type="button" onClick={gerarConteudo} disabled={gerando}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 cursor-pointer">
          {gerando ? 'Gerando conteúdo…' : conteudo ? 'Regenerar conteúdo' : 'Gerar conteúdo'}
        </button>
      </div>

      {/* Preview */}
      {conteudo && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pré-visualização</h2>
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <p className="font-bold text-lg text-gray-900">{conteudo.titulo}</p>
            <p className="text-sm text-indigo-600">{conteudo.subtitulo}</p>
            <p className="text-sm text-gray-500 mt-2 line-clamp-3">{conteudo.introducao}</p>
          </div>
          <div className="space-y-2">
            {conteudo.capitulos.map((cap, i) => (
              <details key={i} className="border border-gray-100 rounded-xl">
                <summary className="px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer">
                  Cap. {i + 1} — {cap.titulo}
                </summary>
                <p className="px-4 pb-3 text-sm text-gray-500 whitespace-pre-line">{cap.conteudo}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
      )}

      {/* Publicar */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/admin/ebooks')}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
          Cancelar
        </button>
        <button type="button" onClick={publicar} disabled={!conteudo || publicando}
          className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer">
          {publicando ? 'Publicando…' : 'Gerar PDF e publicar'}
        </button>
      </div>
    </div>
  )
}
