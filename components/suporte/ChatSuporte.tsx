'use client'

import { useEffect, useRef, useState } from 'react'

type Mensagem = {
  id: string
  de_admin: boolean
  texto: string
  criado_em: string
}

export function ChatSuporte() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  async function carregar() {
    try {
      const r = await fetch('/api/suporte', { cache: 'no-store' })
      const d = await r.json()
      if (r.ok) setMensagens(d.mensagens ?? [])
    } catch {}
    setCarregado(true)
  }

  // Polling a cada 5s
  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 5000)
    return () => clearInterval(t)
  }, [])

  // Rola para o fim quando chegam mensagens novas
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true)
    setTexto('')
    // otimista
    setMensagens((prev) => [...prev, { id: 'tmp-' + Date.now(), de_admin: false, texto: t, criado_em: new Date().toISOString() }])
    try {
      await fetch('/api/suporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: t }),
      })
      await carregar()
    } catch {}
    setEnviando(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="font-semibold text-gray-900">💬 Suporte Micro Guias</p>
        <p className="text-xs text-gray-400">Tire suas dúvidas — respondemos por aqui.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {carregado && mensagens.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm">Envie sua primeira mensagem. Vamos te ajudar!</p>
          </div>
        )}

        {mensagens.map((m) => (
          <div key={m.id} className={`flex ${m.de_admin ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
              m.de_admin ? 'bg-white border border-gray-200 text-gray-800' : 'bg-indigo-600 text-white'
            }`}>
              {m.de_admin && <p className="text-[11px] font-semibold text-indigo-600 mb-0.5">Suporte</p>}
              {m.texto}
            </div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <form onSubmit={enviar} className="border-t border-gray-100 p-3 flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e) } }}
          rows={1}
          placeholder="Escreva sua mensagem…"
          className="flex-1 resize-none max-h-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={enviando || !texto.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
          Enviar
        </button>
      </form>
    </div>
  )
}
