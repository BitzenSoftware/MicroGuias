'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatPreco } from '@/lib/utils'
import { salvarPromocao } from '@/app/admin/promocoes/actions'

export type EbookOpcao = {
  id: string
  titulo: string
  capa_url: string | null
  preco_centavos: number
  temPdf: boolean
}

export function PromocaoForm({
  ebooks,
  promocao,
}: {
  ebooks: EbookOpcao[]
  promocao?: {
    id: string
    nome: string
    descricao: string | null
    preco_centavos: number
    ativo: boolean
    ebookIds: string[]
  }
}) {
  const router = useRouter()

  const [nome, setNome] = useState(promocao?.nome ?? '')
  const [descricao, setDescricao] = useState(promocao?.descricao ?? '')
  const [preco, setPreco] = useState(
    promocao ? (promocao.preco_centavos / 100).toFixed(2).replace('.', ',') : ''
  )
  const [ativo, setAtivo] = useState(promocao?.ativo ?? true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set(promocao?.ebookIds ?? []))
  const [busca, setBusca] = useState('')

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return ebooks
    return ebooks.filter((e) => e.titulo.toLowerCase().includes(q))
  }, [busca, ebooks])

  const somaOriginal = ebooks
    .filter((e) => selecionados.has(e.id))
    .reduce((s, e) => s + e.preco_centavos, 0)
  const precoCentavos = Math.round((parseFloat(preco.replace(',', '.')) || 0) * 100)
  const economia = Math.max(0, somaOriginal - precoCentavos)

  function toggle(id: string) {
    setSelecionados((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function salvar() {
    setErro(null)
    if (!nome.trim()) { setErro('Informe o nome da promoção.'); return }
    if (!precoCentavos || precoCentavos <= 0) { setErro('Informe um preço válido.'); return }
    if (selecionados.size === 0) { setErro('Selecione pelo menos 1 ebook.'); return }

    setSalvando(true)
    try {
      await salvarPromocao(
        {
          nome,
          descricao,
          preco_centavos: precoCentavos,
          ativo,
          ebookIds: Array.from(selecionados),
        },
        promocao?.id
      )
      router.push('/admin/promocoes')
      router.refresh()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
      setSalvando(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <div>
          <label className={labelCls}>Nome da promoção *</label>
          <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Coleção Horizontes da Infância — Completa" />
        </div>

        <div>
          <label className={labelCls}>Descrição (opcional)</label>
          <input className={inputCls} value={descricao} onChange={(e) => setDescricao(e.target.value)}
            placeholder="Aparece na página do combo" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Preço do combo (R$) *</label>
            <input className={inputCls} value={preco} onChange={(e) => setPreco(e.target.value)} inputMode="decimal" placeholder="79,00" />
          </div>
          <div className="flex items-end">
            <div className="flex items-center justify-between w-full rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-2.5">
              <span className="text-sm font-medium text-gray-800">{ativo ? 'Ativo' : 'Inativo'}</span>
              <button type="button" role="switch" aria-checked={ativo ? 'true' : 'false'}
                onClick={() => setAtivo((v) => !v)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${ativo ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Resumo de economia */}
        {selecionados.size > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <span className="text-gray-600">{selecionados.size} ebook{selecionados.size > 1 ? 's' : ''}</span>
            <span className="text-gray-600">Soma avulsa: <s>{formatPreco(somaOriginal)}</s></span>
            <span className="text-indigo-700 font-semibold">Combo: {formatPreco(precoCentavos)}</span>
            {economia > 0 && <span className="text-green-600 font-semibold">Economia: {formatPreco(economia)}</span>}
          </div>
        )}
      </div>

      {/* Seleção de ebooks */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <label className={labelCls + ' mb-0'}>Ebooks do combo *</label>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔍 Buscar…"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {filtrados.map((e) => {
            const marcado = selecionados.has(e.id)
            return (
              <button key={e.id} type="button" onClick={() => toggle(e.id)}
                className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  marcado ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'
                }`}>
                <div className={`h-5 w-5 flex-shrink-0 rounded border flex items-center justify-center text-xs ${marcado ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                  {marcado ? '✓' : ''}
                </div>
                <div className="relative h-12 w-9 flex-shrink-0 rounded overflow-hidden bg-white border border-gray-100">
                  {e.capa_url ? (
                    <Image src={e.capa_url} alt={e.titulo} fill className="object-contain p-0.5" sizes="36px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm">📖</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 line-clamp-2 leading-snug">{e.titulo}</p>
                  <p className="text-xs text-gray-400">
                    {formatPreco(e.preco_centavos)}
                    {!e.temPdf && <span className="text-amber-600"> · sem PDF</span>}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/admin/promocoes')}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
          Cancelar
        </button>
        <button type="button" onClick={salvar} disabled={salvando}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
          {salvando ? 'Salvando…' : 'Salvar promoção'}
        </button>
      </div>
    </div>
  )
}
