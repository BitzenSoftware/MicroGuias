import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { confirmarPagamento } from '@/lib/pedidos'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // Valida o segredo do webhook (configurado na URL do AbacatePay)
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('webhookSecret')
  if (secret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Segredo inválido' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  // Extrai o id da cobrança PIX do payload (estrutura pode variar)
  const data = (payload.data ?? payload) as Record<string, unknown>
  const pixObj = (data.pixQrCode ?? data) as Record<string, unknown>
  const abacateId = (pixObj.id ?? data.id) as string | undefined

  if (!abacateId) {
    return NextResponse.json({ ok: true, ignored: 'sem id' })
  }

  const supabase = createServiceClient()
  const { data: pedido } = await supabase
    .from('loja_pedidos')
    .select('id')
    .eq('abacatepay_id', abacateId)
    .single()

  if (pedido) {
    await confirmarPagamento(supabase, pedido.id)
  }

  return NextResponse.json({ ok: true })
}
