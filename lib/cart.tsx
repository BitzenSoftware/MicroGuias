'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CartItem = {
  id: string
  titulo: string
  slug: string
  preco_centavos: number
  capa_url: string | null
}

type CartContextType = {
  itens: CartItem[]
  adicionar: (item: CartItem) => void
  remover: (id: string) => void
  limpar: () => void
  temNoCarrinho: (id: string) => boolean
  subtotal: number
  desconto: number
  total: number
  temDesconto: boolean
  carregado: boolean
}

const CartContext = createContext<CartContextType | null>(null)
const PREFIXO = 'microguias_carrinho'
const PERCENTUAL_DESCONTO = 0.1 // 10% para 2+ ebooks

// Carrinho isolado por conta: cada usuário tem sua própria chave; visitante a sua.
const chaveDe = (uid: string | null) => `${PREFIXO}:${uid ?? 'guest'}`

function lerCarrinho(uid: string | null): CartItem[] {
  try {
    const raw = localStorage.getItem(chaveDe(uid))
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function gravarCarrinho(uid: string | null, itens: CartItem[]) {
  try {
    localStorage.setItem(chaveDe(uid), JSON.stringify(itens))
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<CartItem[]>([])
  const [carregado, setCarregado] = useState(false)
  const [supabase] = useState(() => createClient())
  const userIdRef = useRef<string | null>(null)

  // Inicializa com a sessão atual e reage a login/logout/troca de conta
  useEffect(() => {
    let ativo = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!ativo) return
      userIdRef.current = user?.id ?? null
      setItens(lerCarrinho(userIdRef.current))
      setCarregado(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const novoId = session?.user?.id ?? null
      const anterior = userIdRef.current
      if (novoId === anterior) return

      if (novoId) {
        // Logou (ou trocou de conta): mescla o carrinho de visitante na conta
        const visitante = lerCarrinho(null)
        const daConta = lerCarrinho(novoId)
        const mesclado = [...daConta]
        for (const v of visitante) {
          if (!mesclado.some((i) => i.id === v.id)) mesclado.push(v)
        }
        if (visitante.length) localStorage.removeItem(chaveDe(null))
        userIdRef.current = novoId
        gravarCarrinho(novoId, mesclado)
        setItens(mesclado)
      } else {
        // Saiu: passa a usar o carrinho de visitante (a conta fica salva na chave dela)
        userIdRef.current = null
        setItens(lerCarrinho(null))
      }
    })

    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  // Persiste mudanças na chave do usuário atual
  useEffect(() => {
    if (carregado) gravarCarrinho(userIdRef.current, itens)
  }, [itens, carregado])

  const adicionar = useCallback((item: CartItem) => {
    setItens((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]))
  }, [])

  const remover = useCallback((id: string) => {
    setItens((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const limpar = useCallback(() => setItens([]), [])

  const temNoCarrinho = useCallback((id: string) => itens.some((i) => i.id === id), [itens])

  const subtotal = itens.reduce((s, i) => s + i.preco_centavos, 0)
  const temDesconto = itens.length >= 2
  const desconto = temDesconto ? Math.round(subtotal * PERCENTUAL_DESCONTO) : 0
  const total = subtotal - desconto

  return (
    <CartContext.Provider
      value={{ itens, adicionar, remover, limpar, temNoCarrinho, subtotal, desconto, total, temDesconto, carregado }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de CartProvider')
  return ctx
}
