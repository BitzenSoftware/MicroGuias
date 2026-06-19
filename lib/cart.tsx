'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

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
}

const CartContext = createContext<CartContextType | null>(null)
const STORAGE_KEY = 'microguias_carrinho'
const PERCENTUAL_DESCONTO = 0.1 // 10% para 2+ ebooks

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<CartItem[]>([])
  const [carregado, setCarregado] = useState(false)

  // Carrega do localStorage na montagem
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItens(JSON.parse(raw))
    } catch {}
    setCarregado(true)
  }, [])

  // Persiste quando muda
  useEffect(() => {
    if (carregado) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itens))
      } catch {}
    }
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
      value={{ itens, adicionar, remover, limpar, temNoCarrinho, subtotal, desconto, total, temDesconto }}
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
