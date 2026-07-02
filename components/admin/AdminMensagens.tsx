'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Conversa = {
  id: string
  nome: string
  email: string
  ultima: string
  atualizado_em: string
  naoLidas: number
}

type Mensagem = {
  id: string
  de_admin: boolean
  texto: string
  criado_em: string
}

export function AdminMensagens() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [selecionada, setSelecionada] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)
  const selId = selecionada?.id ?? null

  const carregarConversas = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/mensagens', { cache: 'no-store' })
      const d = await r.json()
      if (r.ok) setConversas(d.conversas ?? [])
    } catch {}
  }, [])

  const carregarMensagens = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/admin/mensagens/${id}`, { cache: 'no-store' })
      const d = await r.json()
      if (r.ok) setMensagens(d.mensagens ?? [])
    } catch {}
  }, [])

  // Polling da lista
  useEffect(() => {
    carregarConversas()
    const t = setInterval(carregarConversas, 5000)
    return () => clearInterval(t)
  }, [carregarConversas])

  // Polling da conversa aberta
  useEffect(() => {
    if (!selId) return
    carregarMensagens(selId)
    const t = setInterval(() => carregarMensagens(selId), 4000)
    return () => clearInterval(t)
  }, [selId, carregarMensagens])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  async function responder(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t || !selId || enviando) return
    setEnviando(true)
    setTexto('')
    setMensagens((prev) => [...prev, { id: 'tmp-' + Date.now(), de_admin: true, texto: t, criado_em: new Date().toISOString() }])
    try {
      await fetch(`/api/admin/mensagens/${selId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: t }),
      })
      await carregarMensagens(selId)
      carregarConversas()
    } catch {}
    setEnviando(false)
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] border border-gray-200 rounded-2xl overflow-hidden bg-white">
      {/* Lista de conversas */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Conversas</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 px-3">Nenhuma conversa ainda.</p>
          ) : (
            conversas.map((c) => {
              const ativo = selId === c.id
              return (
                <button key={c.id} type="button" onClick={() => setSelecionada(c)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer ${ativo ? 'bg-indigo-50' : 'hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium truncate ${ativo ? 'text-indigo-700' : 'text-gray-800'}`}>{c.nome}</span>
                    {c.naoLidas > 0 && (
                      <span className="text-[10px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 flex-shrink-0">{c.naoLidas}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.ultima || 'Sem mensagens'}</p>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Conversa */}
      <section className="flex-1 min-w-0 flex flex-col">
        {selecionada ? (
          <>
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="font-semibold text-gray-900">{selecionada.nome}</p>
              <p className="text-xs text-gray-400">{selecionada.email}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {mensagens.map((m) => (
                <div key={m.id} className={`flex ${m.de_admin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                    m.de_admin ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    {m.texto}
                  </div>
                </div>
              ))}
              <div ref={fimRef} />
            </div>

            <form onSubmit={responder} className="border-t border-gray-100 p-3 flex items-end gap-2">
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); responder(e) } }}
                rows={1} placeholder="Responder…"
                className="flex-1 resize-none max-h-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" disabled={enviando || !texto.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-gray-400">
            <div>
              <p className="text-4xl mb-3">💬</p>
              <p>Selecione uma conversa para responder.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
