'use client'

import { useState, useTransition } from 'react'
import type { Categoria } from '@/lib/types'
import { criarCategoria, atualizarCategoria, excluirCategoria } from '@/app/admin/categorias/actions'

export function CategoriasManager({ categorias }: { categorias: Categoria[] }) {
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  // Form de nova categoria
  const [novoNome, setNovoNome] = useState('')
  const [novoIcone, setNovoIcone] = useState('')
  const [novaOrdem, setNovaOrdem] = useState<number>((categorias.at(-1)?.ordem ?? 0) + 1)

  function handleCriar() {
    setErro(null)
    startTransition(async () => {
      try {
        await criarCategoria(novoNome, novoIcone, novaOrdem)
        setNovoNome(''); setNovoIcone(''); setNovaOrdem(novaOrdem + 1)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao criar')
      }
    })
  }

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div className="space-y-6">
      {/* Nova categoria */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Nova categoria</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Emoji</label>
            <input className={`${inputCls} w-16 text-center`} value={novoIcone} onChange={(e) => setNovoIcone(e.target.value)} placeholder="📚" />
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-gray-500 mb-1">Nome</label>
            <input className={`${inputCls} w-full`} value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Produtividade" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ordem</label>
            <input type="number" className={`${inputCls} w-20`} value={novaOrdem} onChange={(e) => setNovaOrdem(Number(e.target.value))} title="Ordem de exibição" />
          </div>
          <button
            type="button"
            onClick={handleCriar}
            disabled={pending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Adicionar
          </button>
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {categorias.map((cat) => (
          <CategoriaRow key={cat.id} categoria={cat} onErro={setErro} />
        ))}
      </div>
    </div>
  )
}

function CategoriaRow({ categoria, onErro }: { categoria: Categoria; onErro: (s: string | null) => void }) {
  const [pending, startTransition] = useTransition()
  const [nome, setNome] = useState(categoria.nome)
  const [icone, setIcone] = useState(categoria.icone_emoji)
  const [ordem, setOrdem] = useState(categoria.ordem)
  const [ativa, setAtiva] = useState(categoria.ativa ?? true)
  const [confirmar, setConfirmar] = useState(false)

  const alterado = nome !== categoria.nome || icone !== categoria.icone_emoji || ordem !== categoria.ordem || ativa !== (categoria.ativa ?? true)

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  function salvar() {
    onErro(null)
    startTransition(async () => {
      try { await atualizarCategoria(categoria.id, nome, icone, ordem, ativa) }
      catch (e) { onErro(e instanceof Error ? e.message : 'Erro ao salvar') }
    })
  }

  function excluir() {
    onErro(null)
    startTransition(async () => {
      try { await excluirCategoria(categoria.id); setConfirmar(false) }
      catch (e) { onErro(e instanceof Error ? e.message : 'Erro ao excluir') }
    })
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 bg-white border rounded-2xl p-3 ${ativa ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
      <input className={`${inputCls} w-14 text-center`} value={icone} onChange={(e) => setIcone(e.target.value)} title="Emoji" />
      <input className={`${inputCls} flex-1 min-w-40`} value={nome} onChange={(e) => setNome(e.target.value)} title="Nome" />
      <input type="number" className={`${inputCls} w-20`} value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} title="Ordem" />

      <label className="flex items-center gap-1.5 text-sm text-gray-600 select-none cursor-pointer">
        <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} />
        Ativa
      </label>

      <button
        type="button"
        onClick={salvar}
        disabled={pending || !alterado}
        className="text-sm font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 cursor-pointer"
      >
        Salvar
      </button>

      {confirmar ? (
        <span className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Excluir?</span>
          <button type="button" onClick={excluir} disabled={pending} className="text-red-600 font-semibold hover:underline cursor-pointer">Sim</button>
          <button type="button" onClick={() => setConfirmar(false)} className="text-gray-500 hover:underline cursor-pointer">Não</button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Excluir
        </button>
      )}
    </div>
  )
}
