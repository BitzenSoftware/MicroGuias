import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checarPix } from '@/lib/abacatepay'
import { confirmarPagamento } from '@/lib/pedidos'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: pedido } = await supabase
    .from('loja_pedidos')
    .select('id, user_id, status, abacatepay_id')
    .eq('id', id)
    .single()

  if (!pedido || pedido.user_id !== user.id) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  if (pedido.status === 'pago') {
    return NextResponse.json({ status: 'pago' })
  }

  // Consulta o AbacatePay
  if (pedido.abacatepay_id) {
    try {
      const { status } = await checarPix(pedido.abacatepay_id)
      if (status === 'PAID') {
        await confirmarPagamento(supabase, pedido.id)
        return NextResponse.json({ status: 'pago' })
      }
    } catch {
      // mantém aguardando em caso de erro transitório
    }
  }

  return NextResponse.json({ status: pedido.status })
}
